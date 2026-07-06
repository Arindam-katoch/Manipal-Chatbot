import { NextRequest, NextResponse } from 'next/server';
import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { supabase } from '@/utils/db';
import { embedWithBackoff } from '@/utils/embeddings';

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Get the latest user query
    const latestUserMessage = messages[messages.length - 1];
    if (latestUserMessage.role !== 'user') {
      return NextResponse.json({ error: 'Latest message must be from user' }, { status: 400 });
    }

    const query = latestUserMessage.content;

    // Step 1: Generate a 768-dimensional embedding of the query
    const queryEmbedding = await embedWithBackoff(query);

    // Step 2: Execute similarity searches in parallel by fetching the records and scoring in-memory
    let announcements: any[] = [];
    let documents: any[] = [];

    const [annResult, docResult] = await Promise.all([
      supabase.from('announcements').select('title, content, embedding'),
      supabase.from('document_embeddings').select('content, embedding, documents ( title )')
    ]);

    if (!annResult.error && annResult.data) {
      announcements = annResult.data
        .map((ann: any) => {
          const emb = typeof ann.embedding === 'string' ? JSON.parse(ann.embedding) : ann.embedding;
          const similarity = cosineSimilarity(queryEmbedding, emb);
          return {
            title: ann.title,
            content: ann.content,
            similarity
          };
        })
        .filter(ann => ann.similarity > 0.4)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3);
    }

    if (!docResult.error && docResult.data) {
      documents = docResult.data
        .map((de: any) => {
          const emb = typeof de.embedding === 'string' ? JSON.parse(de.embedding) : de.embedding;
          const similarity = cosineSimilarity(queryEmbedding, emb);
          return {
            content: de.content,
            title: de.documents ? (de.documents as any).title : 'Unknown Document',
            similarity
          };
        })
        .filter(doc => doc.similarity > 0.5)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
    }

    // Step 3: Append retrieved contexts to system prompt
    let contextStr = '';
    
    if (announcements.length > 0) {
      contextStr += '### RELEVANT ANNOUNCEMENTS:\n';
      announcements.forEach((ann, index) => {
        contextStr += `[Announcement #${index + 1}] Title: ${ann.title}\nContent: ${ann.content} (Similarity: ${(ann.similarity * 100).toFixed(1)}%)\n\n`;
      });
    }

    if (documents.length > 0) {
      contextStr += '### RELEVANT DOCUMENTS & KNOWLEDGE BASE:\n';
      documents.forEach((doc, index) => {
        contextStr += `[Document Chunk #${index + 1}] Source: ${doc.title}\nContent: ${doc.content} (Similarity: ${(doc.similarity * 100).toFixed(1)}%)\n\n`;
      });
    }

    const systemPrompt = `You are a helpful and intelligent virtual assistant for MIT Bengaluru (Campus AI).
Use the following context to answer the user query as accurately as possible. 
If the query cannot be answered using the context, provide a polite response using your general knowledge but note the source.
Ensure you formats response well using markdown structure where appropriate.

${contextStr ? `--- \nRetrieved Context:\n${contextStr}---` : 'No direct context matches found in the knowledge base.'}`;

    // Step 4: Stream response using Groq (Llama 3.3 70b) via Vercel AI SDK
    const result = await streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });

    return result.toUIMessageStreamResponse();


  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

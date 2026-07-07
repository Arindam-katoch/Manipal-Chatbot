import { NextRequest, NextResponse } from 'next/server';
import { groq } from '@ai-sdk/groq';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createTextStreamResponse, streamText, toTextStream } from 'ai';
import { supabase } from '@/utils/db';
import { embedWithBackoff } from '@/utils/embeddings';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATED_AI_API_KEY || '',
});

/** Extra system instructions per tool chip selected in the chat input. */
const TOOL_INSTRUCTIONS: Record<string, string> = {
  resume:
    'The user has enabled Resume Scanner mode: focus on resume/ATS feedback for MIT Bengaluru placement drives — clear action verbs, quantified results, single-page format, standard sections.',
  placement:
    'The user has enabled Placement Q&A mode: focus on placement statistics, companies, packages, interview rounds, and recruitment schedules, grounding answers in the retrieved context wherever possible.',
  study:
    'The user has enabled Study Aid mode: focus on explaining concepts clearly and helping with coursework, exams, and study planning.',
};

interface RetrievedItem {
  title: string;
  content: string;
  similarity: number;
}

/** pgvector columns arrive as JSON strings through PostgREST. */
function parseEmbedding(value: unknown): number[] | null {
  if (Array.isArray(value)) return value as number[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return -1;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return -1;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function rankBySimilarity(
  rows: { title: string; content: string; embedding: unknown }[],
  queryEmbedding: number[],
  threshold: number,
  count: number
): RetrievedItem[] {
  return rows
    .map((row) => {
      const embedding = parseEmbedding(row.embedding);
      return {
        title: row.title,
        content: row.content,
        similarity: embedding ? cosineSimilarity(embedding, queryEmbedding) : -1,
      };
    })
    .filter((row) => row.similarity > threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, count);
}

/**
 * SQL-side search via the match_* RPCs when schema.sql has been applied;
 * otherwise fall back to fetching the (small) corpus and ranking in-process.
 */
async function retrieveContext(queryEmbedding: number[]) {
  const docResult = await supabase.rpc('match_document_embeddings', {
    query_embedding: queryEmbedding,
    match_threshold: 0.5,
    match_count: 5,
  });

  let documents: RetrievedItem[] = !docResult.error && docResult.data ? (docResult.data as RetrievedItem[]) : [];

  if (docResult.error) {
    const { data } = await supabase
      .from('document_embeddings')
      .select('content, embedding, documents(title)');
    if (data) {
      const rows = data.map((row: any) => ({
        title: row.documents?.title ?? 'Knowledge base document',
        content: row.content,
        embedding: row.embedding,
      }));
      documents = rankBySimilarity(rows, queryEmbedding, 0.5, 5);
    }
  }

  return { documents };
}

export async function POST(request: NextRequest) {
  try {
    const { messages, tool } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Get the latest user query
    const latestUserMessage = messages[messages.length - 1];
    if (latestUserMessage.role !== 'user') {
      return NextResponse.json({ error: 'Latest message must be from user' }, { status: 400 });
    }

    const query = latestUserMessage.content;

    // Steps 1+2: embed the query and run pgvector similarity searches.
    // Retrieval failures must never block an answer — degrade to no context.
    let documents: RetrievedItem[] = [];

    try {
      const queryEmbedding = await embedWithBackoff(query);
      const retrieved = await retrieveContext(queryEmbedding);
      documents = retrieved.documents;
    } catch (retrievalError) {
      console.warn('RAG retrieval failed, answering without context:', retrievalError);
    }

    // Step 3: Append retrieved contexts to system prompt
    let contextStr = '';

    if (documents.length > 0) {
      contextStr += '### RELEVANT DOCUMENTS & KNOWLEDGE BASE:\n';
      documents.forEach((doc, index) => {
        contextStr += `[Document Chunk #${index + 1}] Source: ${doc.title}\nContent: ${doc.content} (Similarity: ${(doc.similarity * 100).toFixed(1)}%)\n\n`;
      });
    }

    const toolInstruction = tool && TOOL_INSTRUCTIONS[tool] ? `\n${TOOL_INSTRUCTIONS[tool]}\n` : '';

    const systemPrompt = `You are a helpful and intelligent virtual assistant for MIT Bengaluru (Campus AI).
Only use the following retrieved knowledge base context to answer the user query.
If the query cannot be answered using the context, state that the information is not available in the knowledge base. Do not use general or external knowledge.
Ensure you format responses well using markdown structure where appropriate.
${toolInstruction}
${contextStr ? `--- \nRetrieved Context:\n${contextStr}---` : 'No direct context matches found in the knowledge base.'}`;

    // Step 4: Stream the response. Force the use of Gemini API instead of Groq.
    const model = google('gemini-2.5-flash');

    const result = streamText({
      model,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Plain text stream — the chat UI reads chunks and renders them live.
    return createTextStreamResponse({ stream: toTextStream({ stream: result.stream }) });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

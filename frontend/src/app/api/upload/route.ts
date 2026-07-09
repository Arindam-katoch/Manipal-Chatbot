if (typeof global !== 'undefined') {
  if (!(global as any).DOMMatrix) (global as any).DOMMatrix = class {};
  if (!(global as any).ImageData) (global as any).ImageData = class {};
  if (!(global as any).Path2D) (global as any).Path2D = class {};
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/db';
import * as XLSX from 'xlsx';
import { embedWithBackoff } from '@/utils/embeddings';
const { PDFParse } = require('pdf-parse');

export const runtime = 'nodejs';

// Helper for chunking text to max size 1000 characters, overlap 150 characters, split at nearest word/space
function chunkText(text: string, maxSize = 1000, overlap = 150): string[] {
  const chunks: string[] = [];
  let startIndex = 0;

  // Clean double spaces or newlines to keep chunks neat
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');

  while (startIndex < cleanText.length) {
    let endIndex = startIndex + maxSize;
    if (endIndex >= cleanText.length) {
      chunks.push(cleanText.slice(startIndex).trim());
      break;
    }

    // Find nearest word boundary before endIndex
    let splitIndex = endIndex;
    while (splitIndex > startIndex && !/\s/.test(cleanText[splitIndex])) {
      splitIndex--;
    }

    // If no space/newline, split exactly at endIndex
    if (splitIndex === startIndex) {
      splitIndex = endIndex;
    }

    chunks.push(cleanText.slice(startIndex, splitIndex).trim());
    startIndex = splitIndex - overlap;

    if (startIndex >= splitIndex) {
      startIndex = splitIndex; // Prevent infinite loop if overlap is too large
    }
  }

  return chunks.filter(c => c.length > 0);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    let parsedText = '';
    const fileType = file.name.split('.').pop()?.toLowerCase() || '';

    // Step 1: Parse File Contents
    if (fileType === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      // pdf-parse v2 exposes a class: new PDFParse({ data }).getText().
      const parser = new PDFParse({ data: buffer });
      try {
        const data = await parser.getText();
        parsedText = data.text;
      } finally {
        await parser.destroy();
      }
    } else if (['xlsx', 'xls'].includes(fileType)) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
        if (rows.length > 0) {
          parsedText += `### Sheet: ${sheetName}\n\n`;
          rows.forEach((row, rowIndex) => {
            const line = '| ' + row.map(cell => String(cell ?? '').replace(/\|/g, '\\|')).join(' | ') + ' |';
            parsedText += line + '\n';
            if (rowIndex === 0) {
              const separator = '| ' + row.map(() => '---').join(' | ') + ' |';
              parsedText += separator + '\n';
            }
          });
          parsedText += '\n';
        }
      }
    } else {
      // Treat as plain text
      parsedText = await file.text();
    }

    if (!parsedText.trim()) {
      return NextResponse.json({ error: 'File content is empty' }, { status: 400 });
    }

    // Step 2: Chunk Text
    const chunks = chunkText(parsedText);

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'No text chunks generated' }, { status: 400 });
    }

    // Step 3: Insert Document Meta & Embeddings (Sequential Batches of 5)
    let docId: string | null = null;

    try {
      // Insert main document row
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          title: file.name,
          file_type: file.type || fileType
        })
        .select('id')
        .single();

      if (docError || !docData) {
        throw docError || new Error('Failed to create document record');
      }
      docId = docData.id;

      // Process and insert chunks in batches of 5
      for (let i = 0; i < chunks.length; i += 5) {
        const batch = chunks.slice(i, i + 5);
        const batchEmbeddings = [];

        // Generate embeddings for the batch
        for (let j = 0; j < batch.length; j++) {
          const content = batch[j];
          const embedding = await embedWithBackoff(content);
          batchEmbeddings.push({
            document_id: docId,
            content,
            embedding,
            chunk_index: i + j,
          });
        }

        // Execute batch insertion
        const { error: batchError } = await supabase
          .from('document_embeddings')
          .insert(batchEmbeddings);

        if (batchError) {
          throw batchError;
        }
      }

      return NextResponse.json({
        success: true,
        documentId: docId,
        chunksCount: chunks.length,
      });

    } catch (dbError: any) {
      // Clean up document row if insertion failed
      if (docId) {
        await supabase.from('documents').delete().eq('id', docId);
      }
      throw dbError;
    }


  } catch (error: any) {
    console.error('Ingestion API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

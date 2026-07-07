import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get document metadata
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, title, file_type, upload_timestamp')
      .eq('id', id)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get corresponding text chunks
    const { data: chunks, error: chunksError } = await supabase
      .from('document_embeddings')
      .select('id, content, chunk_index')
      .eq('document_id', id)
      .order('chunk_index', { ascending: true });

    if (chunksError) {
      throw chunksError;
    }

    return NextResponse.json({
      document,
      chunks: chunks || [],
    });
  } catch (error: any) {
    console.error('GET /api/documents/[id] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Document and associated vector chunks deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/documents/[id] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


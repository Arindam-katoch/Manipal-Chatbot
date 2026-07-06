import { NextResponse } from 'next/server';
import { supabase } from '@/utils/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        file_type,
        upload_timestamp,
        document_embeddings (
          id
        )
      `)
      .order('upload_timestamp', { ascending: false });

    if (error) {
      throw error;
    }

    const formattedDocs = (data || []).map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      file_type: doc.file_type,
      upload_timestamp: doc.upload_timestamp,
      chunks_count: doc.document_embeddings ? doc.document_embeddings.length : 0,
    }));
    
    return NextResponse.json(formattedDocs);
  } catch (error: any) {
    console.error('GET /api/documents Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


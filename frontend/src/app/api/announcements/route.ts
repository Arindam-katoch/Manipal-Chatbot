import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/db';

export const dynamic = 'force-dynamic';
import { embedWithBackoff } from '@/utils/embeddings';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, content, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('GET /api/announcements Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Format for vectorization
    const formattedText = `ANNOUNCEMENT: ${title}\n\n${content}`;

    // Generate 3072-dimensional embedding
    const embedding = await embedWithBackoff(formattedText);

    // Save to Supabase announcements table
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        embedding
      })
      .select('id, title, content, created_at')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      announcement: data,
    });
  } catch (error: any) {
    console.error('POST /api/announcements Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


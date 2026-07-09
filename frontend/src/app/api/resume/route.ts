// pdf-parse pulls in pdf.js, which expects a few browser globals to exist.
// Shim them before the require so parsing works in the Node runtime.
if (typeof global !== 'undefined') {
  if (!(global as any).DOMMatrix) (global as any).DOMMatrix = class {};
  if (!(global as any).ImageData) (global as any).ImageData = class {};
  if (!(global as any).Path2D) (global as any).Path2D = class {};
}

import { NextRequest, NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createTextStreamResponse, streamText, toTextStream } from 'ai';
const { PDFParse } = require('pdf-parse');

export const runtime = 'nodejs';

const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATED_AI_API_KEY ||
    '',
});

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_RESUME_CHARS = 20000; // resumes are short; guard against giant PDFs

const ATS_SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) resume checker and career coach for the placement cell at MIT Bengaluru. You evaluate a candidate's resume exactly the way a modern ATS plus a human recruiter would during a campus placement drive.

Analyse ONLY the resume text provided by the user. Never invent experience, skills, or details that are not present. If a section is missing, say so explicitly.

Respond in clean, well-structured GitHub-flavoured markdown using this exact outline:

## ATS Score: X / 100
One or two sentences summarising overall readiness, then a short verdict line like **Verdict:** Strong / Needs work / Not ready.

## Strengths
- 3-5 concrete things the resume does well (quote or reference specifics).

## Issues Found
Group findings and be specific and actionable:
- **Formatting & parseability** - columns/tables/graphics/headers an ATS may misread, non-standard section titles, fonts, length (should be a single page for freshers).
- **Missing sections** - e.g. contact info, professional summary, skills, projects, education, links (GitHub/LinkedIn).
- **Weak content** - vague bullets, no action verbs, responsibilities instead of achievements.
- **Quantification** - bullets that lack measurable impact (numbers, %, scale).

## Keyword & Skills Match
Assess the hard skills and keywords present. If the user names a target role or company, evaluate the resume specifically against typical requirements for that role and list important **missing keywords**. Otherwise assess against common SDE / analyst campus roles.

## Top Recommendations
A numbered, prioritised list (most impactful first) of specific rewrites and fixes. Where useful, show a **Before -> After** rewrite of one or two weak bullet points.

Keep the tone constructive and encouraging. Be concise but thorough. Do not include any preamble before the first heading.`;

async function extractText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') {
    // pdf-parse v2 exposes a class: new PDFParse({ data }).getText().
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text || '';
    } finally {
      await parser.destroy();
    }
  }
  // .txt and other plain-text formats
  return await file.text();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const note = (formData.get('note') as string | null)?.trim() || '';

    if (!file) {
      return NextResponse.json({ error: 'No resume file was provided.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: 'That file is larger than 8 MB. Please upload a smaller PDF.' },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['pdf', 'txt'].includes(ext)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF or a .txt resume.' },
        { status: 400 }
      );
    }

    let resumeText = '';
    try {
      const raw = await extractText(file);
      resumeText = raw
        .replace(/\r\n/g, '\n')
        .replace(/[^\S\n]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } catch (parseError) {
      console.error('Resume parse error:', parseError);
      return NextResponse.json(
        { error: 'Could not read that file. If it is a scanned/image PDF, export a text-based PDF and try again.' },
        { status: 400 }
      );
    }

    if (resumeText.length < 80) {
      return NextResponse.json(
        {
          error:
            'Not enough readable text was found in this document. It may be an image-only or scanned PDF - please upload a text-based resume.',
        },
        { status: 400 }
      );
    }

    if (resumeText.length > MAX_RESUME_CHARS) {
      resumeText = resumeText.slice(0, MAX_RESUME_CHARS);
    }

    const userPrompt = `${
      note
        ? `The candidate added this note about the role/context they are targeting:\n"${note}"\n\n`
        : ''
    }Here is the resume text extracted from "${file.name}":\n\n"""\n${resumeText}\n"""\n\nProduce the full ATS review now.`;

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: ATS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Plain text stream - the chat UI reads chunks and renders them live.
    return createTextStreamResponse({ stream: toTextStream({ stream: result.stream }) });
  } catch (error: any) {
    console.error('Resume API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

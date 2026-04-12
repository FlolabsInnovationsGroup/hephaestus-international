import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'CV file is required' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Only PDF, DOC, and DOCX files are allowed' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'CV file must be 10MB or smaller' }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const blob = await put(`applicants/cv/${Date.now()}-${safeName}`, file, {
    access: 'public',
    addRandomSuffix: true,
  });

  return NextResponse.json({
    ok: true,
    cvFileName: file.name,
    cvUrl: blob.url,
    pathname: blob.pathname,
    contentType: file.type,
    size: file.size,
  });
}

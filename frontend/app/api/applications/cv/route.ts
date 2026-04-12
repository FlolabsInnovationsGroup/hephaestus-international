import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'CV uploads are not configured yet in this environment.' }, { status: 503 });
  }

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

  try {
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
  } catch (error) {
    console.error('CV upload failed', error);
    return NextResponse.json({ error: 'CV upload failed. Please try again in the deployed environment.' }, { status: 500 });
  }
}

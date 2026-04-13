import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN || '';
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const runtime = 'nodejs';

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

  const token = getBlobToken();

  if (!token) {
    return NextResponse.json({
      error: 'CV upload is unavailable because BLOB_READ_WRITE_TOKEN is missing in this deployment environment.',
      code: 'BLOB_TOKEN_MISSING',
    }, { status: 503 });
  }

  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const blob = await put(`applicants/cv/${Date.now()}-${safeName}`, file, {
      access: 'private',
      addRandomSuffix: true,
      token,
    });

    return NextResponse.json({
      ok: true,
      cvFileName: file.name,
      cvUrl: blob.downloadUrl || `${blob.url}?download=1`,
      pathname: blob.pathname,
      blobUrl: blob.url,
      downloadUrl: blob.downloadUrl || `${blob.url}?download=1`,
      contentType: file.type,
      size: file.size,
      storage: 'blob',
    });
  } catch (error) {
    console.error('CV upload failed', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      hasToken: Boolean(token),
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
    });
    return NextResponse.json({
      error: 'CV upload failed. The file is valid, but storage is unavailable right now.',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

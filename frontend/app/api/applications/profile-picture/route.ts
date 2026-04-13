import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN || '';
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Profile picture is required' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, and WEBP images are allowed' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'Profile picture must be 5MB or smaller' }, { status: 400 });
  }

  const token = getBlobToken();
  if (!token) {
    return NextResponse.json({ error: 'Profile picture upload is unavailable right now because blob storage is not configured.' }, { status: 500 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  try {
    const blob = await put(`applicants/profile-pictures/${Date.now()}-${safeName}`, file, {
      access: 'private',
      addRandomSuffix: true,
      token,
    });

    return NextResponse.json({ ok: true, profilePictureUrl: blob.url, fileName: file.name });
  } catch (error) {
    console.error('Profile picture upload failed', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      hasToken: Boolean(token),
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
    });
    return NextResponse.json({
      error: 'Profile picture upload failed. Storage is unavailable right now.',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

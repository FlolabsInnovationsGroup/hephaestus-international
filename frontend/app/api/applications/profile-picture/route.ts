import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const blob = await put(`applicants/profile-pictures/${Date.now()}-${safeName}`, file, {
    access: 'public',
    addRandomSuffix: true,
  });

  return NextResponse.json({ ok: true, profilePictureUrl: blob.url, fileName: file.name });
}

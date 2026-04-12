import { NextResponse } from 'next/server';
import { logoutPreview } from '@/lib/application-store';

export async function POST() {
  await logoutPreview();
  return NextResponse.json({ ok: true });
}

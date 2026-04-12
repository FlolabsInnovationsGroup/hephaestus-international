import { NextResponse } from 'next/server';
import { getSessionUser, sendApplicantMessage } from '@/lib/application-store';

export async function POST(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  if (!body.text) return NextResponse.json({ error: 'Message text required' }, { status: 400 });
  const reply = await sendApplicantMessage(viewer.id, String(body.text));
  return NextResponse.json({ ok: true, reply });
}

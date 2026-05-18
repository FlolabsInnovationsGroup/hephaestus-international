import { NextResponse } from 'next/server';
import { getSessionUser, sendApplicantMessage, sendHrMessage } from '@/lib/application-store';

export async function POST(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  if (!body.text) return NextResponse.json({ error: 'Message text required' }, { status: 400 });

  if (viewer.hrBinaryRole && body.applicantId) {
    const firstName = (viewer.firstName ?? '').toLowerCase();
    const author: 'paula' | 'john' | 'oliver' =
      firstName === 'john' ? 'john' : firstName === 'oliver' ? 'oliver' : 'paula';
    const reply = await sendHrMessage(String(body.applicantId), String(body.text), author);
    return NextResponse.json({ ok: true, reply });
  }

  const reply = await sendApplicantMessage(viewer.id, String(body.text));
  return NextResponse.json({ ok: true, reply });
}

import { NextResponse } from 'next/server';
import { getSessionUser, submitStageResponse } from '@/lib/application-store';

export async function POST(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer || viewer.role !== 'applicant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();
  const resourceId = String(body?.resourceId ?? '').trim();
  const responseText = String(body?.responseText ?? '').trim();
  if (!resourceId || !responseText) {
    return NextResponse.json({ error: 'Missing resourceId or responseText' }, { status: 400 });
  }
  await submitStageResponse({ resourceId, applicantId: viewer.id, responseText });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { deleteApplicantPermanently } from '@/lib/application-db';
import { getSessionUser } from '@/lib/application-store';

export async function POST(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer || !viewer.hrBinaryRole) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const applicantId = String(body.applicantId ?? '').trim();
  if (!applicantId) {
    return NextResponse.json({ error: 'Missing applicantId' }, { status: 400 });
  }

  const result = await deleteApplicantPermanently(applicantId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Delete failed' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

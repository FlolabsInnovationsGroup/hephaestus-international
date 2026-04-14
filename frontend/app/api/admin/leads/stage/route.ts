import { NextResponse } from 'next/server';
import { getSessionUser, saveApplicantStage } from '@/lib/application-store';
import { syncApplicantToChronos } from '@/lib/chronos-sync';

export async function POST(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer || !viewer.hrBinaryRole) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();
  if (!body.applicantId || !body.stage) {
    return NextResponse.json({ error: 'Missing applicantId or stage' }, { status: 400 });
  }
  const applicant = await saveApplicantStage(String(body.applicantId), body.stage, body.status);
  const chronosSync = applicant && (body.stage === 'agreement_signed' || body.stage === 'chronos_synced' || body.stage === 'joined')
    ? await syncApplicantToChronos(applicant)
    : null;
  return NextResponse.json({ ok: true, applicant, chronosSync });
}

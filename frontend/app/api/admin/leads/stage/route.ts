import { NextResponse } from 'next/server';
import { getSessionUser, saveApplicantStage } from '@/lib/application-store';
import { syncApplicantToChronos, revokeChronosAccess, grantChronosAccess } from '@/lib/chronos-sync';

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
  const incomingStatus = String(body.status ?? '').toLowerCase();

  if ((incomingStatus === 'terminated' || incomingStatus === 'graduated') && applicant) {
    const revoke = await revokeChronosAccess(applicant);
    return NextResponse.json({ ok: true, applicant, chronosSync: null, chronosRevoke: revoke });
  }

  const shouldGrant = applicant && incomingStatus === 'joined';
  const chronosGrant = shouldGrant ? await grantChronosAccess(applicant) : null;

  const shouldSync = applicant && (
    body.stage === 'agreement_signed' ||
    body.stage === 'chronos_synced' ||
    body.stage === 'joined' ||
    incomingStatus === 'signed' ||
    incomingStatus === 'joined'
  );
  const chronosSync = shouldSync ? await syncApplicantToChronos(applicant) : null;
  return NextResponse.json({ ok: true, applicant, chronosSync, chronosGrant });
}

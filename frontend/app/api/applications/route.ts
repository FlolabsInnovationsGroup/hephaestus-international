import { NextResponse } from 'next/server';
import { completeApplicantStageReviewBatch, createApplicantAccount, getApplicantById, getSessionUser } from '@/lib/application-store';
import { syncApplicantToChronos } from '@/lib/chronos-sync';

export async function GET() {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const applicant = await getApplicantById(viewer.id);
  return NextResponse.json({ applicant });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.firstName || !body.lastName || !body.email || !body.password || !body.roleAppliedFor) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!body.safeSendersConfirmed || !body.communicationConsent) {
    return NextResponse.json({ error: 'Required consents must be accepted' }, { status: 400 });
  }

  const applicant = await createApplicantAccount({
    email: String(body.email).toLowerCase(),
    password: String(body.password),
    role: 'applicant',
    firstName: String(body.firstName),
    lastName: String(body.lastName),
    phoneNumber: `${String(body.phoneCountryCode ?? '')} ${String(body.phoneNumber ?? '')}`.trim(),
    country: String(body.country ?? ''),
    stateRegion: String(body.stateRegion ?? ''),
    city: String(body.city ?? ''),
    latitude: Number(body.latitude ?? 0),
    longitude: Number(body.longitude ?? 0),
    linkedinUrl: String(body.linkedinUrl ?? ''),
    education: String(body.education ?? ''),
    source: String(body.source ?? ''),
    referralName: String(body.referralName ?? ''),
    cvFileName: String(body.cvFileName ?? ''),
    cvUrl: String(body.cvUrl ?? ''),
    roleAppliedFor: String(body.roleAppliedFor),
    stage: 'application_submitted',
    status: 'waiting',
    safeSendersConfirmed: Boolean(body.safeSendersConfirmed),
    communicationConsent: Boolean(body.communicationConsent),
  });

  for (let i = 0; i < 5; i++) {
    const result = await completeApplicantStageReviewBatch(applicant.id);
    if (!result.stageChanged) break;
  }

  let syncWarning: string | null = null;
  try {
    await syncApplicantToChronos(applicant);
  } catch (error) {
    syncWarning = error instanceof Error ? error.message : 'Chronos sync failed';
  }

  return NextResponse.json({ ok: true, applicantId: applicant.id, created: true, syncWarning });
}

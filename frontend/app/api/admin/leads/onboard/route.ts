import { NextResponse } from 'next/server';
import { getApplicantById, getSessionUser } from '@/lib/application-store';
import { canOnboardApplicant, onboardApplicantToChronos } from '@/lib/chronos-sync';

export async function POST(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer || !viewer.hrBinaryRole) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  if (!body.applicantId) {
    return NextResponse.json({ error: 'Missing applicantId' }, { status: 400 });
  }

  const applicant = await getApplicantById(String(body.applicantId));
  if (!applicant) {
    return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
  }

  if (!canOnboardApplicant(applicant)) {
    return NextResponse.json({ error: 'Onboard is only available after the applicant reaches signed status.' }, { status: 409 });
  }

  const chronosSync = await onboardApplicantToChronos(applicant);

  return NextResponse.json({ ok: true, applicant, chronosSync });
}

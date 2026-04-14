import { NextResponse } from 'next/server';
import { getSessionUser, saveProfileUpdates } from '@/lib/application-store';
import { syncApplicantToChronos } from '@/lib/chronos-sync';

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

  const updated = await saveProfileUpdates(applicantId, {
    firstName: String(body.firstName ?? ''),
    lastName: String(body.lastName ?? ''),
    email: String(body.email ?? '').toLowerCase(),
    phoneNumber: String(body.phoneNumber ?? ''),
    linkedinUrl: String(body.linkedinUrl ?? ''),
    city: String(body.city ?? ''),
    country: String(body.country ?? ''),
    education: String(body.education ?? ''),
    source: String(body.source ?? ''),
    roleAppliedFor: String(body.roleAppliedFor ?? ''),
    notes: String(body.notes ?? ''),
  });

  if (!updated) {
    return NextResponse.json({ error: 'Could not update this lead profile.' }, { status: 404 });
  }

  await syncApplicantToChronos(updated).catch(() => null);
  return NextResponse.json({ ok: true, applicant: updated });
}

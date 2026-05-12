import { NextResponse } from 'next/server';
import { getSessionUser, saveProfileUpdates } from '@/lib/application-store';
import { syncApplicantToChronos } from '@/lib/chronos-sync';

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? '').trim()).filter(Boolean);
}

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

  const alternateEmails = toStringArray(body.alternateEmails).map((e) => e.toLowerCase());
  const phoneNumbers = toStringArray(body.phoneNumbers);
  const linkedinUrls = toStringArray(body.linkedinUrls);
  const cities = toStringArray(body.cities);
  const countries = toStringArray(body.countries);

  const updated = await saveProfileUpdates(applicantId, {
    firstName: String(body.firstName ?? ''),
    lastName: String(body.lastName ?? ''),
    email: String(body.email ?? '').toLowerCase(),
    phoneNumber: phoneNumbers.join(', '),
    linkedinUrl: linkedinUrls.join(', '),
    city: cities.join(', '),
    country: countries.join(', '),
    education: String(body.education ?? ''),
    source: String(body.source ?? ''),
    roleAppliedFor: String(body.roleAppliedFor ?? ''),
    notes: String(body.notes ?? ''),
    alternateEmails,
    notionTeamMemberPageUrl: String(body.notionTeamMemberPageUrl ?? ''),
  });

  if (!updated) {
    return NextResponse.json({ error: 'Could not update this lead profile.' }, { status: 404 });
  }

  await syncApplicantToChronos(updated).catch(() => null);
  return NextResponse.json({ ok: true, applicant: updated });
}

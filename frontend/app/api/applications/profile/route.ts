import { NextResponse } from 'next/server';
import { getSessionUser, saveProfileUpdates } from '@/lib/application-store';

export async function POST(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const updated = await saveProfileUpdates(viewer.id, {
    firstName: body.firstName ?? viewer.firstName,
    lastName: body.lastName ?? viewer.lastName,
    phoneNumber: body.phoneNumber ?? viewer.phoneNumber,
    country: body.country ?? viewer.country,
    stateRegion: body.stateRegion ?? viewer.stateRegion,
    city: body.city ?? viewer.city,
    linkedinUrl: body.linkedinUrl ?? viewer.linkedinUrl,
    education: body.education ?? viewer.education,
    profilePictureUrl: body.profilePictureUrl ?? viewer.profilePictureUrl,
  });
  return NextResponse.json({ ok: true, applicant: updated });
}

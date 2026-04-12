import { NextResponse } from 'next/server';
import { getApplicantsForAdmin, getSessionUser } from '@/lib/application-store';

export async function GET() {
  const viewer = await getSessionUser();
  if (!viewer || !viewer.hrBinaryRole) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const leads = await getApplicantsForAdmin();
  return NextResponse.json({ leads });
}

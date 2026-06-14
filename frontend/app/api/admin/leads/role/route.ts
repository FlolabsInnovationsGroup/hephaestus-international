import { NextResponse } from 'next/server';
import { getSessionUser, updateApplicantRole } from '@/lib/application-store';

const VALID_ROLES = new Set(['member', 'team_lead', 'admin', 'applicant', 'hr']);

export async function POST(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer || !viewer.hrBinaryRole) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const applicantId = String(body.applicantId ?? '').trim();
  const role = String(body.role ?? '').trim();
  const hrBinaryRole = Boolean(body.hrBinaryRole);

  if (!applicantId) {
    return NextResponse.json({ error: 'Missing applicantId' }, { status: 400 });
  }
  if (!VALID_ROLES.has(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const updated = await updateApplicantRole(applicantId, role, hrBinaryRole);
  if (!updated) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, applicant: updated });
}

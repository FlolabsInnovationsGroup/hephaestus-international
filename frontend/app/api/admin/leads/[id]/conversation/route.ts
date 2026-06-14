import { NextResponse } from 'next/server';
import { getConversationForApplicant, getSessionUser } from '@/lib/application-store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getSessionUser();
  if (!viewer || !viewer.hrBinaryRole) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing lead id' }, { status: 400 });
  }

  const conversation = await getConversationForApplicant(id);
  return NextResponse.json({ conversation });
}

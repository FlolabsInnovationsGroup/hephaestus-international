import { NextResponse } from 'next/server';
import { loginPreview } from '@/lib/application-store';

export async function POST(request: Request) {
  const body = await request.json();
  const user = await loginPreview(body.email ?? '', body.password ?? '');
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, role: user.role, hrBinaryRole: user.hrBinaryRole ?? false });
}

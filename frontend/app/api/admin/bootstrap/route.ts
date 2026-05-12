import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  if (body.secret !== secret) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const email = String(body.email ?? '').toLowerCase().trim();
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  if (!sql) return NextResponse.json({ error: 'No DB' }, { status: 503 });
  const rows = await sql`
    update website_applicants
    set hr_binary_role = true, updated_at = now()
    where lower(email) = ${email}
    returning id, email, hr_binary_role
  `;
  if (rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ ok: true, user: rows[0] });
}

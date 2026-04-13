import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/application-store';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer || !viewer.hrBinaryRole) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const body = await request.json();
  const reviewId = String(body.reviewId ?? '');
  const status = String(body.status ?? '');
  const notes = typeof body.notes === 'string' ? body.notes : '';

  if (!reviewId || !['pending', 'confirmed_duplicate', 'different_people', 'merged'].includes(status)) {
    return NextResponse.json({ error: 'Missing reviewId or invalid status' }, { status: 400 });
  }

  await sql`
    create table if not exists applicant_duplicate_reviews (
      id uuid primary key default gen_random_uuid(),
      primary_applicant_id uuid not null,
      duplicate_applicant_id uuid not null,
      status text not null default 'pending',
      confidence_score bigint not null default 0,
      reasons jsonb not null default '[]'::jsonb,
      reviewed_by_id uuid,
      reviewed_at timestamptz,
      notes text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint applicant_duplicate_reviews_pair_unique unique (primary_applicant_id, duplicate_applicant_id)
    );
  `;

  const rows = await sql`
    update applicant_duplicate_reviews
    set status = ${status}, notes = ${notes || null}, reviewed_at = now(), updated_at = now()
    where id = ${reviewId}
    returning id, status, notes, reviewed_at
  `;

  return NextResponse.json({ ok: true, review: rows[0] ?? null });
}

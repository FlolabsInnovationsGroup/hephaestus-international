import { NextResponse } from 'next/server';
import { countHrApplicants, getSessionUser, searchHrApplicants } from '@/lib/application-store';

export async function GET(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer || !viewer.hrBinaryRole) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const searchParams = new URL(request.url).searchParams;
  const filters = {
    q: (searchParams.get('q') ?? '').toLowerCase(),
    stage: searchParams.get('stage') ?? '',
    status: searchParams.get('status') ?? '',
    source: searchParams.get('source') ?? '',
    country: searchParams.get('country') ?? '',
    city: searchParams.get('city') ?? '',
    sort: searchParams.get('sort') ?? 'joined_desc',
    joinedFrom: searchParams.get('joinedFrom') ?? '',
    joinedTo: searchParams.get('joinedTo') ?? '',
    visitedFrom: searchParams.get('visitedFrom') ?? '',
    visitedTo: searchParams.get('visitedTo') ?? '',
    duplicateReview: searchParams.get('duplicateReview') ?? '',
    hasNotion: searchParams.get('hasNotion') ?? '',
  };
  const offset = Number(searchParams.get('offset') ?? 0);
  const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') ?? 50)));

  const [total, leads] = await Promise.all([
    countHrApplicants(filters),
    searchHrApplicants(filters, { offset, limit }),
  ]);

  return NextResponse.json({
    leads,
    total,
    hasMore: offset + leads.length < total,
  });
}

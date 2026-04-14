import { NextResponse } from 'next/server';
import { getApplicantsForAdmin, getSessionUser } from '@/lib/application-store';

function sameDayValue(dateString: string) {
  return new Date(dateString).toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer || !viewer.hrBinaryRole) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const searchParams = new URL(request.url).searchParams;
  const q = (searchParams.get('q') ?? '').toLowerCase();
  const stage = searchParams.get('stage') ?? '';
  const status = searchParams.get('status') ?? '';
  const source = searchParams.get('source') ?? '';
  const country = searchParams.get('country') ?? '';
  const city = searchParams.get('city') ?? '';
  const sort = searchParams.get('sort') ?? 'joined_desc';
  const joinedFrom = searchParams.get('joinedFrom') ?? '';
  const joinedTo = searchParams.get('joinedTo') ?? '';
  const visitedFrom = searchParams.get('visitedFrom') ?? '';
  const visitedTo = searchParams.get('visitedTo') ?? '';
  const duplicateReview = searchParams.get('duplicateReview') ?? '';
  const offset = Number(searchParams.get('offset') ?? 0);
  const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') ?? 50)));

  const allLeads = await getApplicantsForAdmin();
  const filtered = allLeads.filter((lead) => {
    const haystack = [lead.firstName, lead.lastName, lead.email, lead.roleAppliedFor, lead.source, lead.city, lead.country, lead.education, lead.linkedinUrl, lead.notes].join(' ').toLowerCase();
    const matchesQ = !q || haystack.includes(q);
    const matchesStage = !stage || lead.stage === stage;
    const matchesStatus = !status || lead.status === status;
    const matchesSource = !source || lead.source === source;
    const matchesCountry = !country || lead.country === country;
    const matchesCity = !city || lead.city === city;
    const joinedDay = sameDayValue(lead.joinedAt);
    const visitedDay = sameDayValue(lead.lastVisitedAt);
    const matchesJoinedFrom = !joinedFrom || joinedDay >= joinedFrom;
    const matchesJoinedTo = !joinedTo || joinedDay <= joinedTo;
    const matchesVisitedFrom = !visitedFrom || visitedDay >= visitedFrom;
    const matchesVisitedTo = !visitedTo || visitedDay <= visitedTo;
    const reviewStatuses = (lead.duplicateCandidates ?? []).map((candidate) => candidate.reviewStatus ?? 'pending');
    const matchesDuplicateReview = !duplicateReview
      || (duplicateReview === 'has_pending' && reviewStatuses.includes('pending'))
      || (duplicateReview === 'none' && reviewStatuses.length === 0)
      || reviewStatuses.includes(duplicateReview as 'confirmed_duplicate' | 'different_people' | 'merged');
    return matchesQ && matchesStage && matchesStatus && matchesSource && matchesCountry && matchesCity && matchesJoinedFrom && matchesJoinedTo && matchesVisitedFrom && matchesVisitedTo && matchesDuplicateReview;
  }).sort((a, b) => {
    switch (sort) {
      case 'name_asc':
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'name_desc':
        return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
      case 'visited_asc':
        return new Date(a.lastVisitedAt).getTime() - new Date(b.lastVisitedAt).getTime();
      case 'visited_desc':
        return new Date(b.lastVisitedAt).getTime() - new Date(a.lastVisitedAt).getTime();
      case 'joined_asc':
        return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      case 'joined_desc':
      default:
        return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
    }
  });

  const leads = filtered.slice(offset, offset + limit);
  return NextResponse.json({ leads, total: filtered.length, hasMore: offset + leads.length < filtered.length });
}

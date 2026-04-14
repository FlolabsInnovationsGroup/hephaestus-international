import { redirect } from 'next/navigation';
import { Section } from '@/components/layout';
import { HrDashboardWorkspace } from '@/components/hr-dashboard-workspace';
import { HrFilters } from '@/components/hr-filters';
import { getApplicantsForAdmin, getConversationForApplicant, getSessionUser } from '@/lib/application-store';

function sameDayValue(dateString: string) {
  return new Date(dateString).toISOString().slice(0, 10);
}

export default async function HrPage({ searchParams }: { searchParams: Promise<{ lead?: string; q?: string; stage?: string; status?: string; source?: string; country?: string; city?: string; sort?: string; joinedFrom?: string; joinedTo?: string; visitedFrom?: string; visitedTo?: string; duplicateReview?: string; more?: string }> }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect('/login');
  if (!viewer.hrBinaryRole) redirect('/me/application');

  const params = await searchParams;
  const q = (params.q ?? '').toLowerCase();
  const stage = params.stage ?? '';
  const status = params.status ?? '';
  const source = params.source ?? '';
  const country = params.country ?? '';
  const city = params.city ?? '';
  const sort = params.sort ?? 'joined_desc';
  const joinedFrom = params.joinedFrom ?? '';
  const joinedTo = params.joinedTo ?? '';
  const visitedFrom = params.visitedFrom ?? '';
  const visitedTo = params.visitedTo ?? '';
  const duplicateReview = params.duplicateReview ?? '';
  const allApplicants = await getApplicantsForAdmin();
  const sourceOptions = Array.from(new Set(allApplicants.map((lead) => lead.source).filter(Boolean))).sort();
  const countryOptions = Array.from(new Set(allApplicants.map((lead) => lead.country).filter(Boolean))).sort();
  const cityOptions = Array.from(new Set(allApplicants.map((lead) => lead.city).filter(Boolean))).sort();
  const applicants = allApplicants.filter((lead) => {
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
  const activeLead = applicants.find((lead) => lead.id === params.lead) ?? applicants[0] ?? null;
  const conversation = activeLead ? await getConversationForApplicant(activeLead.id) : [];

  return (
    <Section className="bg-[#f7faff] pt-28 pb-16 min-h-screen">
      <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <HrFilters
            params={params}
            stageOptions={Array.from(new Set(allApplicants.map((lead) => lead.stage))).sort()}
            statusOptions={Array.from(new Set(allApplicants.map((lead) => lead.status))).sort()}
            sourceOptions={sourceOptions}
            countryOptions={countryOptions}
            cityOptions={cityOptions}
          />
        </div>

        <HrDashboardWorkspace applicants={applicants} initialLeadId={activeLead?.id} initialConversation={conversation} />
      </div>
    </Section>
  );
}

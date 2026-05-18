import { redirect } from 'next/navigation';
import { Section } from '@/components/layout';
import { HrDashboardWorkspace } from '@/components/hr-dashboard-workspace';
import { HrFilters } from '@/components/hr-filters';
import {
  countHrApplicants,
  getConversationForApplicant,
  getHrFilterOptionsFromDb,
  getSessionUser,
  searchHrApplicants,
} from '@/lib/application-store';
import { getStageOrder } from '@/lib/stage-definitions';

const PAGE_SIZE = 50;

export default async function HrPage({ searchParams }: { searchParams: Promise<{ lead?: string; q?: string; stage?: string; status?: string; source?: string; country?: string; city?: string; sort?: string; joinedFrom?: string; joinedTo?: string; visitedFrom?: string; visitedTo?: string; duplicateReview?: string; hasNotion?: string; more?: string }> }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect('/login');
  if (!viewer.hrBinaryRole) redirect('/me/application');

  const params = await searchParams;
  const filters = {
    q: (params.q ?? '').toLowerCase(),
    stage: params.stage ?? '',
    status: params.status ?? '',
    source: params.source ?? '',
    country: params.country ?? '',
    city: params.city ?? '',
    sort: params.sort ?? 'joined_desc',
    joinedFrom: params.joinedFrom ?? '',
    joinedTo: params.joinedTo ?? '',
    visitedFrom: params.visitedFrom ?? '',
    visitedTo: params.visitedTo ?? '',
    duplicateReview: params.duplicateReview ?? '',
    hasNotion: params.hasNotion ?? '',
  };

  const [filterOptions, totalMatching, initialApplicants] = await Promise.all([
    getHrFilterOptionsFromDb(),
    countHrApplicants(filters),
    searchHrApplicants(filters, { offset: 0, limit: PAGE_SIZE }),
  ]);

  const hasMore = totalMatching > initialApplicants.length;
  const activeLead = initialApplicants.find((lead) => lead.id === params.lead) ?? initialApplicants[0] ?? null;
  const conversation = activeLead ? await getConversationForApplicant(activeLead.id) : [];

  const queryParams: Record<string, string> = {};
  if (params.q) queryParams.q = params.q;
  if (params.stage) queryParams.stage = params.stage;
  if (params.status) queryParams.status = params.status;
  if (params.source) queryParams.source = params.source;
  if (params.country) queryParams.country = params.country;
  if (params.city) queryParams.city = params.city;
  if (params.sort) queryParams.sort = params.sort;
  if (params.joinedFrom) queryParams.joinedFrom = params.joinedFrom;
  if (params.joinedTo) queryParams.joinedTo = params.joinedTo;
  if (params.visitedFrom) queryParams.visitedFrom = params.visitedFrom;
  if (params.visitedTo) queryParams.visitedTo = params.visitedTo;
  if (params.duplicateReview) queryParams.duplicateReview = params.duplicateReview;
  if (params.hasNotion) queryParams.hasNotion = params.hasNotion;

  const stageOptions = filterOptions.stages.sort((a, b) => getStageOrder(a) - getStageOrder(b) || a.localeCompare(b));

  return (
    <Section className="bg-[#f7faff] pt-28 pb-16 min-h-screen">
      <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <HrFilters
            params={{ ...params, hasNotion: filters.hasNotion || '' }}
            stageOptions={stageOptions}
            statusOptions={['applying', 'waiting', 'signed', 'joined', 'approved', 'rejected', 'graduated', 'terminated']}
            sourceOptions={filterOptions.sources}
            countryOptions={filterOptions.countries}
            cityOptions={filterOptions.cities}
          />
        </div>

        <HrDashboardWorkspace
          applicants={initialApplicants}
          initialLeadId={activeLead?.id}
          initialConversation={conversation}
          uniqueProfilesCount={totalMatching}
          initialHasMore={hasMore}
          queryParams={queryParams}
          hrAuthor={
            (viewer.firstName ?? '').toLowerCase() === 'john' ? 'john' :
            (viewer.firstName ?? '').toLowerCase() === 'oliver' ? 'oliver' : 'paula'
          }
        />
      </div>
    </Section>
  );
}

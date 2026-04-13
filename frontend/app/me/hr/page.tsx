import { redirect } from 'next/navigation';
import { Container, Section } from '@/components/layout';
import { ApplicantChat } from '@/components/applicant-chat';
import { HrStageControls } from '@/components/hr-stage-controls';
import { HrFilters } from '@/components/hr-filters';
import { DuplicateReviewActions } from '@/components/duplicate-review-actions';
import { getApplicantsForAdmin, getConversationForApplicant, getSessionUser } from '@/lib/application-store';

function sameDayValue(dateString: string) {
  return new Date(dateString).toISOString().slice(0, 10);
}

function displayJoined(values: Array<string | undefined> | undefined, fallback?: string) {
  const cleaned = Array.from(new Set((values ?? []).map((value) => String(value ?? '').trim()).filter(Boolean)));
  if (cleaned.length > 0) return cleaned.join(', ');
  return fallback ?? '—';
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
  const more = params.more === '1';
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

        <div className="grid gap-4 xl:grid-cols-[300px_1fr] 2xl:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border border-blue-100 bg-white shadow-sm">
            <div className="border-b border-blue-50 px-4 py-3 text-sm font-semibold text-gray-700">
              {applicants.length} lead{applicants.length === 1 ? '' : 's'} match the current filters
            </div>
            <div className="max-h-[760px] overflow-y-auto p-2">
              {applicants.map((lead) => {
                const isActive = activeLead?.id === lead.id;
                return (
                  <a key={lead.id} href={`/me/hr?lead=${lead.id}${params.q ? `&q=${encodeURIComponent(params.q)}` : ''}${stage ? `&stage=${encodeURIComponent(stage)}` : ''}${status ? `&status=${encodeURIComponent(status)}` : ''}${source ? `&source=${encodeURIComponent(source)}` : ''}`} className={`mb-2 block rounded-lg border px-3 py-2.5 ${isActive ? 'border-[#00349B] bg-[#eef5ff]' : 'border-transparent hover:bg-gray-50'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{lead.firstName} {lead.lastName}</p>
                        <p className="text-[11px] text-gray-500 break-all">{lead.email}</p>
                      </div>
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-[#00349B]">{lead.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">{lead.roleAppliedFor}</p>
                    <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-gray-500">
                      <span>Stage: {lead.stage}</span>
                      <span>Joined: {new Date(lead.joinedAt).toLocaleDateString()}</span>
                      <span>Visited: {new Date(lead.lastVisitedAt).toLocaleDateString()}</span>
                      <span>City: {lead.city}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-blue-100 bg-white shadow-sm">
              <div className="border-b border-blue-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">Lead conversation</h2>
                <p className="mt-1 text-sm text-gray-600">Admins with the HR binary role can see the full conversation from the profile area.</p>
              </div>
              <div className="px-0 py-0">
                {activeLead ? <ApplicantChat initialMessages={conversation} applicantId={activeLead.id} canReplyAsHr /> : <p className="px-6 py-5 text-sm text-gray-500">No lead selected.</p>}
              </div>
            </div>

            <div className="space-y-6">
              {activeLead && (
                <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900">Lead details</h2>
                  {activeLead.duplicateNeedsReview && (
                    <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
                      <p className="font-semibold uppercase tracking-[0.14em] text-orange-800">Verification recommended</p>
                      <p className="mt-1">Some matched information is still unsure. Please verify that the details being merged really belong to this person before confirming the duplicate.</p>
                    </div>
                  )}
                  <div className="mt-4 grid gap-3 text-sm text-gray-700">
                    <p><strong>Status:</strong> {activeLead.status}</p>
                    <p><strong>Stage:</strong> {activeLead.stage}</p>
                    <p><strong>Date joined:</strong> {new Date(activeLead.joinedAt).toLocaleString()}</p>
                    <p><strong>Last website visit:</strong> {new Date(activeLead.lastVisitedAt).toLocaleString()}</p>
                    <p><strong>Emails:</strong> {displayJoined([activeLead.email, ...(activeLead.alternateEmails ?? [])], activeLead.email)}</p>
                    <p><strong>Phone numbers:</strong> {displayJoined(activeLead.mergedPhoneNumbers, activeLead.phoneNumber)}</p>
                    <p><strong>LinkedIn:</strong> {displayJoined(activeLead.mergedLinkedinUrls, activeLead.linkedinUrl)}</p>
                    <p><strong>Cities:</strong> {displayJoined(activeLead.mergedCities, activeLead.city)}</p>
                    <p><strong>Countries:</strong> {displayJoined(activeLead.mergedCountries, activeLead.country)}</p>
                    <p><strong>Source:</strong> {activeLead.source}</p>
                    <p><strong>Education:</strong> {activeLead.education}</p>
                  </div>
                  {activeLead.duplicateCandidates && activeLead.duplicateCandidates.length > 0 && (
                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-800">Possible duplicate accounts</p>
                      <p className="mt-1 text-sm text-amber-900">These are only review candidates, not approved merges. HR should approve as duplicate or reject as different people before any merge decision.</p>
                      <div className="mt-3 space-y-3">
                        {activeLead.duplicateCandidates.map((candidate) => (
                          <div key={candidate.id} className={`rounded-xl border px-3 py-3 text-sm ${candidate.reviewStatus === 'confirmed_duplicate' ? 'border-blue-200 bg-blue-50 text-blue-900' : candidate.reviewStatus === 'merged' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-white text-gray-700'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-gray-900">{candidate.fullName}</p>
                                <p className="text-xs text-gray-500">{candidate.email}</p>
                              </div>
                              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${candidate.reviewStatus === 'confirmed_duplicate' ? 'bg-blue-100 text-blue-800' : candidate.reviewStatus === 'merged' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>match score {candidate.score}</span>
                            </div>
                            <p className="mt-2 text-xs text-gray-600">Signals: {candidate.reasons.join(', ')}</p>
                            <p className="mt-1 text-xs text-gray-500">Review status: {candidate.reviewStatus ?? 'pending review'}</p>
                            {candidate.reviewStatus === 'confirmed_duplicate' && <p className="mt-1 text-xs text-blue-700">Approved as duplicate. You can merge when ready.</p>}
                            {candidate.reviewStatus === 'merged' && <p className="mt-1 text-xs text-emerald-700">Marked as merged. Alias/login consolidation should follow the selected canonical account.</p>}
                            <p className="mt-1 text-xs text-gray-500">Current rule: suggestions need a stronger score than before, and one strong signal alone is not enough unless it has more supporting matches.</p>
                            {candidate.reviewNotes && <p className="mt-1 text-xs text-gray-500">Notes: {candidate.reviewNotes}</p>}
                            <DuplicateReviewActions reviewId={candidate.reviewId} candidateId={candidate.id} currentStatus={candidate.reviewStatus} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-5 flex flex-wrap gap-3">
                    {activeLead.cvUrl && (
                      <a
                        href={activeLead.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        download={activeLead.cvFileName || true}
                        className="inline-flex items-center rounded-xl border border-[#00349B] px-4 py-2 text-sm font-semibold text-[#00349B] transition hover:bg-[#eef5ff]"
                      >
                        Download CV
                      </a>
                    )}
                    {activeLead.profilePictureUrl && (
                      <a
                        href={activeLead.profilePictureUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="inline-flex items-center rounded-xl border border-[#00349B] px-4 py-2 text-sm font-semibold text-[#00349B] transition hover:bg-[#eef5ff]"
                      >
                        Download profile picture
                      </a>
                    )}
                  </div>
                </div>
              )}
              {activeLead && <HrStageControls applicantId={activeLead.id} stage={activeLead.stage} status={activeLead.status} />}
              <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">Chronos sync note</h2>
                <p className="mt-3 text-sm leading-6 text-gray-700">When a lead reaches <code>agreement_signed</code> or <code>chronos_synced</code>, the backend now writes a Chronos sync payload into the preview sync layer so the shared identity contract is no longer only UI text.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

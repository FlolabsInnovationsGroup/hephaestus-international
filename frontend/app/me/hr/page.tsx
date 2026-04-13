import { redirect } from 'next/navigation';
import { Container, Section } from '@/components/layout';
import { ApplicantChat } from '@/components/applicant-chat';
import { HrStageControls } from '@/components/hr-stage-controls';
import { getApplicantsForAdmin, getConversationForApplicant, getSessionUser } from '@/lib/application-store';

function sameDayValue(dateString: string) {
  return new Date(dateString).toISOString().slice(0, 10);
}

export default async function HrPage({ searchParams }: { searchParams: Promise<{ lead?: string; q?: string; stage?: string; status?: string; source?: string; country?: string; city?: string; sort?: string; joinedFrom?: string; joinedTo?: string; visitedFrom?: string; visitedTo?: string; more?: string }> }) {
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
    return matchesQ && matchesStage && matchesStatus && matchesSource && matchesCountry && matchesCity && matchesJoinedFrom && matchesJoinedTo && matchesVisitedFrom && matchesVisitedTo;
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
          <form className="space-y-4" method="get">
            <input type="hidden" name="lead" value={params.lead ?? ''} />
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="xl:max-w-md">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00349B]">HR workspace</p>
                <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Applicants and conversations</h1>
                <p className="mt-2 text-gray-600">Preview of the lead management area for Chronos admins with the HR binary role.</p>
              </div>
              <div className="flex-1 xl:max-w-[1100px]">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))_auto_auto]">
                  <input name="q" defaultValue={params.q ?? ''} placeholder="Search leads" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
                  <select name="stage" defaultValue={stage} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]">
                    <option value="">All stages</option>
                    {Array.from(new Set(allApplicants.map((lead) => lead.stage))).sort().map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                  <select name="status" defaultValue={status} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]">
                    <option value="">All statuses</option>
                    {Array.from(new Set(allApplicants.map((lead) => lead.status))).sort().map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                  <select name="source" defaultValue={source} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]">
                    <option value="">All sources</option>
                    {sourceOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                  <select name="sort" defaultValue={sort} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]">
                    <option value="joined_desc">Newest joined</option>
                    <option value="joined_asc">Oldest joined</option>
                    <option value="visited_desc">Recently visited</option>
                    <option value="visited_asc">Least recently visited</option>
                    <option value="name_asc">Name A-Z</option>
                    <option value="name_desc">Name Z-A</option>
                  </select>
                  <button name="more" value={more ? '0' : '1'} className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">...</button>
                  <button className="rounded-xl bg-[#00349B] px-4 py-3 text-sm font-semibold text-white">Apply</button>
                </div>
                {more && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <select name="country" defaultValue={country} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]">
                      <option value="">All countries</option>
                      {countryOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                    <select name="city" defaultValue={city} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]">
                      <option value="">All cities</option>
                      {cityOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                    <input type="date" name="joinedFrom" defaultValue={joinedFrom} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
                    <input type="date" name="joinedTo" defaultValue={joinedTo} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
                    <input type="date" name="visitedFrom" defaultValue={visitedFrom} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
                    <input type="date" name="visitedTo" defaultValue={visitedTo} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
                    <a href="/me/hr" className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">Reset filters</a>
                  </div>
                )}
              </div>
            </div>
          </form>
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
                  <div className="mt-4 grid gap-3 text-sm text-gray-700">
                    <p><strong>Status:</strong> {activeLead.status}</p>
                    <p><strong>Stage:</strong> {activeLead.stage}</p>
                    <p><strong>Date joined:</strong> {new Date(activeLead.joinedAt).toLocaleString()}</p>
                    <p><strong>Last website visit:</strong> {new Date(activeLead.lastVisitedAt).toLocaleString()}</p>
                    <p><strong>LinkedIn:</strong> {activeLead.linkedinUrl}</p>
                    <p><strong>Location:</strong> {activeLead.city}, {activeLead.country}</p>
                    <p><strong>Source:</strong> {activeLead.source}</p>
                    <p><strong>Education:</strong> {activeLead.education}</p>
                  </div>
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

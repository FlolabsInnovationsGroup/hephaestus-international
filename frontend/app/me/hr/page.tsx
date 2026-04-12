import { redirect } from 'next/navigation';
import { Container, Section } from '@/components/layout';
import { LogoutButton } from '@/components/logout-button';
import { HrStageControls } from '@/components/hr-stage-controls';
import { getApplicantsForAdmin, getConversationForApplicant, getSessionUser } from '@/lib/application-store';

export default async function HrPage({ searchParams }: { searchParams: Promise<{ lead?: string; q?: string; stage?: string }> }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect('/login');
  if (!(viewer.role === 'admin' || viewer.hrBinaryRole)) redirect('/me/application');

  const params = await searchParams;
  const q = (params.q ?? '').toLowerCase();
  const stage = params.stage ?? '';
  const allApplicants = await getApplicantsForAdmin();
  const applicants = allApplicants.filter((lead) => {
    const matchesQ = !q || `${lead.firstName} ${lead.lastName} ${lead.email} ${lead.roleAppliedFor}`.toLowerCase().includes(q);
    const matchesStage = !stage || lead.stage === stage;
    return matchesQ && matchesStage;
  });
  const activeLead = applicants.find((lead) => lead.id === params.lead) ?? applicants[0] ?? null;
  const conversation = activeLead ? await getConversationForApplicant(activeLead.id) : [];

  return (
    <Section className="bg-[#f7faff] pt-28 pb-16 min-h-screen">
      <Container>
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00349B]">HR workspace</p>
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Applicants and conversations</h1>
            <p className="mt-2 text-gray-600">Preview of the lead management area for Chronos admins with the HR binary role.</p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <div className="rounded-2xl border border-blue-100 bg-white shadow-sm">
            <div className="border-b border-blue-50 p-4">
              <form className="space-y-3" method="get">
                <input name="q" defaultValue={params.q ?? ''} placeholder="Search leads" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
                <select name="stage" defaultValue={stage} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]">
                  <option value="">All stages</option>
                  <option value="application_submitted">Application submitted</option>
                  <option value="before_meeting">Before meeting</option>
                  <option value="agreement_signed">Agreement signed</option>
                </select>
                <button className="w-full rounded-xl bg-[#00349B] px-4 py-3 text-sm font-semibold text-white">Apply filters</button>
              </form>
            </div>
            <div className="max-h-[720px] overflow-y-auto p-2">
              {applicants.map((lead) => {
                const isActive = activeLead?.id === lead.id;
                return (
                  <a key={lead.id} href={`/me/hr?lead=${lead.id}${params.q ? `&q=${encodeURIComponent(params.q)}` : ''}${stage ? `&stage=${encodeURIComponent(stage)}` : ''}`} className={`mb-2 block rounded-xl border px-4 py-3 ${isActive ? 'border-[#00349B] bg-[#eef5ff]' : 'border-transparent hover:bg-gray-50'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{lead.firstName} {lead.lastName}</p>
                        <p className="text-xs text-gray-500">{lead.email}</p>
                      </div>
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-[#00349B]">{lead.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{lead.roleAppliedFor}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
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
              <div className="flex max-h-[700px] flex-col gap-4 overflow-y-auto px-6 py-5">
                {activeLead ? conversation.map((message) => (
                  <div key={message.id} className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.author === 'applicant' ? 'self-end bg-[#00349B] text-white' : 'bg-[#eef5ff] text-gray-900'}`}>
                    <p className={`mb-1 text-xs font-semibold ${message.author === 'applicant' ? 'text-white/75' : 'text-[#00349B]'}`}>{message.author}</p>
                    <p className="text-sm leading-6">{message.text}</p>
                  </div>
                )) : <p className="text-sm text-gray-500">No lead selected.</p>}
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
      </Container>
    </Section>
  );
}

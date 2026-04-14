'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicantChat } from '@/components/applicant-chat';
import { HrStageControls } from '@/components/hr-stage-controls';
import { DuplicateReviewActions } from '@/components/duplicate-review-actions';

type DuplicateCandidate = {
  id: string;
  email: string;
  fullName: string;
  score: number;
  reasons: string[];
  reviewId?: string;
  reviewStatus?: 'pending' | 'confirmed_duplicate' | 'different_people' | 'merged';
  reviewNotes?: string;
};

type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  roleAppliedFor: string;
  stage: string;
  joinedAt: string;
  lastVisitedAt: string;
  city: string;
  country: string;
  phoneNumber: string;
  linkedinUrl: string;
  education: string;
  source: string;
  cvUrl?: string;
  cvFileName?: string;
  profilePictureUrl?: string;
  duplicateNeedsReview?: boolean;
  duplicateCandidates?: DuplicateCandidate[];
  alternateEmails?: string[];
  mergedPhoneNumbers?: string[];
  mergedLinkedinUrls?: string[];
  mergedCountries?: string[];
  mergedCities?: string[];
};

type Message = {
  id: string;
  applicantId: string;
  author: 'applicant' | 'paula' | 'john' | 'oliver';
  text: string;
  createdAt: string;
};

function displayJoined(values: Array<string | undefined> | undefined, fallback?: string) {
  const cleaned = Array.from(new Set((values ?? []).map((value) => String(value ?? '').trim()).filter(Boolean)));
  if (cleaned.length > 0) return cleaned.join(', ');
  return fallback ?? '—';
}

function unique(values: Array<string | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean)));
}

export function HrDashboardWorkspace({
  applicants,
  initialLeadId,
  initialConversation,
  uniqueProfilesCount,
}: {
  applicants: Lead[];
  initialLeadId?: string;
  initialConversation: Message[];
  uniqueProfilesCount: number;
}) {
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeadId ?? applicants[0]?.id ?? null);
  const [conversation, setConversation] = useState<Message[]>(initialConversation);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSaving, setMergeSaving] = useState(false);
  const [mergeError, setMergeError] = useState('');
  const router = useRouter();

  const activeLead = useMemo(
    () => applicants.find((lead) => lead.id === selectedLeadId) ?? applicants[0] ?? null,
    [applicants, selectedLeadId],
  );

  const selectedLeads = useMemo(
    () => applicants.filter((lead) => selectedLeadIds.includes(lead.id)),
    [applicants, selectedLeadIds],
  );
  const [canonicalLeadId, setCanonicalLeadId] = useState<string>('');

  const [keep, setKeep] = useState({
    emails: [] as string[],
    phoneNumbers: [] as string[],
    linkedinUrls: [] as string[],
    cities: [] as string[],
    countries: [] as string[],
    rolesAppliedFor: [] as string[],
    education: [] as string[],
    sources: [] as string[],
    firstNames: [] as string[],
    lastNames: [] as string[],
  });

  useEffect(() => {
    if (!mergeOpen || selectedLeads.length < 2) return;
    setCanonicalLeadId((current) => current && selectedLeads.some((lead) => lead.id === current) ? current : selectedLeads[0].id);
    setKeep({
      emails: unique(selectedLeads.flatMap((lead) => [lead.email, ...(lead.alternateEmails ?? [])])),
      phoneNumbers: unique(selectedLeads.flatMap((lead) => [lead.phoneNumber, ...(lead.mergedPhoneNumbers ?? [])])),
      linkedinUrls: unique(selectedLeads.flatMap((lead) => [lead.linkedinUrl, ...(lead.mergedLinkedinUrls ?? [])])),
      cities: unique(selectedLeads.flatMap((lead) => [lead.city, ...(lead.mergedCities ?? [])])),
      countries: unique(selectedLeads.flatMap((lead) => [lead.country, ...(lead.mergedCountries ?? [])])),
      rolesAppliedFor: unique(selectedLeads.map((lead) => lead.roleAppliedFor)),
      education: unique(selectedLeads.map((lead) => lead.education)),
      sources: unique(selectedLeads.map((lead) => lead.source)),
      firstNames: unique(selectedLeads.map((lead) => lead.firstName)),
      lastNames: unique(selectedLeads.map((lead) => lead.lastName)),
    });
  }, [mergeOpen, selectedLeads]);

  useEffect(() => {
    if (!activeLead) {
      setConversation([]);
      return;
    }
    if (activeLead.id === initialLeadId) return;

    let cancelled = false;
    async function loadConversation() {
      setLoadingConversation(true);
      try {
        const res = await fetch(`/api/admin/leads/${activeLead?.id}/conversation`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({ conversation: [] }));
        if (!cancelled) {
          setConversation(data.conversation ?? []);
        }
      } finally {
        if (!cancelled) setLoadingConversation(false);
      }
    }
    void loadConversation();
    return () => {
      cancelled = true;
    };
  }, [activeLead, initialLeadId]);

  function toggleLeadSelection(leadId: string, checked: boolean) {
    setSelectedLeadIds((current) => checked ? unique([...current, leadId]) : current.filter((id) => id !== leadId));
  }

  function toggleKeepValue(field: keyof typeof keep, value: string, checked: boolean) {
    setKeep((current) => ({
      ...current,
      [field]: checked ? unique([...(current[field] as string[]), value]) : (current[field] as string[]).filter((item) => item !== value),
    }));
  }

  async function mergeSelectedLeads() {
    if (selectedLeadIds.length < 2 || !canonicalLeadId) return;
    setMergeSaving(true);
    setMergeError('');
    const res = await fetch('/api/admin/leads/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadIds: selectedLeadIds,
        canonicalLeadId,
        keep,
      }),
    });
    const data = await res.json().catch(() => ({ error: 'Merge failed' }));
    setMergeSaving(false);
    if (!res.ok) {
      setMergeError(data.error ?? 'Merge failed');
      return;
    }
    setMergeOpen(false);
    setSelectedLeadIds([]);
    setSelectedLeadId(canonicalLeadId);
    router.refresh();
  }

  const differing = {
    emails: keep.emails.length > 1,
    phoneNumbers: keep.phoneNumbers.length > 1,
    linkedinUrls: keep.linkedinUrls.length > 1,
    cities: keep.cities.length > 1,
    countries: keep.countries.length > 1,
    rolesAppliedFor: keep.rolesAppliedFor.length > 1,
    education: keep.education.length > 1,
    sources: keep.sources.length > 1,
    firstNames: keep.firstNames.length > 1,
    lastNames: keep.lastNames.length > 1,
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_1fr] 2xl:grid-cols-[320px_1fr]">
      <div className="rounded-2xl border border-blue-100 bg-white shadow-sm">
        <div className="border-b border-blue-50 px-4 py-3 text-sm font-semibold text-gray-700">
          {uniqueProfilesCount} unique profile{uniqueProfilesCount === 1 ? '' : 's'} match the current filters
          <div className="mt-2 rounded-lg border border-blue-100 bg-[#f7faff] px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#00349B]">Selection mode</p>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="text-xs text-gray-600">{selectedLeadIds.length} selected</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeadIds([])}
                  disabled={selectedLeadIds.length === 0}
                  className="rounded-md border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  disabled={selectedLeadIds.length < 2}
                  onClick={() => setMergeOpen(true)}
                  className="rounded-md bg-[#00349B] px-2.5 py-1 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Merge selected
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-h-[760px] overflow-y-auto p-2">
          {applicants.map((lead) => {
            const isActive = activeLead?.id === lead.id;
            const checked = selectedLeadIds.includes(lead.id);
            return (
              <div
                key={lead.id}
                className={`mb-2 rounded-lg border px-3 py-2.5 ${isActive ? 'border-[#00349B] bg-[#eef5ff]' : 'border-transparent hover:bg-gray-50'}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-2 py-1 text-xs font-semibold text-[#00349B]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => toggleLeadSelection(lead.id, event.target.checked)}
                    />
                    Select profile
                  </label>
                  {checked && <span className="rounded-full bg-[#00349B] px-2 py-1 text-[10px] font-semibold text-white">Selected</span>}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLeadId(lead.id)}
                  className="block w-full text-left"
                >
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
                </button>
              </div>
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
            {activeLead ? (
              loadingConversation ? <p className="px-6 py-5 text-sm text-gray-500">Loading conversation...</p> : <ApplicantChat initialMessages={conversation} applicantId={activeLead.id} canReplyAsHr />
            ) : <p className="px-6 py-5 text-sm text-gray-500">No lead selected.</p>}
          </div>
        </div>

        <div className="space-y-6">
          {activeLead && (
            <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Lead details</h2>
              <p className="mt-2 text-sm text-gray-600">{activeLead.firstName} {activeLead.lastName}</p>
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
                        {candidate.reviewNotes && <p className="mt-1 text-xs text-gray-500">Notes: {candidate.reviewNotes}</p>}
                        <DuplicateReviewActions reviewId={candidate.reviewId} leadId={activeLead.id} candidateId={candidate.id} currentStatus={candidate.reviewStatus} />
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

      {mergeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Merge profiles</h3>
                <p className="mt-1 text-sm text-gray-600">Choose what to keep from the selected profiles. You can keep multiple values where useful.</p>
              </div>
              <button type="button" onClick={() => setMergeOpen(false)} className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100">Close</button>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-gray-900">Canonical profile</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {selectedLeads.map((lead) => (
                  <label key={lead.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <input type="radio" name="canonical" value={lead.id} checked={canonicalLeadId === lead.id} onChange={() => setCanonicalLeadId(lead.id)} />
                    <span>{lead.firstName} {lead.lastName} ({lead.email})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {differing.emails && (
                <MergeOptionsField
                  label="Emails (final profile can log in with any kept email)"
                  values={keep.emails}
                  selected={keep.emails}
                  field="emails"
                  onToggle={toggleKeepValue}
                />
              )}
              {differing.phoneNumbers && <MergeOptionsField label="Phone numbers" values={keep.phoneNumbers} selected={keep.phoneNumbers} field="phoneNumbers" onToggle={toggleKeepValue} />}
              {differing.linkedinUrls && <MergeOptionsField label="LinkedIn URLs" values={keep.linkedinUrls} selected={keep.linkedinUrls} field="linkedinUrls" onToggle={toggleKeepValue} />}
              {differing.cities && <MergeOptionsField label="Cities" values={keep.cities} selected={keep.cities} field="cities" onToggle={toggleKeepValue} />}
              {differing.countries && <MergeOptionsField label="Countries" values={keep.countries} selected={keep.countries} field="countries" onToggle={toggleKeepValue} />}
              {differing.rolesAppliedFor && <MergeOptionsField label="Roles applied for" values={keep.rolesAppliedFor} selected={keep.rolesAppliedFor} field="rolesAppliedFor" onToggle={toggleKeepValue} />}
              {differing.education && <MergeOptionsField label="Education" values={keep.education} selected={keep.education} field="education" onToggle={toggleKeepValue} />}
              {differing.sources && <MergeOptionsField label="Sources" values={keep.sources} selected={keep.sources} field="sources" onToggle={toggleKeepValue} />}
              {differing.firstNames && <MergeOptionsField label="First names" values={keep.firstNames} selected={keep.firstNames} field="firstNames" onToggle={toggleKeepValue} />}
              {differing.lastNames && <MergeOptionsField label="Last names" values={keep.lastNames} selected={keep.lastNames} field="lastNames" onToggle={toggleKeepValue} />}
              {!Object.values(differing).some(Boolean) && (
                <p className="text-sm text-gray-600">No conflicting fields found. You can still merge to consolidate logins and aliases.</p>
              )}
            </div>

            {mergeError && <p className="mt-4 text-sm text-red-600">{mergeError}</p>}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setMergeOpen(false)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button>
              <button
                type="button"
                disabled={mergeSaving || !canonicalLeadId || keep.emails.length === 0}
                onClick={mergeSelectedLeads}
                className="rounded-xl bg-[#00349B] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mergeSaving ? 'Merging...' : 'Confirm merge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MergeOptionsField({
  label,
  values,
  selected,
  field,
  onToggle,
}: {
  label: string;
  values: string[];
  selected: string[];
  field: 'emails' | 'phoneNumbers' | 'linkedinUrls' | 'cities' | 'countries' | 'rolesAppliedFor' | 'education' | 'sources' | 'firstNames' | 'lastNames';
  onToggle: (field: 'emails' | 'phoneNumbers' | 'linkedinUrls' | 'cities' | 'countries' | 'rolesAppliedFor' | 'education' | 'sources' | 'firstNames' | 'lastNames', value: string, checked: boolean) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        {values.length === 0 && <p className="text-xs text-gray-500">No values available.</p>}
        {values.map((value) => (
          <label key={value} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={(event) => onToggle(field, value, event.target.checked)}
            />
            <span>{value}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

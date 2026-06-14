'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicantChat } from '@/components/applicant-chat';
import { HrStageControls } from '@/components/hr-stage-controls';
import { DuplicateReviewActions } from '@/components/duplicate-review-actions';
import { formatStageLabel } from '@/lib/stage-definitions';
import { APPLICANT_STATUS_VALUES, formatApplicantStatusLabel } from '@/lib/applicant-status';
import type { ApplicantStatus } from '@/app/application-data';
import { Spinner } from '@/components/ui/spinner';
import {
  buildMergeOptionsFromLeads,
  EMPTY_MERGE_FIELDS,
  mergeFieldsWithConflicts,
  type MergeFieldState,
} from '@/lib/hr-merge-options';

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
  notionTeamMemberPageUrl?: string;
  notionTeamMemberId?: string | null;
  chronosLastActiveAt?: string | null;
  role?: string;
  hrBinaryRole?: boolean;
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

function parseMultiValue(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(/,\s*/).map((s) => s.trim()).filter(Boolean);
}

export function HrDashboardWorkspace({
  applicants,
  initialLeadId,
  initialConversation,
  uniqueProfilesCount,
  initialHasMore,
  queryParams,
  hrAuthor = 'paula',
}: {
  applicants: Lead[];
  initialLeadId?: string;
  initialConversation: Message[];
  uniqueProfilesCount: number;
  initialHasMore: boolean;
  queryParams: Record<string, string>;
  hrAuthor?: 'paula' | 'john' | 'oliver';
}) {
  const [loadedApplicants, setLoadedApplicants] = useState<Lead[]>(applicants);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId ?? applicants[0]?.id ?? null);
  const [conversation, setConversation] = useState<Message[]>(initialConversation);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSaving, setMergeSaving] = useState(false);
  const [mergeError, setMergeError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [roleForm, setRoleForm] = useState({ role: 'member', hrBinaryRole: false });
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState('');
  const [roleSaved, setRoleSaved] = useState(false);
  const router = useRouter();

  const activeLead = useMemo(
    () => loadedApplicants.find((lead) => lead.id === selectedLeadId) ?? loadedApplicants[0] ?? null,
    [loadedApplicants, selectedLeadId],
  );

  const selectedLeads = useMemo(
    () => loadedApplicants.filter((lead) => selectedLeadIds.includes(lead.id)),
    [loadedApplicants, selectedLeadIds],
  );

  const mergeOptions = useMemo(
    () => (mergeOpen && selectedLeads.length >= 2 ? buildMergeOptionsFromLeads(selectedLeads) : EMPTY_MERGE_FIELDS),
    [mergeOpen, selectedLeads],
  );

  const [canonicalLeadId, setCanonicalLeadId] = useState<string>('');

  const [keep, setKeep] = useState<MergeFieldState>(EMPTY_MERGE_FIELDS);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    status: 'applying' as ApplicantStatus,
    alternateEmails: [] as string[],
    phoneNumbers: [] as string[],
    linkedinUrls: [] as string[],
    cities: [] as string[],
    countries: [] as string[],
    education: '',
    source: '',
    roleAppliedFor: '',
    notes: '',
    notionTeamMemberPageUrl: '',
    notionTeamMemberId: '',
  });
  const [confirmDeleteLead, setConfirmDeleteLead] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);

  useEffect(() => {
    setLoadedApplicants(applicants);
    setHasMore(initialHasMore);
  }, [applicants, initialHasMore]);

  useEffect(() => {
    if (!mergeOpen || selectedLeads.length < 2) return;
    setCanonicalLeadId((current) => current && selectedLeads.some((lead) => lead.id === current) ? current : selectedLeads[0].id);
    setKeep(buildMergeOptionsFromLeads(selectedLeads));
  }, [mergeOpen, selectedLeads]);

  async function loadMoreApplicants() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const params = new URLSearchParams({ ...queryParams, offset: String(loadedApplicants.length), limit: '50' });
    const res = await fetch(`/api/admin/leads?${params.toString()}`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({ leads: [], hasMore: false }));
    const nextLeads = (data.leads ?? []) as Lead[];
    setLoadedApplicants((current) => [...current, ...nextLeads.filter((lead) => !current.some((existing) => existing.id === lead.id))]);
    setHasMore(Boolean(data.hasMore));
    setLoadingMore(false);
  }

  function handleListScroll(event: React.UIEvent<HTMLDivElement>) {
    const node = event.currentTarget;
    const nearBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 120;
    if (nearBottom) void loadMoreApplicants();
  }

  useEffect(() => {
    if (!editOpen || !activeLead) return;
    setEditError('');
    const primaryEmail = (activeLead.email ?? '').toLowerCase();
    setEditForm({
      firstName: activeLead.firstName ?? '',
      lastName: activeLead.lastName ?? '',
      email: primaryEmail,
      status: (APPLICANT_STATUS_VALUES.includes(activeLead.status as ApplicantStatus)
        ? activeLead.status
        : 'applying') as ApplicantStatus,
      alternateEmails: (activeLead.alternateEmails ?? []).filter((e) => e.toLowerCase() !== primaryEmail),
      phoneNumbers: parseMultiValue(activeLead.phoneNumber),
      linkedinUrls: parseMultiValue(activeLead.linkedinUrl),
      cities: parseMultiValue(activeLead.city),
      countries: parseMultiValue(activeLead.country),
      education: activeLead.education ?? '',
      source: activeLead.source ?? '',
      roleAppliedFor: activeLead.roleAppliedFor ?? '',
      notes: '',
      notionTeamMemberPageUrl: activeLead.notionTeamMemberPageUrl ?? '',
      notionTeamMemberId: activeLead.notionTeamMemberId ?? '',
    });
  }, [editOpen, activeLead]);

  useEffect(() => {
    if (!activeLead) return;
    const rawRole = activeLead.role ?? 'applicant';
    const role = (rawRole === 'applicant' || rawRole === 'hr') ? 'member' : rawRole;
    setRoleForm({ role, hrBinaryRole: activeLead.hrBinaryRole ?? false });
    setRoleError('');
    setRoleSaved(false);
  }, [activeLead?.id]);

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

  function toggleKeepValue(field: keyof MergeFieldState, value: string, checked: boolean) {
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

  async function saveLeadEdit() {
    if (!activeLead) return;
    setEditSaving(true);
    setEditError('');
    const res = await fetch('/api/admin/leads/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicantId: activeLead.id, ...editForm }),
    });
    const data = await res.json().catch(() => ({ error: 'Update failed' }));
    setEditSaving(false);
    if (!res.ok) {
      setEditError(data.error ?? 'Update failed');
      return;
    }
    setEditOpen(false);
    router.refresh();
  }

  async function deleteLeadPermanently() {
    if (!activeLead) return;
    setDeleteSaving(true);
    setEditError('');
    const res = await fetch('/api/admin/leads/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicantId: activeLead.id }),
    });
    const data = await res.json().catch(() => ({ error: 'Delete failed' }));
    setDeleteSaving(false);
    if (!res.ok) {
      setEditError(data.error ?? 'Delete failed');
      return;
    }
    setConfirmDeleteLead(false);
    setEditOpen(false);
    setLoadedApplicants((prev) => {
      const remaining = prev.filter((lead) => lead.id !== activeLead.id);
      setSelectedLeadId((current) => (current === activeLead.id ? remaining[0]?.id ?? null : current));
      return remaining;
    });
    router.refresh();
  }

  async function saveRoleChange() {
    if (!activeLead) return;
    setRoleSaving(true);
    setRoleError('');
    setRoleSaved(false);
    const res = await fetch('/api/admin/leads/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicantId: activeLead.id, role: roleForm.role, hrBinaryRole: roleForm.hrBinaryRole }),
    });
    const data = await res.json().catch(() => ({ error: 'Update failed' }));
    setRoleSaving(false);
    if (!res.ok) {
      setRoleError(data.error ?? 'Update failed');
      return;
    }
    setRoleSaved(true);
    router.refresh();
  }

  const differing = mergeFieldsWithConflicts(mergeOptions);

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
          <div onScroll={handleListScroll} className="max-h-[740px] overflow-y-auto">
          {loadedApplicants.map((lead) => {
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
                    <span>Stage: {formatStageLabel(lead.stage)}</span>
                    <span suppressHydrationWarning>Joined: {new Date(lead.joinedAt).toLocaleDateString()}</span>
                    <span suppressHydrationWarning title="Last seen on Hephaestus">Hephaestus: {new Date(lead.lastVisitedAt).toLocaleDateString()}</span>
                    {lead.chronosLastActiveAt
                      ? <span suppressHydrationWarning title="Last active on Chronos" className="text-emerald-700">Chronos: {new Date(lead.chronosLastActiveAt).toLocaleDateString()}</span>
                      : <span className="text-gray-400">Chronos: —</span>}
                  </div>
                </button>
              </div>
            );
          })}
          {loadingMore && (
            <p className="flex justify-center px-2 py-3">
              <Spinner size="sm" className="text-[#00349B]" label="Loading more leads…" />
            </p>
          )}
          {!hasMore && loadedApplicants.length > 0 && <p className="px-2 py-2 text-xs text-gray-400">All leads loaded</p>}
          </div>
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
              loadingConversation ? (
                <p className="flex justify-center px-6 py-8">
                  <Spinner size="md" className="text-[#00349B]" label="Loading conversation…" />
                </p>
              ) : (
                <ApplicantChat initialMessages={conversation} applicantId={activeLead.id} canReplyAsHr hrAuthor={hrAuthor} />
              )
            ) : <p className="px-6 py-5 text-sm text-gray-500">No lead selected.</p>}
          </div>
        </div>

        <div className="space-y-6">
          {activeLead && (
            <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-gray-900">Lead details</h2>
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Edit lead
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600">{activeLead.firstName} {activeLead.lastName}</p>
              {activeLead.duplicateNeedsReview && (
                <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
                  <p className="font-semibold uppercase tracking-[0.14em] text-orange-800">Verification recommended</p>
                  <p className="mt-1">Some matched information is still unsure. Please verify that the details being merged really belong to this person before confirming the duplicate.</p>
                </div>
              )}
              <div className="mt-4 grid gap-3 text-sm text-gray-700">
                <p><strong>Status:</strong> {activeLead.status}</p>
                <p><strong>Stage:</strong> {formatStageLabel(activeLead.stage)}</p>
                <p><strong>Date joined:</strong> <span suppressHydrationWarning>{new Date(activeLead.joinedAt).toLocaleString()}</span></p>
                <div className="rounded-xl border border-blue-100 bg-[#f7faff] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#00349B] mb-2">Role & access</p>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-700 w-20 shrink-0">Role</label>
                      <select
                        data-testid="role-select"
                        value={roleForm.role}
                        onChange={(e) => setRoleForm((f) => ({ ...f, role: e.target.value }))}
                        className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs outline-none focus:border-[#00349B]"
                      >
                        <option value="member">Member</option>
                        <option value="team_lead">Team Lead</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roleForm.hrBinaryRole}
                        onChange={(e) => setRoleForm((f) => ({ ...f, hrBinaryRole: e.target.checked }))}
                        className="rounded"
                      />
                      HR dashboard access
                    </label>
                    {roleError && <p className="text-xs text-red-600">{roleError}</p>}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-testid="save-role"
                        disabled={roleSaving}
                        onClick={saveRoleChange}
                        className="rounded-lg bg-[#00349B] px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {roleSaving ? 'Saving…' : 'Save role'}
                      </button>
                      {roleSaved && <span data-testid="role-saved" className="text-xs font-semibold text-emerald-600">Saved</span>}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-blue-100 bg-[#f7faff] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#00349B] mb-2">Platform activity</p>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-medium text-gray-700">
                        <span className="inline-block h-2 w-2 rounded-full bg-[#00349B]" />
                        Hephaestus
                      </span>
                      <span suppressHydrationWarning className="text-gray-600">{new Date(activeLead.lastVisitedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-medium text-gray-700">
                        <span className={`inline-block h-2 w-2 rounded-full ${activeLead.chronosLastActiveAt ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        Chronos
                      </span>
                      {activeLead.chronosLastActiveAt
                        ? <span suppressHydrationWarning className="text-gray-600">{new Date(activeLead.chronosLastActiveAt).toLocaleString()}</span>
                        : <span className="text-gray-400 italic">No Chronos account</span>}
                    </div>
                  </div>
                </div>
                <p><strong>Emails:</strong> {displayJoined([activeLead.email, ...(activeLead.alternateEmails ?? [])], activeLead.email)}</p>
                <p><strong>Phone numbers:</strong> {displayJoined(activeLead.mergedPhoneNumbers, activeLead.phoneNumber)}</p>
                <p><strong>LinkedIn:</strong> {displayJoined(activeLead.mergedLinkedinUrls, activeLead.linkedinUrl)}</p>
                <p><strong>Cities:</strong> {displayJoined(activeLead.mergedCities, activeLead.city)}</p>
                <p><strong>Countries:</strong> {displayJoined(activeLead.mergedCountries, activeLead.country)}</p>
                <p><strong>Source:</strong> {activeLead.source}</p>
                <p><strong>Education:</strong> {activeLead.education}</p>
                <p><strong>Notion Team Member page:</strong> {activeLead.notionTeamMemberPageUrl ? (
                  <a href={activeLead.notionTeamMemberPageUrl} target="_blank" rel="noreferrer" className="text-[#00349B] underline">
                    {notionTitleFromUrl(activeLead.notionTeamMemberPageUrl) || activeLead.notionTeamMemberPageUrl}
                  </a>
                ) : '—'}</p>
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
            <p className="mt-3 text-sm leading-6 text-gray-700">Signed applicants can now be onboarded explicitly, while joined applicants continue to get a working Chronos profile automatically. Team Members sync is also refreshed periodically from the shared user data.</p>
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
                  values={mergeOptions.emails}
                  selected={keep.emails}
                  field="emails"
                  onToggle={toggleKeepValue}
                />
              )}
              {differing.phoneNumbers && <MergeOptionsField label="Phone numbers" values={mergeOptions.phoneNumbers} selected={keep.phoneNumbers} field="phoneNumbers" onToggle={toggleKeepValue} />}
              {differing.linkedinUrls && <MergeOptionsField label="LinkedIn URLs" values={mergeOptions.linkedinUrls} selected={keep.linkedinUrls} field="linkedinUrls" onToggle={toggleKeepValue} />}
              {differing.cities && <MergeOptionsField label="Cities" values={mergeOptions.cities} selected={keep.cities} field="cities" onToggle={toggleKeepValue} />}
              {differing.countries && <MergeOptionsField label="Countries" values={mergeOptions.countries} selected={keep.countries} field="countries" onToggle={toggleKeepValue} />}
              {differing.rolesAppliedFor && <MergeOptionsField label="Roles applied for" values={mergeOptions.rolesAppliedFor} selected={keep.rolesAppliedFor} field="rolesAppliedFor" onToggle={toggleKeepValue} />}
              {differing.education && <MergeOptionsField label="Education" values={mergeOptions.education} selected={keep.education} field="education" onToggle={toggleKeepValue} />}
              {differing.sources && <MergeOptionsField label="Sources" values={mergeOptions.sources} selected={keep.sources} field="sources" onToggle={toggleKeepValue} />}
              {differing.firstNames && <MergeOptionsField label="First names" values={mergeOptions.firstNames} selected={keep.firstNames} field="firstNames" onToggle={toggleKeepValue} />}
              {differing.lastNames && <MergeOptionsField label="Last names" values={mergeOptions.lastNames} selected={keep.lastNames} field="lastNames" onToggle={toggleKeepValue} />}
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

      {editOpen && activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Edit lead details</h3>
                <p className="mt-1 text-sm text-gray-600">Update core profile fields for this lead.</p>
              </div>
              <button type="button" onClick={() => setEditOpen(false)} className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100">Close</button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <EditField label="First name" value={editForm.firstName} onChange={(value) => setEditForm((c) => ({ ...c, firstName: value }))} />
              <EditField label="Last name" value={editForm.lastName} onChange={(value) => setEditForm((c) => ({ ...c, lastName: value }))} />
              <EditField label="Primary email" value={editForm.email} onChange={(value) => setEditForm((c) => ({ ...c, email: value }))} />
              <div>
                <label className="text-sm font-semibold text-gray-800">Applicant status</label>
                <select
                  value={editForm.status}
                  onChange={(event) =>
                    setEditForm((c) => ({
                      ...c,
                      status: event.target.value as ApplicantStatus,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#00349B]"
                >
                  {APPLICANT_STATUS_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {formatApplicantStatusLabel(value)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Stored on shared <code className="text-[11px]">flolabs_users.status</code>. Graduated and Terminated disable Chronos access.
                </p>
              </div>
              <EditField label="Role applied for" value={editForm.roleAppliedFor} onChange={(value) => setEditForm((c) => ({ ...c, roleAppliedFor: value }))} />
              <EditField label="Source" value={editForm.source} onChange={(value) => setEditForm((c) => ({ ...c, source: value }))} />
              <EditField label="Education" value={editForm.education} onChange={(value) => setEditForm((c) => ({ ...c, education: value }))} />
              <MultiValueField label="Alternate emails" values={editForm.alternateEmails} onChange={(values) => setEditForm((c) => ({ ...c, alternateEmails: values }))} />
              <MultiValueField label="Phone numbers" values={editForm.phoneNumbers} onChange={(values) => setEditForm((c) => ({ ...c, phoneNumbers: values }))} />
              <MultiValueField label="LinkedIn URLs" values={editForm.linkedinUrls} onChange={(values) => setEditForm((c) => ({ ...c, linkedinUrls: values }))} />
              <MultiValueField label="Cities" values={editForm.cities} onChange={(values) => setEditForm((c) => ({ ...c, cities: values }))} />
              <MultiValueField label="Countries" values={editForm.countries} onChange={(values) => setEditForm((c) => ({ ...c, countries: values }))} />
            </div>

            <div className="mt-3">
              <NotionPageSearchField
                value={editForm.notionTeamMemberPageUrl}
                onChange={(value) => setEditForm((c) => ({ ...c, notionTeamMemberPageUrl: value.url, notionTeamMemberId: value.id }))}
                leadName={`${editForm.firstName} ${editForm.lastName}`.trim()}
              />
            </div>

            <div className="mt-3">
              <label className="text-sm font-semibold text-gray-800">Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(event) => setEditForm((c) => ({ ...c, notes: event.target.value }))}
                className="mt-1 min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#00349B]"
              />
            </div>

            {editError && <p className="mt-3 text-sm text-red-600">{editError}</p>}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteLead(true)}
                className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                Delete user permanently
              </button>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setEditOpen(false)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button>
                <button
                  type="button"
                  disabled={editSaving}
                  onClick={saveLeadEdit}
                  className="rounded-xl bg-[#00349B] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteLead && activeLead && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Permanently delete user?</h3>
            <p className="mt-3 text-sm text-gray-700">
              Are you sure that the user did not Terminate or Graduate instead, and you want to permanently delete its data?
            </p>
            <p className="mt-2 text-xs text-gray-500">
              This archives the Notion Team Member page (if linked) and removes {activeLead.firstName} {activeLead.lastName} from the database.
            </p>
            {editError && <p className="mt-3 text-sm text-red-600">{editError}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteLead(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteSaving}
                onClick={deleteLeadPermanently}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteSaving ? 'Deleting...' : 'Delete permanently'}
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
  field: keyof MergeFieldState;
  onToggle: (field: keyof MergeFieldState, value: string, checked: boolean) => void;
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

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-sm font-semibold text-gray-800">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#00349B]"
      />
    </label>
  );
}

function notionTitleFromUrl(url: string): string {
  if (!url) return '';
  try {
    const slug = new URL(url).pathname.split('/').filter(Boolean).pop() ?? '';
    return slug.replace(/-?[0-9a-f]{32}$/i, '').replace(/-/g, ' ').trim();
  } catch {
    return '';
  }
}

function NotionPageSearchField({
  value,
  onChange,
  leadName,
}: {
  value: string;
  onChange: (value: { url: string; id: string }) => void;
  leadName: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; title: string; url: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedTitle = notionTitleFromUrl(value);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  async function doSearch(q: string) {
    setSearching(true);
    setSearchError('');
    const res = await fetch(`/api/admin/notion/team-members/search?q=${encodeURIComponent(q.trim())}`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({ error: 'Search failed' }));
    setSearching(false);
    if (!res.ok) { setSearchError(data.error ?? 'Search failed'); return; }
    setResults(data.results ?? []);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void doSearch(q || leadName); }, 300);
  }

  function handleFocus() {
    const q = query || selectedTitle || leadName;
    setQuery(q);
    setOpen(true);
    void doSearch(q);
  }

  function choose(page: { id: string; title: string; url: string }) {
    onChange({ url: page.url, id: page.id });
    setOpen(false);
    setResults([]);
    setQuery('');
  }

  function clear() {
    onChange({ url: '', id: '' });
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  const visibleValue = open ? query : (selectedTitle || '');

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-sm font-semibold text-gray-800">Notion Team Member page</label>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 min-h-[42px] focus-within:border-[#00349B] focus-within:ring-1 focus-within:ring-[#00349B] transition-shadow">
        <span className="material-symbols-outlined shrink-0 text-[#00349B]" style={{ fontSize: '18px' }}>person_search</span>
        <input
          type="text"
          value={visibleValue}
          onFocus={handleFocus}
          onChange={handleInputChange}
          placeholder={`Search for ${leadName || 'team member'}…`}
          className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
        />
        {searching && <span className="text-xs text-gray-400 shrink-0">Searching…</span>}
        {value && !searching && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
            className="p-0.5 rounded text-gray-400 hover:text-gray-700 transition-colors shrink-0"
            aria-label="Clear"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
          </button>
        )}
      </div>
      {value && !open && (
        <a href={value} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-xs text-[#00349B] underline">
          {value}
        </a>
      )}
      {searchError && <p className="mt-1 text-xs text-red-600">{searchError}</p>}
      {open && (results.length > 0 || (!searching && !searchError && query.trim())) && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-500">No results found.</p>
          ) : results.map((page) => {
            const active = page.url === value;
            return (
              <button
                key={page.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(page)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  active ? 'bg-[#eef5ff] text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined shrink-0 text-[#00349B]" style={{ fontSize: '16px' }}>person</span>
                <span className="flex-1 truncate font-medium">{page.title}</span>
                {active && (
                  <span className="material-symbols-outlined ml-auto shrink-0 text-[#00349B]" style={{ fontSize: '16px' }}>check</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MultiValueField({ label, values, onChange }: { label: string; values: string[]; onChange: (values: string[]) => void }) {
  const [inputValue, setInputValue] = useState('');

  function addValue() {
    const trimmed = inputValue.trim();
    if (!trimmed || values.includes(trimmed)) { setInputValue(''); return; }
    onChange([...values, trimmed]);
    setInputValue('');
  }

  return (
    <div className="md:col-span-2">
      <span className="block text-sm font-semibold text-gray-800">{label}</span>
      <div className="mt-1 flex min-h-[28px] flex-wrap gap-1.5">
        {values.length === 0 && <span className="py-0.5 text-xs text-gray-400">None</span>}
        {values.map((value, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs text-blue-900">
            {value}
            <button
              type="button"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="ml-0.5 font-bold leading-none text-blue-300 hover:text-red-500"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addValue(); } }}
          placeholder={`Add ${label.toLowerCase()}…`}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#00349B]"
        />
        <button
          type="button"
          onClick={addValue}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

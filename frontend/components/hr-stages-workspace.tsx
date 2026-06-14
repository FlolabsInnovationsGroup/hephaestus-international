'use client';

import { useEffect, useMemo, useState } from 'react';
import { toEmbedUrl } from '@/lib/embed-url';

type PassingCondition = 'none' | 'ai' | 'hr';

const HR_LOCKED_STAGE_IDS = new Set(['second_meeting', 'agreement_sent', 'agreement_signed', 'chronos_synced', 'joined']);

type Step = {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  applicantAction: string;
  adminAction: string;
  active?: boolean;
  passingCondition?: PassingCondition;
  passingConditionAiPrompt?: string;
};

type Resource = {
  id: string;
  stage: string;
  title: string;
  url: string;
  applicantPrompt: string;
};

type Stat = {
  stageId: string;
  currentCount: number;
  averageHours: number;
  samples: number;
};

export function HrStagesWorkspace({
  steps,
  allSteps,
  initialResources,
  stats,
}: {
  steps: Step[];
  allSteps: Step[];
  initialResources: Resource[];
  stats: Stat[];
}) {
  const [localSteps, setLocalSteps] = useState<Step[]>(steps);
  const [activeStageId, setActiveStageId] = useState(steps[0]?.id ?? '');
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [applicantPrompt, setApplicantPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingStage, setSavingStage] = useState(false);
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState<'add' | 'remove' | 'edit' | null>(null);
  const [candidateAddStageId, setCandidateAddStageId] = useState('');
  const [editingStageId, setEditingStageId] = useState('');
  const [removingStageId, setRemovingStageId] = useState('');
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [resEditTitle, setResEditTitle] = useState('');
  const [resEditUrl, setResEditUrl] = useState('');
  const [resEditPrompt, setResEditPrompt] = useState('');
  const [savingResourceEdit, setSavingResourceEdit] = useState(false);

  const stage = localSteps.find((item) => item.id === activeStageId) ?? localSteps[0];
  const stageResources = resources.filter((item) => item.stage === stage?.id);
  const statByStage = useMemo(() => new Map(stats.map((item) => [item.stageId, item])), [stats]);
  const activeStat = stage ? statByStage.get(stage.id) : null;
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editApplicantAction, setEditApplicantAction] = useState('');
  const [conditionType, setConditionType] = useState<PassingCondition>(steps[0]?.passingCondition ?? 'ai');
  const [conditionAiPrompt, setConditionAiPrompt] = useState(steps[0]?.passingConditionAiPrompt ?? '');
  const [savingCondition, setSavingCondition] = useState(false);
  // Track the last-saved {type, prompt} so conditionSaved is derived rather than
  // relying on a setTimeout-based boolean (which is prone to batching races).
  const [savedConditionData, setSavedConditionData] = useState<{ type: PassingCondition; prompt: string } | null>(null);
  const conditionSaved = savedConditionData != null
    && savedConditionData.type === conditionType
    && savedConditionData.prompt === conditionAiPrompt;
  const [inlineApplicantAction, setInlineApplicantAction] = useState('');
  const [savingApplicantAction, setSavingApplicantAction] = useState(false);
  const [applicantActionSaved, setApplicantActionSaved] = useState(false);
  const inactiveStages = useMemo(
    () => allSteps.filter((item) => !localSteps.some((active) => active.id === item.id)),
    [allSteps, localSteps],
  );

  async function addResource() {
    setError('');
    if (!stage || !title.trim() || !url.trim()) {
      setError('Title and URL are required.');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/admin/stages/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: stage.id, title: title.trim(), url: url.trim(), applicantPrompt: applicantPrompt.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not add resource.');
      return;
    }
    setResources((current) => [...current, data.resource]);
    setTitle('');
    setUrl('');
    setApplicantPrompt('');
  }

  async function deleteResource(id: string) {
    const res = await fetch(`/api/admin/stages/resources?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) return;
    setResources((current) => current.filter((item) => item.id !== id));
  }

  function openResourceEdit(resource: Resource) {
    setError('');
    setEditingResourceId(resource.id);
    setResEditTitle(resource.title);
    setResEditUrl(resource.url);
    setResEditPrompt(resource.applicantPrompt);
  }

  async function saveResourceEdit() {
    if (!editingResourceId) return;
    if (!resEditTitle.trim() || !resEditUrl.trim()) {
      setError('Title and URL are required.');
      return;
    }
    setSavingResourceEdit(true);
    setError('');
    const res = await fetch('/api/admin/stages/resources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingResourceId,
        title: resEditTitle.trim(),
        url: resEditUrl.trim(),
        applicantPrompt: resEditPrompt.trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingResourceEdit(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not update content.');
      return;
    }
    const updated = data.resource as Resource | undefined;
    if (updated) {
      setResources((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
    }
    setEditingResourceId(null);
  }

  async function saveStageDetails() {
    if (!editingStageId) return;
    setSavingStage(true);
    setError('');
    const res = await fetch('/api/admin/stages/definitions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stageId: editingStageId,
        shortLabel: editName.trim(),
        title: editTitle.trim(),
        description: editDescription.trim(),
        applicantAction: editApplicantAction.trim(),
      }),
    });
    setSavingStage(false);
    if (!res.ok) {
      setError('Could not save stage details.');
      return;
    }
    setLocalSteps((current) => current.map((item) => item.id === editingStageId ? {
      ...item,
      shortLabel: editName.trim(),
      title: editTitle.trim(),
      description: editDescription.trim(),
      applicantAction: editApplicantAction.trim(),
    } : item));
    setPendingAction(null);
  }

  async function deleteStage() {
    if (!removingStageId) return;
    const res = await fetch(`/api/admin/stages/definitions?stageId=${encodeURIComponent(removingStageId)}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Could not delete stage.');
      return;
    }
    const next = localSteps.filter((item) => item.id !== removingStageId);
    setLocalSteps(next);
    if (next.length > 0 && removingStageId === activeStageId) setActiveStageId(next[0].id);
    setPendingAction(null);
    setRemovingStageId('');
  }

  async function addStage(stageId: string) {
    if (!stageId) return;
    const res = await fetch('/api/admin/stages/definitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? 'Could not add stage.');
      return;
    }
    const added = data.stage as Step | undefined;
    if (!added) return;
    setLocalSteps((current) => {
      if (current.some((item) => item.id === added.id)) return current;
      return [...current, added];
    });
    setActiveStageId(added.id);
    setPendingAction(null);
  }

  useEffect(() => {
    if (inactiveStages.length === 0) {
      setCandidateAddStageId('');
      return;
    }
    if (!inactiveStages.some((item) => item.id === candidateAddStageId)) {
      setCandidateAddStageId(inactiveStages[0].id);
    }
  }, [candidateAddStageId, inactiveStages]);

  useEffect(() => {
    setConditionType(stage?.passingCondition ?? 'ai');
    setConditionAiPrompt(stage?.passingConditionAiPrompt ?? '');
    setSavedConditionData(null);
    setInlineApplicantAction(stage?.applicantAction ?? '');
    setApplicantActionSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStageId]);

  async function savePassingCondition() {
    if (!stage) return;
    setSavingCondition(true);
    setError('');
    const res = await fetch('/api/admin/stages/definitions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stageId: stage.id,
        shortLabel: stage.shortLabel,
        title: stage.title,
        description: stage.description,
        applicantAction: stage.applicantAction,
        passingCondition: conditionType,
        passingConditionAiPrompt: conditionAiPrompt,
      }),
    });
    setSavingCondition(false);
    if (!res.ok) {
      setError('Could not save passing condition.');
      return;
    }
    setLocalSteps((current) => current.map((item) => item.id === stage.id
      ? { ...item, passingCondition: conditionType, passingConditionAiPrompt: conditionAiPrompt }
      : item,
    ));
    setSavedConditionData({ type: conditionType, prompt: conditionAiPrompt });
  }

  async function saveApplicantAction() {
    if (!stage) return;
    setSavingApplicantAction(true);
    const res = await fetch('/api/admin/stages/definitions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stageId: stage.id,
        shortLabel: stage.shortLabel,
        title: stage.title,
        description: stage.description,
        applicantAction: inlineApplicantAction,
        passingCondition: stage.passingCondition,
        passingConditionAiPrompt: stage.passingConditionAiPrompt,
      }),
    });
    setSavingApplicantAction(false);
    if (!res.ok) return;
    setLocalSteps((current) => current.map((item) =>
      item.id === stage.id ? { ...item, applicantAction: inlineApplicantAction } : item,
    ));
    setApplicantActionSaved(true);
    setTimeout(() => setApplicantActionSaved(false), 2000);
  }

  function openEditModal(stageToEdit: Step) {
    setEditingStageId(stageToEdit.id);
    setEditName(stageToEdit.shortLabel);
    setEditTitle(stageToEdit.title);
    setEditDescription(stageToEdit.description);
    setEditApplicantAction(stageToEdit.applicantAction);
    setPendingAction('edit');
  }

  if (!stage) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between px-2 py-2">
          <h1 className="text-lg font-semibold text-gray-900">Stages</h1>
          <button
            type="button"
            disabled={inactiveStages.length === 0}
            onClick={() => {
              setError('');
              setCandidateAddStageId(inactiveStages[0]?.id ?? '');
              setPendingAction('add');
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#00349B]/20 text-lg font-semibold text-[#00349B] hover:bg-[#eef5ff] disabled:opacity-50"
            aria-label="Add stage"
            title="Add stage"
          >
            +
          </button>
        </div>
        <div className="mt-1 space-y-1">
          {localSteps.map((item, index) => (
            <div key={item.id} className={`flex items-center gap-2 rounded-xl px-2 py-1 ${item.id === stage.id ? 'bg-[#eef5ff]' : ''}`}>
              <button
                type="button"
                onClick={() => setActiveStageId(item.id)}
                className={`flex-1 rounded-lg px-2 py-2 text-left text-sm ${item.id === stage.id ? 'text-[#00349B]' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <p className="font-semibold">{index + 1}. {item.title}</p>
                <p className="text-xs opacity-80">{item.id}</p>
              </button>
              <button
                type="button"
                onClick={() => openEditModal(item)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                aria-label={`Edit ${item.title}`}
                title="Edit stage"
              >
                ✎
              </button>
              <button
                type="button"
                disabled={localSteps.length <= 1}
                onClick={() => {
                  setError('');
                  setRemovingStageId(item.id);
                  setPendingAction('remove');
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                aria-label={`Remove ${item.title}`}
                title="Remove stage"
              >
                -
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="space-y-5">
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#00349B]">Stage overview</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">{stage.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{stage.id}</p>
            </div>
            <span className="rounded-full bg-[#eef5ff] px-4 py-2 text-sm font-semibold text-[#00349B]">{stage.shortLabel}</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-[#f7faff] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#00349B]">Applicants currently here</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{activeStat?.currentCount ?? 0}</p>
            </div>
            <div className="rounded-xl bg-[#f7faff] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#00349B]">Average time in stage</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{(activeStat?.averageHours ?? 0).toFixed(1)} hours</p>
              <p className="text-xs text-gray-500">Based on {activeStat?.samples ?? 0} timeline sample(s)</p>
            </div>
          </div>
        </div>

        <PassingConditionCard
          stageId={stage.id}
          isLocked={HR_LOCKED_STAGE_IDS.has(stage.id)}
          conditionType={conditionType}
          conditionAiPrompt={conditionAiPrompt}
          saving={savingCondition}
          saved={conditionSaved}
          onConditionChange={(type) => setConditionType(type)}
          onAiPromptChange={(prompt) => setConditionAiPrompt(prompt)}
          onSave={() => void savePassingCondition()}
        />

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">What applicants see</h3>
            <p className="mt-2 text-sm text-gray-700">{stage.description}</p>
            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#00349B]">Applicant action</label>
              <p className="mt-1 text-xs text-gray-500">Message shown under "What to do now" on the applicant's dashboard.</p>
              <textarea
                value={inlineApplicantAction}
                onChange={(e) => { setInlineApplicantAction(e.target.value); setApplicantActionSaved(false); }}
                rows={3}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]"
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  disabled={savingApplicantAction}
                  onClick={() => void saveApplicantAction()}
                  className="rounded-xl bg-[#00349B] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {savingApplicantAction ? 'Saving…' : 'Save'}
                </button>
                {applicantActionSaved && <p className="text-sm font-medium text-green-600">Saved</p>}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Stage content manager</h3>
            <div className="mt-4 grid gap-3">
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Content title" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
              <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
              <input value={applicantPrompt} onChange={(event) => setApplicantPrompt(event.target.value)} placeholder="Prompt for applicant response" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="button" disabled={saving} onClick={() => void addResource()} className="rounded-xl bg-[#00349B] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? 'Saving...' : 'Add URL'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4" data-testid="stage-resource-list">
          {stageResources.length === 0 && <p className="rounded-2xl border border-blue-100 bg-white p-5 text-sm text-gray-500 shadow-sm">No content URLs configured for this stage yet.</p>}
          {stageResources.map((resource) => (
            <div key={resource.id} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{resource.title}</p>
                  <p className="mt-1 text-sm text-gray-600 break-all">{resource.url}</p>
                  {resource.applicantPrompt && <p className="mt-2 text-sm text-gray-700"><strong>Applicant input:</strong> {resource.applicantPrompt}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" onClick={() => openResourceEdit(resource)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    Edit
                  </button>
                  <button type="button" onClick={() => void deleteResource(resource.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                    Remove
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm">
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#00349B] underline">
                  Open in new tab
                </a>
                <span className="text-gray-500"> — embedding is blocked for some URLs.</span>
              </p>
              <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 aspect-video portrait:aspect-[4/3]">
                <iframe title={resource.title} src={toEmbedUrl(resource.url)} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            </div>
          ))}
        </div>
      </section>
      {editingResourceId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Edit content URL</h3>
            <p className="mt-1 text-sm text-gray-600">Update title, link, and applicant prompt for this item.</p>
            <div className="mt-4 grid gap-3">
              <input value={resEditTitle} onChange={(event) => setResEditTitle(event.target.value)} placeholder="Content title" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
              <input value={resEditUrl} onChange={(event) => setResEditUrl(event.target.value)} placeholder="https://..." className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
              <input value={resEditPrompt} onChange={(event) => setResEditPrompt(event.target.value)} placeholder="Prompt for applicant response" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingResourceId(null);
                  setError('');
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingResourceEdit}
                onClick={() => void saveResourceEdit()}
                className="rounded-xl bg-[#00349B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingResourceEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            {pendingAction === 'add' ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900">Add stage</h3>
                <p className="mt-1 text-sm text-gray-600">Choose an inactive stage to add back to the Stages list.</p>
                <select
                  value={candidateAddStageId}
                  onChange={(event) => setCandidateAddStageId(event.target.value)}
                  className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]"
                >
                  {inactiveStages.map((item) => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingAction(null);
                      setRemovingStageId('');
                    }}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!candidateAddStageId}
                    onClick={() => {
                      void addStage(candidateAddStageId);
                    }}
                    className="rounded-xl bg-[#00349B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Confirm add
                  </button>
                </div>
              </>
            ) : pendingAction === 'remove' ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900">Remove stage</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Are you sure you want to remove{' '}
                  <strong>{localSteps.find((item) => item.id === removingStageId)?.title ?? 'this stage'}</strong>{' '}
                  from the active stage list?
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingAction(null);
                      setRemovingStageId('');
                    }}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void deleteStage();
                    }}
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Confirm remove
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900">Edit stage</h3>
                <p className="mt-1 text-sm text-gray-600">Update name, title, description, and the applicant “What to do now” message.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="Name" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
                  <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} placeholder="Title" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#00349B]">What to do now (applicant dashboard)</p>
                <textarea value={editApplicantAction} onChange={(event) => setEditApplicantAction(event.target.value)} placeholder="Instructions shown under “What to do now” on the applicant’s application page" className="mt-2 min-h-20 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Stage description</p>
                <textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" onClick={() => setPendingAction(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="button" onClick={() => void saveStageDetails()} disabled={savingStage} className="rounded-xl bg-[#00349B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                    {savingStage ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PassingConditionCard({
  stageId,
  isLocked,
  conditionType,
  conditionAiPrompt,
  saving,
  saved,
  onConditionChange,
  onAiPromptChange,
  onSave,
}: {
  stageId: string;
  isLocked: boolean;
  conditionType: PassingCondition;
  conditionAiPrompt: string;
  saving: boolean;
  saved: boolean;
  onConditionChange: (type: PassingCondition) => void;
  onAiPromptChange: (prompt: string) => void;
  onSave: () => void;
}) {
  const options: { value: PassingCondition; label: string; description: string }[] = [
    {
      value: 'none',
      label: 'No action required',
      description: 'Applicant moves to the next stage automatically on entry. No content or AI review is shown.',
    },
    {
      value: 'ai',
      label: 'AI evaluation',
      description: 'The AI model evaluates the applicant\'s responses using the prompt below as reviewer context.',
    },
    {
      value: 'hr',
      label: 'HR approval',
      description: 'An HR team member must manually advance the applicant. No self-review button is shown.',
    },
  ];

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900">Passing condition</h3>
        {isLocked && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Locked — HR approval required
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Controls what needs to happen before an applicant advances from this stage.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const isSelected = conditionType === option.value;
          const isDisabled = isLocked && option.value !== 'hr';
          return (
            <button
              key={option.value}
              type="button"
              disabled={isDisabled}
              data-value={option.value}
              data-selected={isSelected ? 'true' : 'false'}
              onClick={() => !isDisabled && onConditionChange(option.value)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                isSelected
                  ? 'border-[#00349B] bg-[#eef5ff]'
                  : isDisabled
                  ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-50'
                  : 'border-gray-200 hover:border-[#00349B]/40 hover:bg-[#f7faff]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                    isSelected ? 'border-[#00349B] bg-[#00349B]' : 'border-gray-300'
                  }`}
                />
                <p className={`text-sm font-semibold ${isSelected ? 'text-[#00349B]' : 'text-gray-800'}`}>
                  {option.label}
                </p>
              </div>
              <p className="mt-1.5 pl-6 text-xs text-gray-500">{option.description}</p>
            </button>
          );
        })}
      </div>

      {conditionType === 'ai' && !isLocked && (
        <div suppressHydrationWarning className="mt-4">
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#00349B]">
            AI evaluation prompt
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Additional context for the model — what to specifically watch for in applicant responses on this stage.
          </p>
          <textarea
            value={conditionAiPrompt}
            onChange={(event) => onAiPromptChange(event.target.value)}
            placeholder="e.g. Pay special attention to whether the applicant identifies specific opportunities for FloLabs in the content they reviewed."
            className="mt-2 min-h-24 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]"
          />
        </div>
      )}

      {!isLocked && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="rounded-xl bg-[#00349B] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save condition'}
          </button>
          {saved && <p className="text-sm font-medium text-green-600">Saved</p>}
        </div>
      )}
    </div>
  );
}

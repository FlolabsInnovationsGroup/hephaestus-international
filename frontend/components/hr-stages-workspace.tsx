'use client';

import { useEffect, useMemo, useState } from 'react';

type Step = {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  applicantAction: string;
  adminAction: string;
  active?: boolean;
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

function toEmbedUrl(url: string) {
  const normalized = url.trim();
  if (!normalized) return '';
  if (normalized.includes('youtube.com/watch')) {
    const parsed = new URL(normalized);
    const id = parsed.searchParams.get('v');
    return id ? `https://www.youtube.com/embed/${id}` : normalized;
  }
  if (normalized.includes('youtu.be/')) {
    const id = normalized.split('youtu.be/')[1]?.split('?')[0];
    return id ? `https://www.youtube.com/embed/${id}` : normalized;
  }
  return normalized;
}

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

  const stage = localSteps.find((item) => item.id === activeStageId) ?? localSteps[0];
  const stageResources = resources.filter((item) => item.stage === stage?.id);
  const statByStage = useMemo(() => new Map(stats.map((item) => [item.stageId, item])), [stats]);
  const activeStat = stage ? statByStage.get(stage.id) : null;
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
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
      }),
    });
    setSavingStage(false);
    if (!res.ok) {
      setError('Could not save stage details.');
      return;
    }
    setLocalSteps((current) => current.map((item) => item.id === editingStageId ? { ...item, shortLabel: editName.trim(), title: editTitle.trim(), description: editDescription.trim() } : item));
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

  function openEditModal(stageToEdit: Step) {
    setEditingStageId(stageToEdit.id);
    setEditName(stageToEdit.shortLabel);
    setEditTitle(stageToEdit.title);
    setEditDescription(stageToEdit.description);
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

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">What applicants see</h3>
            <p className="mt-2 text-sm text-gray-700">{stage.description}</p>
            <div className="mt-4 rounded-xl bg-[#f7faff] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#00349B]">Applicant action</p>
              <p className="mt-2 text-sm text-gray-700">{stage.applicantAction}</p>
            </div>
            <div className="mt-4 rounded-xl bg-[#f7faff] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#00349B]">HR action</p>
              <p className="mt-2 text-sm text-gray-700">{stage.adminAction}</p>
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

        <div className="space-y-4">
          {stageResources.length === 0 && <p className="rounded-2xl border border-blue-100 bg-white p-5 text-sm text-gray-500 shadow-sm">No content URLs configured for this stage yet.</p>}
          {stageResources.map((resource) => (
            <div key={resource.id} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{resource.title}</p>
                  <p className="mt-1 text-sm text-gray-600 break-all">{resource.url}</p>
                  {resource.applicantPrompt && <p className="mt-2 text-sm text-gray-700"><strong>Applicant input:</strong> {resource.applicantPrompt}</p>}
                </div>
                <button type="button" onClick={() => void deleteResource(resource.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                  Remove
                </button>
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                <iframe src={toEmbedUrl(resource.url)} className="h-72 w-full" loading="lazy" />
              </div>
            </div>
          ))}
        </div>
      </section>
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
                <p className="mt-1 text-sm text-gray-600">Update name, title, and description for this stage.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="Name" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
                  <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} placeholder="Title" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
                </div>
                <textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} className="mt-3 min-h-24 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
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

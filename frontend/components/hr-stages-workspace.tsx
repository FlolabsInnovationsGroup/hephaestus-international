'use client';

import { useMemo, useState } from 'react';

type Step = {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  applicantAction: string;
  adminAction: string;
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

export function HrStagesWorkspace({ steps, initialResources, stats }: { steps: Step[]; initialResources: Resource[]; stats: Stat[] }) {
  const [activeStageId, setActiveStageId] = useState(steps[0]?.id ?? '');
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [applicantPrompt, setApplicantPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const stage = steps.find((item) => item.id === activeStageId) ?? steps[0];
  const stageResources = resources.filter((item) => item.stage === stage?.id);
  const statByStage = useMemo(() => new Map(stats.map((item) => [item.stageId, item])), [stats]);
  const activeStat = stage ? statByStage.get(stage.id) : null;

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

  if (!stage) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm">
        <h1 className="px-2 py-2 text-lg font-semibold text-gray-900">Stages</h1>
        <div className="mt-1 space-y-1">
          {steps.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveStageId(item.id)}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${item.id === stage.id ? 'bg-[#eef5ff] text-[#00349B]' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <p className="font-semibold">{index + 1}. {item.title}</p>
              <p className="text-xs opacity-80">{item.id}</p>
            </button>
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
    </div>
  );
}

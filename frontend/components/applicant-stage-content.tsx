'use client';

import { useState } from 'react';
import { toEmbedUrl } from '@/lib/embed-url';

type StageResource = {
  id: string;
  title: string;
  url: string;
  applicantPrompt: string;
  latestResponse?: { responseText: string } | null;
};

export function ApplicantStageContent({ resources }: { resources: StageResource[] }) {
  const [responses, setResponses] = useState<Record<string, string>>(
    Object.fromEntries(resources.map((item) => [item.id, item.latestResponse?.responseText ?? ''])),
  );
  const [savingId, setSavingId] = useState<string>('');

  async function submit(resourceId: string) {
    const value = (responses[resourceId] ?? '').trim();
    if (!value) return;
    setSavingId(resourceId);
    await fetch('/api/applications/stage-responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId, responseText: value }),
    });
    setSavingId('');
  }

  if (resources.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-blue-100">
        <h3 className="text-xl font-semibold text-gray-900">Stage content</h3>
        <p className="mt-3 text-sm text-gray-600">No materials have been assigned to this stage yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {resources.map((resource) => (
        <div key={resource.id} className="rounded-2xl bg-white p-6 shadow-sm border border-blue-100">
          <h3 className="text-xl font-semibold text-gray-900">{resource.title}</h3>
          <p className="mt-2 text-xs text-gray-500 break-all">{resource.url}</p>
          <p className="mt-2 text-sm">
            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#00349B] underline">
              Open in new tab
            </a>
            <span className="text-gray-500"> — use this if the preview does not load (some sites block embedding).</span>
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
            <iframe title={resource.title} src={toEmbedUrl(resource.url)} className="h-72 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
          {resource.applicantPrompt && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-800">{resource.applicantPrompt}</p>
              <textarea
                value={responses[resource.id] ?? ''}
                onChange={(event) => setResponses((current) => ({ ...current, [resource.id]: event.target.value }))}
                className="mt-2 min-h-24 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]"
                placeholder="Write your take here..."
              />
              <button type="button" onClick={() => void submit(resource.id)} disabled={savingId === resource.id} className="mt-2 rounded-xl bg-[#00349B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {savingId === resource.id ? 'Saving...' : 'Save response'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { toEmbedUrl } from '@/lib/embed-url';
import { isApplicantReviewWaitStage } from '@/lib/stage-definitions';

type StageResource = {
  id: string;
  title: string;
  url: string;
  applicantPrompt: string;
  latestResponse?: { responseText: string } | null;
};

type StageCompleteReviewPayload = {
  evaluated?: boolean;
  outcome?: string;
  newStageTitle?: string;
  redirectTo?: string;
  applicantMessage?: string;
  /** True when required prompts are missing — stay on page, no full reload */
  incomplete?: boolean;
  noReviewablePrompts?: boolean;
  batchStageCount?: number;
  stageChanged?: boolean;
};

export function ApplicantStageContent({
  resources,
  currentStepTitle,
  currentStageId,
}: {
  resources: StageResource[];
  /** Shown next to the completion CTA for context */
  currentStepTitle?: string;
  /** Used to hide self-service review on HR "under review" pipeline steps */
  currentStageId?: string;
}) {
  const [responses, setResponses] = useState<Record<string, string>>(
    Object.fromEntries(resources.map((item) => [item.id, item.latestResponse?.responseText ?? ''])),
  );
  const [savingId, setSavingId] = useState<string>('');
  const [notice, setNotice] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const { allPromptsFilledInUi, showCompleteStageCta } = useMemo(() => {
    const prompted = resources.filter((r) => r.applicantPrompt?.trim());
    const allFilled =
      prompted.length > 0 &&
      prompted.every((r) => (responses[r.id] ?? '').trim().length > 0);
    const onReviewWait = currentStageId ? isApplicantReviewWaitStage(currentStageId) : false;
    return {
      allPromptsFilledInUi: allFilled,
      showCompleteStageCta: prompted.length > 0 && !onReviewWait,
    };
  }, [resources, responses, currentStageId]);

  async function submit(resourceId: string) {
    const value = (responses[resourceId] ?? '').trim();
    if (!value) return;
    setSavingId(resourceId);
    setNotice(null);
    const res = await fetch('/api/applications/stage-responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId, responseText: value }),
    });
    setSavingId('');
    if (!res.ok) {
      setNotice('Could not save that answer. Please try again.');
      return;
    }
  }

  async function completeStage() {
    setCompleting(true);
    setNotice(null);
    try {
      const res = await fetch('/api/applications/stage-complete-review', {
        method: 'POST',
        cache: 'no-store',
      });
      let data: { ok?: boolean; review?: StageCompleteReviewPayload; error?: string };
      try {
        data = (await res.json()) as { ok?: boolean; review?: StageCompleteReviewPayload; error?: string };
      } catch {
        setNotice('Could not read the server response. Please refresh the page and try again.');
        return;
      }
      if (!res.ok) {
        setNotice(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      const rev = data.review;

      if (rev?.incomplete) {
        if (rev.applicantMessage) setNotice(rev.applicantMessage);
        return;
      }

      if (rev?.applicantMessage) {
        try {
          sessionStorage.setItem('hephaestus_stage_notice', rev.applicantMessage);
        } catch {
          /* ignore */
        }
      }

      const target = rev?.redirectTo || `/me/application?updated=${Date.now()}`;
      window.location.assign(target);
    } finally {
      setCompleting(false);
    }
  }

  if (resources.length === 0) {
    const onTeamReview = currentStageId ? isApplicantReviewWaitStage(currentStageId) : false;
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-blue-100">
        <h3 className="text-xl font-semibold text-gray-900">Stage content</h3>
        {onTeamReview ? (
          <p className="mt-3 text-sm text-gray-600">
            There is nothing to fill in on this step — your previous submission is with our team for review. If anything needs
            another pass, Paula will reach out in <strong>Questions and answers</strong> on the left.
          </p>
        ) : (
          <p className="mt-3 text-sm text-gray-600">No materials have been assigned to this stage yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-gray-800" role="status">
          {notice}
        </div>
      )}

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
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 aspect-video portrait:aspect-[4/3]">
            <iframe title={resource.title} src={toEmbedUrl(resource.url)} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
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

      {showCompleteStageCta && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Ready for review</h3>
          <p className="mt-2 text-sm text-gray-600">
            Save each answer with <strong>Save response</strong>, then press the button when you want your work on
            {currentStepTitle ? (
              <>
                {' '}
                <span className="font-medium text-gray-800">{currentStepTitle}</span>
              </>
            ) : (
              ' this step'
            )}{' '}
            reviewed. Earlier steps with completed answers may be included in the same review to save time; only your{' '}
            <strong>current</strong> step is moved forward, held here, or moved one step back if the overall effort is
            clearly too low.
          </p>
          <button
            type="button"
            onClick={() => void completeStage()}
            disabled={completing || !allPromptsFilledInUi || savingId !== ''}
            className="mt-4 rounded-xl bg-[#00349B] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {completing ? 'Reviewing…' : "I've completed this stage"}
          </button>
          {!allPromptsFilledInUi && (
            <p className="mt-2 text-xs text-gray-500">Fill every prompt above (and save) to enable this button.</p>
          )}
        </div>
      )}
    </div>
  );
}

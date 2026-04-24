import stepsData from '@/app/STEPS.json';
import type { ApplicationStage, StageStep } from '@/app/application-data';

export const orderedSteps = stepsData as StageStep[];
export const orderedStageIds = orderedSteps.map((step) => step.id);
export const stageOrderMap = new Map(orderedStageIds.map((id, index) => [id, index]));

/** Next step in STEPS.json order (ignores HR "active" flags — applicants still follow the canonical pipeline). */
export function resolveNextPipelineStage(current: ApplicationStage): ApplicationStage | null {
  const idx = orderedStageIds.indexOf(current);
  if (idx < 0 || idx >= orderedStageIds.length - 1) return null;
  return orderedStageIds[idx + 1] as ApplicationStage;
}

/** Previous step in STEPS.json order. */
export function resolvePreviousPipelineStage(current: ApplicationStage): ApplicationStage | null {
  const idx = orderedStageIds.indexOf(current);
  if (idx <= 0) return null;
  return orderedStageIds[idx - 1] as ApplicationStage;
}

export function getStageOrder(stageId: string) {
  return stageOrderMap.get(stageId) ?? Number.MAX_SAFE_INTEGER;
}

export function formatStageLabel(stageId: string) {
  const index = stageOrderMap.get(stageId);
  if (index === undefined) return stageId;
  return `${index + 1}. ${stageId}`;
}

/** STEPS.json stages where the applicant waits on HR review (no "I've completed this stage" on the website). */
const APPLICANT_REVIEW_WAIT_STAGE_IDS = new Set([
  'interested_review',
  'meeting_recordings_submitted',
  'masterclass_submitted',
]);

export function isApplicantReviewWaitStage(stageId: string) {
  return APPLICANT_REVIEW_WAIT_STAGE_IDS.has(stageId);
}

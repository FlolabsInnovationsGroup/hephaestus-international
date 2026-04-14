import stepsData from '@/app/STEPS.json';
import type { StageStep } from '@/app/application-data';

export const orderedSteps = stepsData as StageStep[];
export const orderedStageIds = orderedSteps.map((step) => step.id);
export const stageOrderMap = new Map(orderedStageIds.map((id, index) => [id, index]));

export function getStageOrder(stageId: string) {
  return stageOrderMap.get(stageId) ?? Number.MAX_SAFE_INTEGER;
}

export function formatStageLabel(stageId: string) {
  const index = stageOrderMap.get(stageId);
  if (index === undefined) return stageId;
  return `${index + 1}. ${stageId}`;
}

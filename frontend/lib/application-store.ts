import { cookies } from 'next/headers';
import OpenAI from 'openai';
import { compare } from 'bcryptjs';
import stepsData from '@/app/STEPS.json';
import type { ApplicantProfile, ApplicationStage, StageStep } from '@/app/application-data';
import {
  addApplicantMessage,
  createApplicant,
  createStageResource,
  deleteStageResource,
  updateStageResource,
  findUserByEmail,
  getApplicantConversations,
  getApplicants,
  getStageResources,
  getStageResponsesForHr,
  getStageResponsesForApplicant,
  getStageTransitions,
  getUserById,
  getStageDefinitions,
  saveStageDefinition,
  saveStageResourceResponse,
  touchApplicantWebsiteVisit,
  updateApplicantProfile,
  updateApplicantStage,
} from '@/lib/application-db';
import { getStageOrder, isApplicantReviewWaitStage, orderedStageIds } from '@/lib/stage-definitions';
import { reviewStagesBatch, type StageReviewBlock, type StageReviewOutcome } from '@/lib/openai-stage-review';
import type { StageResourceResponseRecord } from '@/lib/application-db';
import { getOpenAIApiKey, getOpenAIChatModel, getOpenAIStageReviewModelForStageNumber } from '@/lib/openai-app-config';

const SESSION_COOKIE = 'fl_preview_session';

function isStageResponseAutoAdvanceEnabled() {
  const v = process.env.STAGE_RESPONSE_AUTO_ADVANCE;
  if (v === undefined || v === '') return true;
  return v !== 'false' && v !== '0';
}

function latestResponseByResourceId(responses: StageResourceResponseRecord[]) {
  const map = new Map<string, StageResourceResponseRecord>();
  for (const row of responses) {
    const prev = map.get(row.resourceId);
    const t = new Date(row.submittedAt).getTime();
    if (!prev || t > new Date(prev.submittedAt).getTime()) {
      map.set(row.resourceId, row);
    }
  }
  return map;
}

function resolveNextActiveStage(current: ApplicationStage, activeIds: Set<string>): ApplicationStage | null {
  const idx = orderedStageIds.indexOf(current);
  if (idx < 0) return null;
  for (let i = idx + 1; i < orderedStageIds.length; i += 1) {
    const id = orderedStageIds[i] as ApplicationStage;
    if (activeIds.has(id)) return id;
  }
  return null;
}

function resolvePreviousActiveStage(current: ApplicationStage, activeIds: Set<string>): ApplicationStage | null {
  const idx = orderedStageIds.indexOf(current);
  if (idx <= 0) return null;
  for (let i = idx - 1; i >= 0; i -= 1) {
    const id = orderedStageIds[i] as ApplicationStage;
    if (activeIds.has(id)) return id;
  }
  return null;
}

async function buildBatchStageReviewBlocks(
  currentStage: ApplicationStage,
  managed: Awaited<ReturnType<typeof getManagedSteps>>,
  activeIds: Set<string>,
  responses: StageResourceResponseRecord[],
): Promise<StageReviewBlock[]> {
  const latest = latestResponseByResourceId(responses);
  const currentIdx = orderedStageIds.indexOf(currentStage);
  if (currentIdx < 0) return [];

  const stageIdsToScan = orderedStageIds
    .slice(0, currentIdx + 1)
    .filter((id) => activeIds.has(id)) as ApplicationStage[];
  const resourceLists = await Promise.all(stageIdsToScan.map((stageId) => getStageResources(stageId)));

  const stages: StageReviewBlock[] = [];
  for (let i = 0; i < stageIdsToScan.length; i += 1) {
    const stageId = stageIdsToScan[i];
    const resources = resourceLists[i];
    const activeResources = resources.filter((r) => r.active);
    const required = activeResources.filter((r) => r.applicantPrompt?.trim());
    if (required.length === 0) continue;

    let allAnswered = true;
    const items: { title: string; prompt: string; response: string }[] = [];
    for (const r of required) {
      const text = latest.get(r.id)?.responseText?.trim() ?? '';
      if (!text) {
        allAnswered = false;
        break;
      }
      items.push({ title: r.title, prompt: r.applicantPrompt.trim(), response: text });
    }
    if (!allAnswered) continue;

    const stepMeta = managed.find((s) => s.id === stageId);
    stages.push({
      stageId,
      stageTitle: stepMeta?.title ?? stageId,
      stageDescription: stepMeta?.description ?? '',
      items,
    });
  }
  return stages;
}

export type StageCompleteReviewResult = {
  evaluated: boolean;
  /** Tri-state for the applicant's current stage after review */
  outcome?: StageReviewOutcome;
  newStage?: ApplicationStage;
  newStageTitle?: string;
  reason?: string;
  applicantMessage?: string;
  /** How many stages were included in the single OpenAI batch call */
  batchStageCount?: number;
  incomplete?: boolean;
  /** True when the step has no written prompts (nothing to run AI on) */
  noReviewablePrompts?: boolean;
  /** True when the applicant's pipeline stage was updated (client should hard-reload) */
  stageChanged?: boolean;
};

/**
 * Applicant-triggered: batch-evaluates every active stage up to the current one that has
 * all required answers (one model call), then applies the verdict for {@link currentStage} only.
 */
export async function completeApplicantStageReviewBatch(applicantId: string): Promise<StageCompleteReviewResult> {
  if (!isStageResponseAutoAdvanceEnabled()) {
    return {
      evaluated: false,
      stageChanged: false,
      applicantMessage:
        'Automatic stage review is turned off in this environment. Your answers are saved; HR will move you when it is time.',
    };
  }

  const user = await getUserById(applicantId);
  if (!user || user.role !== 'applicant') {
    return { evaluated: false, stageChanged: false };
  }

  const stageAtStart = user.stage;
  if (isApplicantReviewWaitStage(stageAtStart)) {
    return {
      evaluated: false,
      stageChanged: false,
      applicantMessage:
        'This step is reviewed by our team. You will be moved forward when they are ready — there is nothing to submit here.',
    };
  }

  const managed = await getManagedSteps();
  const activeIds = new Set(managed.map((s) => s.id));
  const responses = await getStageResponsesForApplicant(applicantId);

  const currentResources = await getStageResources(stageAtStart);
  const currentRequired = currentResources.filter((r) => r.active && r.applicantPrompt?.trim());
  if (currentRequired.length === 0) {
    return {
      evaluated: false,
      stageChanged: false,
      noReviewablePrompts: true,
      applicantMessage:
        'This step does not ask for written reflections here. When you are ready, our team will move you forward.',
    };
  }

  const latest = latestResponseByResourceId(responses);
  for (const r of currentRequired) {
    if (!latest.get(r.id)?.responseText?.trim()) {
      return {
        evaluated: false,
        stageChanged: false,
        incomplete: true,
        applicantMessage: 'Please write and save an answer for every prompt above before requesting a review.',
      };
    }
  }

  const stages = await buildBatchStageReviewBlocks(stageAtStart, managed, activeIds, responses);
  if (stages.length === 0) {
    return {
      evaluated: false,
      stageChanged: false,
      incomplete: true,
      applicantMessage: 'Please write and save an answer for every prompt above before requesting a review.',
    };
  }

  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    console.warn('[completeApplicantStageReviewBatch] Missing OPENAI_API_KEY; skipping review.');
    return {
      evaluated: true,
      outcome: 'stay',
      stageChanged: false,
      applicantMessage:
        'Your answers are saved. Automatic review is not configured yet; our team will move you forward when appropriate.',
    };
  }

  const stageNumber = getStageOrder(stageAtStart) + 1;
  const stageReviewModel = getOpenAIStageReviewModelForStageNumber(stageNumber);
  const batch = await reviewStagesBatch(stages, { model: stageReviewModel });
  if (batch.error || batch.decisions.length === 0) {
    console.warn('[completeApplicantStageReviewBatch]', batch.error ?? 'no decisions');
    return {
      evaluated: true,
      outcome: 'stay',
      stageChanged: false,
      applicantMessage: 'We could not complete an automatic review just now. Your answers are saved — please try again later or wait for HR.',
    };
  }

  const currentDecision = batch.decisions.find((d) => d.stageId === stageAtStart);
  if (!currentDecision) {
    return {
      evaluated: true,
      outcome: 'stay',
      stageChanged: false,
      applicantMessage: 'Review did not return a result for your current step. Your answers are saved.',
    };
  }

  const userAgain = await getUserById(applicantId);
  if (!userAgain || userAgain.stage !== stageAtStart) {
    return {
      evaluated: true,
      outcome: 'stay',
      stageChanged: false,
      applicantMessage: 'Your stage changed while we were reviewing. Refresh the page to see the latest step.',
    };
  }

  const nextStageId = resolveNextActiveStage(stageAtStart, activeIds);
  const previousStageId = resolvePreviousActiveStage(stageAtStart, activeIds);

  let newStage: ApplicationStage = stageAtStart;
  let outcome: StageReviewOutcome = currentDecision.outcome;

  if (outcome === 'next') {
    if (!nextStageId) {
      outcome = 'stay';
    } else {
      newStage = nextStageId;
    }
  } else if (outcome === 'previous') {
    if (!previousStageId) {
      outcome = 'stay';
    } else {
      newStage = previousStageId;
    }
  }

  if (newStage !== stageAtStart) {
    await updateApplicantStage(applicantId, newStage);
  }

  const newMeta = managed.find((s) => s.id === newStage);
  const newTitle = newMeta?.title ?? newStage;

  const rolledBack = outcome === 'previous' && newStage !== stageAtStart;
  if (rolledBack) {
    const greeting = (userAgain.firstName || '').trim() || 'there';
    await addApplicantMessage(
      applicantId,
      'paula',
      `Hi ${greeting},

I'm reaching out with something gentle: your application has been moved one step back on the pipeline so you can revisit "${newTitle}" when it works for you.

Please open the materials and prompts on your dashboard again and read them slowly. When you try the written reflections once more, a few clear sentences that show what you actually took away from the content make a real difference — we are not looking for perfection, just genuine engagement.

This happens more often than you might think, and it is not a reflection on you as a person. Take the time you need, and if anything feels unclear, message me here and I will help.

Warmly,
Paula`,
    );
  }

  let applicantMessage: string;
  if (outcome === 'next' && newStage !== stageAtStart) {
    applicantMessage = `You're now on: ${newTitle}. Refresh if the dashboard still shows the previous step.`;
  } else if (outcome === 'previous' && newStage !== stageAtStart) {
    applicantMessage = `Based on your answers, you have been moved one step back so you can revisit that part of the process. You are now on: ${newTitle}.`;
  } else if (currentDecision.outcome === 'next' && !nextStageId) {
    applicantMessage =
      'Great work — your answers are recorded. You are already at the last active step in the pipeline; HR will take it from here.';
  } else {
    applicantMessage =
      'Your responses are saved. Add more specific detail where the prompts ask for it, then try "I\'ve completed this stage" again, or wait for HR to follow up.';
  }

  console.log('[completeApplicantStageReviewBatch]', {
    applicantId,
    stageAtStart,
    appliedOutcome: outcome,
    modelOutcome: currentDecision.outcome,
    modelReason: currentDecision.reason,
    batchStageIds: stages.map((s) => s.stageId),
    allDecisions: batch.decisions.map((d) => ({ stageId: d.stageId, outcome: d.outcome })),
  });

  const stageChanged = newStage !== stageAtStart;

  return {
    evaluated: true,
    outcome,
    newStage,
    newStageTitle: newTitle,
    reason: currentDecision.reason,
    applicantMessage,
    batchStageCount: stages.length,
    stageChanged,
  };
}

export async function getSessionUser(): Promise<ApplicantProfile | null> {
  const jar = await cookies();
  const userId = jar.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  return await getUserById(userId);
}

export async function markSessionUserVisited(user: ApplicantProfile) {
  await touchApplicantWebsiteVisit(user.id, user.email);
}

export async function loginPreview(email: string, password: string): Promise<ApplicantProfile | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const passwordMatches = user.password?.startsWith('$2')
    ? await compare(password, user.password)
    : user.password === password;

  if (!passwordMatches) return null;

  const jar = await cookies();
  jar.set(SESSION_COOKIE, user.id, { httpOnly: true, sameSite: 'lax', path: '/' });
  return user;
}

export async function logoutPreview() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, '', { expires: new Date(0), path: '/' });
}

export async function createApplicantAccount(input: Omit<ApplicantProfile, 'id' | 'joinedAt' | 'lastVisitedAt'>) {
  const applicant = await createApplicant(input);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, applicant.id, { httpOnly: true, sameSite: 'lax', path: '/' });
  return applicant;
}

export async function getApplicantById(id: string) {
  return await getUserById(id);
}

export async function getApplicantsForAdmin() {
  return await getApplicants();
}

export async function getConversationForApplicant(applicantId: string) {
  const messages = await getApplicantConversations(applicantId);
  if (messages.length > 0) return messages;

  const applicant = await getUserById(applicantId);
  if (!applicant) return [];

  return [
    {
      id: `welcome-${applicant.id}`,
      applicantId: applicant.id,
      author: 'paula' as const,
      text: applicant.stage === 'joined'
        ? `Hi ${applicant.firstName}, your FloLabs and Chronos access are active. You are already joined, so this space is now mainly for profile visibility and HR follow-up if needed.`
        : `Hi ${applicant.firstName}, welcome to FloLabs. Your application dashboard is ready and I can help with process questions here.`,
      createdAt: new Date().toISOString(),
    },
  ];
}

export async function sendApplicantMessage(applicantId: string, text: string) {
  await addApplicantMessage(applicantId, 'applicant', text);
  const applicant = await getUserById(applicantId);
  const reply = await buildPaulaReply(text, applicant);
  return await addApplicantMessage(applicantId, 'paula', reply);
}

export async function sendHrMessage(applicantId: string, text: string, author: 'paula' | 'john' | 'oliver' = 'paula') {
  return await addApplicantMessage(applicantId, author, text);
}

async function buildPaulaReply(userMessage: string, applicant: ApplicantProfile | null) {
  const apiKey = getOpenAIApiKey();

  if (!apiKey) {
    return fallbackPaulaReply(userMessage);
  }

  try {
    const openai = new OpenAI({ apiKey });
    const currentStep = applicant ? getStepById(applicant.stage) : null;
    
    const systemPrompt = `You are Paula Ferry, a warm and professional HR coordinator at FloLabs Innovations. You help applicants navigate the internship application process.

Your role:
- Be friendly, encouraging, and professional
- Answer questions about the application process, stages, and timeline
- Guide applicants to check their dashboard for current stage progress
- Never make promises about hiring outcomes
- Keep responses concise (2-3 sentences max)
- If you don't know something, say so and suggest contacting HR

Current applicant context (if available):
${applicant ? `- Applicant name: ${applicant.firstName} ${applicant.lastName}
- Current stage: ${currentStep?.title || 'Unknown'}
- Stage description: ${currentStep?.description || 'N/A'}` : '- No applicant context available'}`;

    const response = await openai.chat.completions.create({
      model: getOpenAIChatModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || fallbackPaulaReply(userMessage);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return fallbackPaulaReply(userMessage);
  }
}

function fallbackPaulaReply(text: string) {
  const normalized = text.toLowerCase();
  if (normalized.includes('paid') || normalized.includes('salary') || normalized.includes('compensation')) {
    return 'Compensation details depend on the specific program path. HR will confirm that in the appropriate stage, but for now you should keep moving through the current application step shown on the right.';
  }
  if (normalized.includes('meeting') || normalized.includes('orientation') || normalized.includes('oliver')) {
    return 'Before the individual Oliver meeting, the process stays asynchronous until the Saturday Orientation step. The dashboard on the right shows which step you are currently in.';
  }
  if (normalized.includes('what next') || normalized.includes('next step') || normalized.includes('timeline')) {
    return 'Your next step is the one shown on the right panel. If you complete it, HR can move you forward from the admin workspace.';
  }
  if (normalized.includes('cv') || normalized.includes('resume') || normalized.includes('file')) {
    return 'You can update your CV file name in your profile settings. Make sure it matches the filename in your application.';
  }
  if (normalized.includes('hello') || normalized.includes('hi') || normalized.includes('hey')) {
    return 'Hello! I\'m Paula, your HR coordinator. How can I help you today? Feel free to ask about your application status or any questions about the process.';
  }
  if (normalized.includes('thank')) {
    return 'You\'re welcome! Is there anything else I can help you with regarding your application?';
  }
  return 'I can answer process questions and I will stay aligned with your current application stage. If your question needs a manual HR decision, John, Oliver, or Paula can pick it up from the lead view.';
}

export async function saveProfileUpdates(applicantId: string, updates: Partial<ApplicantProfile>) {
  return await updateApplicantProfile(applicantId, updates);
}

export async function saveApplicantStage(applicantId: string, stage: ApplicantProfile['stage'], status?: ApplicantProfile['status']) {
  return await updateApplicantStage(applicantId, stage, status);
}

export function getStepById(stepId: string) {
  return ((stepsData as StageStep[]).find((step) => step.id === stepId) ?? (stepsData as StageStep[])[0]);
}

export function getAllSteps() {
  return stepsData as StageStep[];
}

export async function getManagedSteps(options?: { includeInactive?: boolean }) {
  const definitions = await getStageDefinitions(stepsData as StageStep[]);
  const mapped = definitions.map((item) => ({
    id: item.stageId,
    title: item.title,
    shortLabel: item.shortLabel,
    description: item.description,
    applicantAction: item.applicantAction,
    adminAction: item.adminAction,
    active: item.active,
  }));
  return options?.includeInactive ? mapped : mapped.filter((item) => item.active);
}

export async function getManagedStepById(stepId: string) {
  const all = await getManagedSteps({ includeInactive: true });
  return all.find((step) => step.id === stepId) ?? all[0];
}

export async function updateManagedStep(input: {
  stageId: string;
  shortLabel: string;
  title: string;
  description: string;
  applicantAction: string;
}) {
  const all = await getManagedSteps({ includeInactive: true });
  const existing = all.find((item) => item.id === input.stageId);
  if (!existing) throw new Error('Stage not found');
  await saveStageDefinition({
    stageId: input.stageId,
    shortLabel: input.shortLabel,
    title: input.title,
    description: input.description,
    applicantAction: input.applicantAction,
    adminAction: existing.adminAction,
    active: existing.active,
  });
}

export async function deleteManagedStep(stageId: string) {
  const all = await getManagedSteps({ includeInactive: true });
  const existing = all.find((item) => item.id === stageId);
  if (!existing) throw new Error('Stage not found');
  await saveStageDefinition({
    stageId,
    shortLabel: existing.shortLabel,
    title: existing.title,
    description: existing.description,
    applicantAction: existing.applicantAction,
    adminAction: existing.adminAction,
    active: false,
  });
}

export async function activateManagedStep(stageId: string) {
  const baseStep = (stepsData as StageStep[]).find((item) => item.id === stageId);
  if (!baseStep) throw new Error('Stage not found');

  const all = await getManagedSteps({ includeInactive: true });
  const existing = all.find((item) => item.id === stageId);

  await saveStageDefinition({
    stageId,
    shortLabel: existing?.shortLabel ?? baseStep.shortLabel,
    title: existing?.title ?? baseStep.title,
    description: existing?.description ?? baseStep.description,
    applicantAction: existing?.applicantAction ?? baseStep.applicantAction,
    adminAction: existing?.adminAction ?? baseStep.adminAction,
    active: true,
  });

  return await getManagedStepById(stageId);
}

export async function getStageResourcesForHr(stage?: string) {
  return await getStageResources(stage);
}

export async function addStageResource(input: { stage: string; title: string; url: string; applicantPrompt: string }) {
  return await createStageResource(input);
}

export async function removeStageResource(resourceId: string) {
  return await deleteStageResource(resourceId);
}

export async function saveStageResource(input: { id: string; title: string; url: string; applicantPrompt: string }) {
  return await updateStageResource(input);
}

export async function submitStageResponse(input: { resourceId: string; applicantId: string; responseText: string }) {
  await saveStageResourceResponse(input);
}

export async function getStageResourcesForApplicant(stage: string, applicantId: string) {
  const [resources, responses] = await Promise.all([
    getStageResources(stage),
    getStageResponsesForApplicant(applicantId),
  ]);
  const responseByResourceId = latestResponseByResourceId(responses);
  return resources
    .filter((resource) => resource.active)
    .map((resource) => ({
      ...resource,
      latestResponse: responseByResourceId.get(resource.id) ?? null,
    }));
}

export async function getStageStats() {
  const [applicants, transitions] = await Promise.all([getApplicants(), getStageTransitions()]);
  const counts = new Map<string, number>();
  for (const stageId of orderedStageIds) counts.set(stageId, 0);
  for (const applicant of applicants) {
    counts.set(applicant.stage, (counts.get(applicant.stage) ?? 0) + 1);
  }

  const byApplicant = new Map<string, { stage: string; reachedAt: number }[]>();
  for (const transition of transitions) {
    const list = byApplicant.get(transition.applicantId) ?? [];
    list.push({ stage: transition.stage, reachedAt: new Date(transition.reachedAt).getTime() });
    byApplicant.set(transition.applicantId, list);
  }
  for (const list of byApplicant.values()) {
    list.sort((a, b) => a.reachedAt - b.reachedAt);
  }

  const durationBuckets = new Map<string, number[]>();
  for (const stageId of orderedStageIds) durationBuckets.set(stageId, []);
  const now = Date.now();
  for (const [applicantId, list] of byApplicant.entries()) {
    for (let i = 0; i < list.length; i += 1) {
      const current = list[i];
      const next = list[i + 1];
      const end = next ? next.reachedAt : now;
      if (end <= current.reachedAt) continue;
      (durationBuckets.get(current.stage) ?? []).push(end - current.reachedAt);
    }
    if (list.length === 0) continue;
    const seenStages = new Set(list.map((item) => item.stage));
    const applicant = applicants.find((item) => item.id === applicantId);
    if (applicant && !seenStages.has(applicant.stage)) {
      const fallbackStart = new Date(applicant.joinedAt).getTime();
      if (now > fallbackStart) {
        (durationBuckets.get(applicant.stage) ?? []).push(now - fallbackStart);
      }
    }
  }

  return orderedStageIds.map((stageId) => {
    const durations = durationBuckets.get(stageId) ?? [];
    const averageMs = durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : 0;
    return {
      stageId,
      currentCount: counts.get(stageId) ?? 0,
      averageHours: averageMs ? averageMs / (1000 * 60 * 60) : 0,
      samples: durations.length,
    };
  });
}

export async function getResponsesForHr() {
  return await getStageResponsesForHr();
}

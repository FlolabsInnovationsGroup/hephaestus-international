import { cookies } from 'next/headers';
import OpenAI from 'openai';
import { compare } from 'bcryptjs';
import stepsData from '@/app/STEPS.json';
import type { ApplicantProfile, StageStep } from '@/app/application-data';
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
import { orderedStageIds } from '@/lib/stage-definitions';

const SESSION_COOKIE = 'fl_preview_session';

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
  const apiKey = process.env.OPENAI_API_KEY;
  
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
      model: 'gpt-4o-mini',
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
}) {
  const all = await getManagedSteps({ includeInactive: true });
  const existing = all.find((item) => item.id === input.stageId);
  if (!existing) throw new Error('Stage not found');
  await saveStageDefinition({
    stageId: input.stageId,
    shortLabel: input.shortLabel,
    title: input.title,
    description: input.description,
    applicantAction: existing.applicantAction,
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
  const responseByResourceId = new Map(responses.map((item) => [item.resourceId, item]));
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

import { redirect } from 'next/navigation';
import type { ApplicationStage } from '@/app/application-data';
import { Container, Section } from '@/components/layout';
import { resolveNextPipelineStage } from '@/lib/stage-definitions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { ApplicantChat } from '@/components/applicant-chat';
import { ApplicantStageContent } from '@/components/applicant-stage-content';
import { StageCompletionNotice } from '@/components/stage-completion-notice';
import {
  completeApplicantStageReviewBatch,
  getApplicantById,
  getConversationForApplicant,
  getManagedStepById,
  getManagedSteps,
  getSessionUser,
  getStageResourcesForApplicant,
  processLowEffortRollbackIfDue,
} from '@/lib/application-store';

export default async function ApplicationDashboardPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect('/login');
  if (viewer.role !== 'applicant') redirect('/me/hr');

  await processLowEffortRollbackIfDue(viewer.id);
  let applicant = (await getApplicantById(viewer.id)) ?? viewer;

  let stepMeta = await getManagedStepById(applicant.stage);
  for (let i = 0; i < 5 && stepMeta?.passingCondition === 'none'; i++) {
    const result = await completeApplicantStageReviewBatch(viewer.id);
    if (!result.stageChanged) break;
    applicant = (await getApplicantById(viewer.id)) ?? applicant;
    stepMeta = await getManagedStepById(applicant.stage);
  }

  const steps = await getManagedSteps();
  const step = (await getManagedStepById(applicant.stage)) ?? steps[0];
  const currentStepIndex = steps.findIndex((candidate) => candidate.id === applicant.stage);
  const nextFromActiveList =
    currentStepIndex >= 0 && currentStepIndex < steps.length - 1 ? steps[currentStepIndex + 1] : null;
  const nextPipelineId = resolveNextPipelineStage(applicant.stage as ApplicationStage);
  const nextStep =
    nextFromActiveList ?? (nextPipelineId ? await getManagedStepById(nextPipelineId) : null);
  const [conversation, stageResources] = await Promise.all([
    getConversationForApplicant(applicant.id),
    getStageResourcesForApplicant(applicant.stage, applicant.id),
  ]);

  return (
    <Section className="bg-[#f7faff] pt-28 pb-16 min-h-screen">
      <Container>
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00349B]">My application</p>
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Welcome back, {applicant.firstName}</h1>
            <p className="mt-2 text-gray-600">This is your space to follow your progress, know your next move, and chat with us anytime you need help.</p>
          </div>
        </div>

        <StageCompletionNotice />

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-blue-100 bg-white shadow-sm">
            <div className="border-b border-blue-50 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Questions and answers</h2>
              <p className="mt-1 text-sm text-gray-600">Paula is here to help you based on where you are right now.</p>
            </div>
            <ApplicantChat initialMessages={conversation} applicantId={applicant.id} />
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-blue-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00349B]">Your current step</p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">{step.title}</h2>
                </div>
                <span className="rounded-full bg-[#e9f1ff] px-4 py-2 text-sm font-semibold text-[#00349B]">{step.shortLabel}</span>
              </div>
              <p className="mt-4 text-gray-700">Here is where you are right now: {step.description}</p>
              <div className="mt-6 rounded-xl bg-[#f7faff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00349B]">What to do now</p>
                <p className="mt-2 text-sm text-gray-700">{step.applicantAction}</p>
              </div>
            </div>

            <ApplicantStageContent
              resources={stageResources}
              currentStepTitle={step.title}
              currentStageId={applicant.stage}
            />

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-blue-100">
              <h3 className="text-xl font-semibold text-gray-900">What comes next</h3>
              {nextStep ? (
                <div className="mt-4 rounded-xl bg-[#f7faff] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-900">{nextStep.title}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#00349B]">{nextStep.shortLabel}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{nextStep.description}</p>
                  <p className="mt-3 text-sm text-gray-700"><strong>Once you finish this step:</strong> {nextStep.applicantAction}</p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-700">You made it to the final step. We will share any new updates with you right here.</p>
              )}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

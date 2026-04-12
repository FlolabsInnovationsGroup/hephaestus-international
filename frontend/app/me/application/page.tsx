import { redirect } from 'next/navigation';
import { Container, Section } from '@/components/layout';
import { LogoutButton } from '@/components/logout-button';
import { ApplicantChat } from '@/components/applicant-chat';
import { getAllSteps, getConversationForApplicant, getSessionUser, getStepById } from '@/lib/application-store';

export default async function ApplicationDashboardPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect('/login');
  if (viewer.role !== 'applicant') redirect('/me/hr');

  const step = getStepById(viewer.stage);
  const steps = getAllSteps();
  const conversation = await getConversationForApplicant(viewer.id);

  return (
    <Section className="bg-[#f7faff] pt-28 pb-16 min-h-screen">
      <Container>
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00349B]">My application</p>
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Welcome back, {viewer.firstName}</h1>
            <p className="mt-2 text-gray-600">Your FloLabs Innovations application process now lives here instead of email threads.</p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-blue-100 bg-white shadow-sm">
            <div className="border-b border-blue-50 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Questions and answers</h2>
              <p className="mt-1 text-sm text-gray-600">Paula answers based on your current application stage.</p>
            </div>
            <ApplicantChat initialMessages={conversation} />
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-blue-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00349B]">Current step</p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">{step.title}</h2>
                </div>
                <span className="rounded-full bg-[#e9f1ff] px-4 py-2 text-sm font-semibold text-[#00349B]">{step.shortLabel}</span>
              </div>
              <p className="mt-4 text-gray-700">{step.description}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-[#f7faff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00349B]">What you need to do</p>
                  <p className="mt-2 text-sm text-gray-700">{step.applicantAction}</p>
                </div>
                <div className="rounded-xl bg-[#f7faff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00349B]">What the team is doing</p>
                  <p className="mt-2 text-sm text-gray-700">{step.adminAction}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-blue-100">
              <h3 className="text-xl font-semibold text-gray-900">Timeline</h3>
              <div className="mt-5 space-y-4">
                {steps.map((candidate, index) => {
                  const isCurrent = candidate.id === viewer.stage;
                  const isCompleted = steps.findIndex((s) => s.id === viewer.stage) > index;
                  return (
                    <div key={candidate.id} className="flex gap-3">
                      <div className={`mt-1 h-3.5 w-3.5 rounded-full ${isCurrent ? 'bg-[#00349B]' : isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div>
                        <p className={`font-semibold ${isCurrent ? 'text-[#00349B]' : 'text-gray-900'}`}>{candidate.title}</p>
                        <p className="text-sm text-gray-600">{candidate.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-blue-100">
              <h3 className="text-xl font-semibold text-gray-900">Profile data shared with Chronos</h3>
              <div className="mt-4 grid gap-3 text-sm text-gray-700 md:grid-cols-2">
                <p><strong>Name:</strong> {viewer.firstName} {viewer.lastName}</p>
                <p><strong>Email:</strong> {viewer.email}</p>
                <p><strong>Phone:</strong> {viewer.phoneNumber}</p>
                <p><strong>Role applied for:</strong> {viewer.roleAppliedFor}</p>
                <p><strong>Location:</strong> {viewer.city}, {viewer.country}</p>
                <p><strong>LinkedIn:</strong> {viewer.linkedinUrl}</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

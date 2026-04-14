import { redirect } from 'next/navigation';
import { Section } from '@/components/layout';
import { HrStagesWorkspace } from '@/components/hr-stages-workspace';
import { getManagedSteps, getSessionUser, getStageResourcesForHr, getStageStats } from '@/lib/application-store';

export default async function HrStagesPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect('/login');
  if (!viewer.hrBinaryRole) redirect('/me/application');

  const [allSteps, resources, stats] = await Promise.all([
    getManagedSteps({ includeInactive: true }),
    getStageResourcesForHr(),
    getStageStats(),
  ]);
  const steps = allSteps.filter((item) => item.active);

  return (
    <Section className="bg-[#f7faff] pt-28 pb-16 min-h-screen">
      <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8">
        <HrStagesWorkspace steps={steps} allSteps={allSteps} initialResources={resources} stats={stats} />
      </div>
    </Section>
  );
}

import { redirect } from 'next/navigation';
import { Section } from '@/components/layout';
import { HrResponsesTable } from '@/components/hr-responses-table';
import { getResponsesForHr, getSessionUser } from '@/lib/application-store';

export default async function HrResponsesPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect('/login');
  if (!viewer.hrBinaryRole) redirect('/me/application');

  const rows = await getResponsesForHr();

  return (
    <Section className="bg-[#f7faff] pt-28 pb-16 min-h-screen">
      <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8">
        <HrResponsesTable rows={rows} />
      </div>
    </Section>
  );
}

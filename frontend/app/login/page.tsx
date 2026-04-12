import { redirect } from 'next/navigation';
import { Container, Section } from '@/components/layout';
import { LoginForm } from '@/components/login-form';
import { getSessionUser } from '@/lib/application-store';

export default async function LoginPage() {
  const viewer = await getSessionUser();
  if (viewer) redirect('/me/application');

  return (
    <Section className="bg-gradient-to-b from-[#eef5ff] to-white pt-28 pb-20 min-h-screen">
      <Container>
        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#00349B]">FloLabs innovations profile</p>
            <h1 className="mb-5 text-4xl font-bold text-gray-900 md:text-5xl">Centralize the whole applicant journey in one place.</h1>
            <p className="text-lg text-gray-600">This preview replaces the HubSpot form entrypoint with a login-aware application platform, an applicant dashboard, and an HR workspace.</p>
          </div>
          <LoginForm />
        </div>
      </Container>
    </Section>
  );
}

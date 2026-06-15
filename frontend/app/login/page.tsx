import { redirect } from 'next/navigation';
import { Container, Section } from '@/components/layout';
import { LoginForm } from '@/components/login-form';
import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { ResetPasswordForm } from '@/components/reset-password-form';
import { getSessionUser } from '@/lib/application-store';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ forgot?: string; reset?: string }> }) {
  const viewer = await getSessionUser();
  if (viewer) redirect('/me/application');

  const params = await searchParams;
  const resetToken = params.reset ?? '';
  const forgotMode = params.forgot === '1';

  return (
    <Section className="bg-gradient-to-b from-[#eef5ff] to-white pt-28 pb-20 min-h-screen">
      <Container>
        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#00349B]">FloLabs innovations profile</p>
            <h1 className="mb-5 text-4xl font-bold text-gray-900 md:text-5xl">Centralize your whole journey in one place.</h1>
            <p className="text-lg text-gray-600">This is your dashboard and the main place to manage your profile information.</p>
          </div>
          {resetToken ? <ResetPasswordForm token={resetToken} /> : forgotMode ? <ForgotPasswordForm /> : <LoginForm />}
        </div>
      </Container>
    </Section>
  );
}

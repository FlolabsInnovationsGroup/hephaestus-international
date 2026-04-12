import { redirect } from 'next/navigation';
import { Container, Section } from '@/components/layout';
import { ProfileEditor } from '@/components/profile-editor';
import { getSessionUser } from '@/lib/application-store';

export default async function ProfilePage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect('/login');

  return (
    <Section className="bg-white pt-28 pb-16 min-h-screen">
      <Container>
        <div className="mx-auto max-w-4xl rounded-2xl border border-blue-100 bg-[#f7faff] p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00349B]">Profile</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Your information</h1>
          <p className="mt-3 text-gray-600">This page is where users can update profile information later, but not remove it.</p>
          <ProfileEditor viewer={viewer} />
        </div>
      </Container>
    </Section>
  );
}

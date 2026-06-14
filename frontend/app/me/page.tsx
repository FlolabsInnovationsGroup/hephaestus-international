import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/application-store';

export default async function MeIndexPage() {
  const viewer = await getSessionUser();
  if (!viewer) {
    redirect('/login');
  }

  if (viewer.hrBinaryRole) {
    redirect('/me/hr');
  }

  redirect('/me/application');
}

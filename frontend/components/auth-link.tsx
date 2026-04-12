'use client';

import Link from 'next/link';
import Image from 'next/image';

type Viewer = {
  firstName: string;
  profilePictureUrl?: string;
};

export function AuthLink({ viewer }: { viewer: Viewer | null }) {
  if (viewer) {
    return (
      <Link href="/me/application" className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-white hover:text-blue-300 transition-colors">
        {viewer.profilePictureUrl ? (
          <Image src={viewer.profilePictureUrl} alt={viewer.firstName} width={28} height={28} className="rounded-full object-cover" />
        ) : (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
            {viewer.firstName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span>Profile</span>
      </Link>
    );
  }

  return (
    <Link href="/login" className="hidden md:inline-flex items-center text-sm font-medium text-white hover:text-blue-300 transition-colors">
      Log in
    </Link>
  );
}

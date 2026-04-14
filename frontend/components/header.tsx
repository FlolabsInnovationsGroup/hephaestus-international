'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Container } from './layout'
import { useState } from 'react'
import { useBrand } from './brand-provider'
import { ProfileMenu } from './profile-menu'

const navigation = [
  { name: 'Blogs', href: '/blogs' },
  { name: 'About us', href: '/about' },
  { name: 'Projects', href: '/projects' },
  { name: 'Internships', href: '/internships' },
]

export function Header({ viewer }: { viewer: { firstName: string; email?: string; role?: string; hrBinaryRole?: boolean; profilePictureUrl?: string } | null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { brand } = useBrand()

  return (
    <header className="fixed top-0 z-50 w-full bg-black/80 backdrop-blur-sm border-b border-white/10">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/flo-labs-logo-new.svg" 
              alt={brand.tagline} 
              width={50}
              height={50}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-white hover:text-blue-400 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <ProfileMenu viewer={viewer} />
            <button
              type="button"
              className="md:hidden p-2 text-white hover:text-blue-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} 
                />
              </svg>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10">
            <nav className="py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href={viewer ? '/me/application' : '/login'}
                className="block px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                {viewer ? 'Profile' : 'Log in'}
              </Link>
              {viewer?.hrBinaryRole && (
                <Link
                  href="/me/hr/stages"
                  className="block px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Stages
                </Link>
              )}
              {viewer?.hrBinaryRole && (
                <Link
                  href="/me/hr/responses"
                  className="block px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Responses
                </Link>
              )}
            </nav>
          </div>
        )}
      </Container>
    </header>
  )
}

import { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section } from '@/components/layout'

export const metadata: Metadata = {
  title: '404 - Page Not Found | Hephaestus International',
  description: 'The page you are looking for does not exist.',
}

export default function NotFound() {
  return (
    <Section className="bg-white pt-32 min-h-screen flex items-center">
      <Container>
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-[#00349B] mb-6">
            404
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Page Not Found
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-3 bg-[#00349B] text-white font-semibold rounded-lg hover:bg-[#002775] transition-colors"
            >
              Go Home
            </Link>
            <Link
              href="/internships"
              className="px-8 py-3 border-2 border-[#00349B] text-[#00349B] font-semibold rounded-lg hover:bg-[#00349B] hover:text-white transition-colors"
            >
              View Internships
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  )
}

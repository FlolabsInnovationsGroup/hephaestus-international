'use client'

import { useEffect } from 'react'
import { Container, Section } from '@/components/layout'

interface ErrorProps {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Error:', error)
  }, [error])

  return (
    <Section className="bg-white pt-32">
      <Container>
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Something went wrong!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            We apologize for the inconvenience. Please try again.
          </p>
          <button
            onClick={reset}
            className="px-8 py-3 bg-[#00349B] text-white font-semibold rounded-lg hover:bg-[#002775] transition-colors"
          >
            Try again
          </button>
        </div>
      </Container>
    </Section>
  )
}

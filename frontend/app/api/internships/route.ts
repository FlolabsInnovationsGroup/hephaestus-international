import { NextResponse } from 'next/server'
import { getInternships } from '@/lib/strapi'

export async function GET() {
  try {
    const internships = await getInternships({ status: 'Open' })
    return NextResponse.json(internships)
  } catch (error) {
    console.error('Error fetching internships:', error)
    return NextResponse.json(
      { error: 'Failed to fetch internships' },
      { status: 500 }
    )
  }
}

export const revalidate = 60 // Revalidate every 60 seconds

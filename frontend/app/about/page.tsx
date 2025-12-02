import { Metadata } from 'next'
import Image from 'next/image'
import { Container, Section } from '@/components/layout'
import { getInterns, getStrapiImageUrl, getSectionContent } from '@/lib/strapi'
import { getServerBrand, transformBrandContent } from '@/lib/branding'

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getServerBrand()
  return {
    title: `About Us | ${brand.tagline}`,
    description: `Learn about ${brand.tagline} - our mission, objectives, and team dedicated to advancing AI and robotics innovation.`,
  }
}

// Revalidate every 60 seconds
export const revalidate = 60

export default async function AboutPage() {
  const interns = await getInterns(true) // Get only active interns
  const brand = await getServerBrand()
  
  // Fetch About page content from Strapi
  const aboutTitle = await getSectionContent('about-title')
  const aboutSubtitle = await getSectionContent('about-subtitle')
  const aboutDescription = await getSectionContent('about-description')
  const objectivesTitle = await getSectionContent('about-objectives-title')
  const objectivesContent = await getSectionContent('about-objectives-content')
  const missionTitle = await getSectionContent('about-mission-title')
  const missionContent = await getSectionContent('about-mission-content')
  
  // Transform content for brand
  const displayTitle = aboutTitle?.title 
    ? transformBrandContent(aboutTitle.title, brand) 
    : brand.fullName
  
  return (
    <>
      {/* Hero Section - Logo on white background (matching WordPress) */}
      <Section className="bg-white py-12">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <Image 
              src="https://res.cloudinary.com/dgb6qsvev/image/upload/v1763058482/Frame_4_3f70d2d7b7.jpg" 
              alt={`${brand.fullName} Logo`}
              width={400}
              height={150}
              className="mx-auto"
              priority
            />
          </div>
        </Container>
      </Section>

      {/* Title Box (white with blue gradient border - matching WordPress) */}
      <Section className="bg-white py-12">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="gradient-border-box text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#00349B]">
                {displayTitle}
              </h1>
              <p className="text-xl tracking-wider mb-4 text-gray-700">
                {aboutSubtitle?.title || 'EXECUTIVE MANAGEMENT PROGRAM'}
              </p>
              <div 
                className="text-lg text-gray-700"
                dangerouslySetInnerHTML={{ 
                  __html: aboutDescription?.content || 'Provides students a <strong>remote</strong>, <strong>unique</strong>, <strong>powerful</strong>, and <strong>immersive</strong> hands on educational experience.' 
                }}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Objectives & Mission Section - Blue Background with Gradient Border Cards */}
      <Section className="flo-blue-section py-16">
        <Container>
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Objectives Card with Gradient Border */}
            <div className="gradient-border-card">
              <h2 className="text-3xl font-bold mb-6 text-[#00349B] text-center border-b-4 border-[#00349B] pb-4">
                {objectivesTitle?.title || 'Objectives'}
              </h2>
              <div 
                className="space-y-4 text-gray-800 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: objectivesContent?.content || '<p><strong>Experiential Learning:</strong> Unique and immersive educational training with hands-on, real world experience.</p><p>Provide practical experience working on innovative marketable projects.</p>' 
                }}
              />
            </div>

            {/* Mission Card with Gradient Border */}
            <div className="gradient-border-card">
              <h2 className="text-3xl font-bold mb-6 text-[#00349B] text-center border-b-4 border-[#00349B] pb-4">
                {missionTitle?.title || 'Mission'}
              </h2>
              <div 
                className="space-y-4 text-gray-800 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: missionContent?.content || '<p>Inspire and empower individuals through transformative educational experiences that foster global perspectives, innovative thinking, and practical skills.</p><p>We aim to cultivate a culture of curiosity and creativity, create jobs of the future, and build innovative solutions for a rapidly changing world.</p>' 
                }}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Team Section - White Background */}
      <Section className="bg-white py-16">
        <Container>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Our Team
              </h2>
              <p className="text-[#00349B] text-xl mb-4">
                Meet the <strong>Flo Team</strong>
              </p>
              <p className="text-gray-700 text-lg leading-relaxed max-w-3xl mx-auto">
                Our team consists of passionate innovators, researchers, and industry experts dedicated 
                to advancing AI and robotics technologies. Together, we&apos;re building the future through 
                cutting-edge research, experiential learning, and collaborative innovation.
              </p>
            </div>

            {/* Interns Grid */}
            {interns.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-12">
                {interns.map((intern) => (
                  <div key={intern.id} className="text-center group">
                    {/* Intern Photo */}
                    <div className="mb-4 relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {intern.photo?.url ? (
                        <Image
                          src={getStrapiImageUrl(intern.photo.url) || ''}
                          alt={intern.photo.alternativeText || intern.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#00349B]/10">
                          <span className="text-4xl text-[#00349B] font-bold">
                            {intern.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Intern Info */}
                    <h3 className="font-bold text-gray-900 mb-1">
                      {intern.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {intern.role}
                    </p>
                    
                    {/* LinkedIn Link */}
                    {intern.linkedIn && (
                      <a
                        href={intern.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${intern.name}'s LinkedIn profile`}
                        className="inline-flex items-center text-[#00349B] hover:text-[#0056d6] transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {interns.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No team members to display at this time.</p>
              </div>
            )}
          </div>
        </Container>
      </Section>
    </>
  )
}

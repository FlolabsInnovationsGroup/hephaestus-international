import Image from 'next/image'
import { Container } from './layout'
import { getSectionContent } from '@/lib/strapi'

export async function Hero() {
  const heroTitle = await getSectionContent('hero-title')
  const heroSubtitle = await getSectionContent('hero-subtitle')
  return (
    <section className="relative overflow-hidden min-h-screen flex items-center justify-center">
      {/* Blue hero section with visible world map - matching WordPress EXACTLY */}
      <div className="absolute inset-0">
        {/* Radial gradient background matching WordPress */}
        <div className="absolute inset-0 hero-gradient-bg" />
        {/* World map background - VISIBLE like WordPress */}
        <Image 
          src="https://res.cloudinary.com/dgb6qsvev/image/upload/v1763058470/cropped_Frame_3_5_6196a31cc0.jpg" 
          alt="Hephaestus Labs Institute Background"
          fill
          className="object-cover opacity-60"
          priority
        />
        {/* Subtle overlay to blend */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#0063b5]/10" />
      </div>
      
      <Container className="relative z-10">
        <div className="mx-auto max-w-5xl text-center">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-8 text-white">
              {heroTitle?.content || 'Hephaestus Labs Institute of Experiential Learning Center of Excellence'}
            </h1>
            
            <p className="text-xl md:text-2xl text-white/95 mb-16">
              {heroSubtitle?.content || 'Advance your career, Be at the center of the Future'}
            </p>
            
            {/* Scroll indicator */}
            <div className="mt-20">
              <div className="inline-block text-white/70">
                <svg className="w-8 h-8 mx-auto animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

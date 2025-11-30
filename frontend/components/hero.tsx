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
        <div className="mx-auto max-w-5xl text-center px-4">
          <div className="space-y-8">
            {/* Main title with elegant italic styling */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold italic text-white leading-tight tracking-wide drop-shadow-lg">
              {heroTitle?.content || 'Hephaestus Labs Institute of Experiential Learning Center of Excellence'}
            </h1>
            
            {/* Subtitle with lighter weight */}
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-light tracking-wide max-w-3xl mx-auto">
              {heroSubtitle?.content || 'Advance your career, Be at the center of the Future'}
            </p>
            
            {/* Scroll indicator */}
            <div className="pt-12">
              <div className="inline-block text-white/60 hover:text-white/90 transition-colors cursor-pointer">
                <svg className="w-8 h-8 mx-auto animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

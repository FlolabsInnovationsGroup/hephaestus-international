import Image from 'next/image'
import { Container } from './layout'
import { getSectionContent } from '@/lib/strapi'

export async function Hero() {
  const heroTitle = await getSectionContent('hero-title')
  const heroSubtitle = await getSectionContent('hero-subtitle')
  return (
    <section className="relative overflow-hidden min-h-screen flex items-center justify-center">
      {/* Blue hero section with visible world map */}
      <div className="absolute inset-0">
        {/* Dark blue gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#001a3a]/80 via-[#002855]/70 to-[#003366]/80 z-10" />
        {/* World map background */}
        <Image 
          src="https://res.cloudinary.com/dgb6qsvev/image/upload/v1763058470/cropped_Frame_3_5_6196a31cc0.jpg" 
          alt="Hephaestus Labs Institute Background"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      <Container className="relative z-20">
        <div className="mx-auto max-w-5xl text-center px-6">
          {/* Frosted glass background for better text readability */}
          <div className="bg-black/30 backdrop-blur-sm px-8 py-10 md:px-12 md:py-14">
            <div className="space-y-6">
              {/* Main title - clean, professional italic */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-medium italic text-white leading-[1.2] tracking-normal">
                {heroTitle?.content || 'Hephaestus Labs Institute of Experiential Learning Center of Excellence'}
              </h1>
              
              {/* Subtitle - simple and clean */}
              <p className="text-base sm:text-lg md:text-xl text-white/90 font-normal tracking-wide max-w-2xl mx-auto pt-2">
                {heroSubtitle?.content || 'Advance your career. Be at the center of the future.'}
              </p>
            </div>
          </div>
          
          {/* Scroll indicator - outside the glass box */}
          <div className="pt-12">
            <div className="inline-block text-white/50">
              <svg className="w-6 h-6 mx-auto animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

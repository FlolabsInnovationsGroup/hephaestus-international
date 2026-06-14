import Image from 'next/image'
import { Container, Section } from './layout'
import { getBenefits, getSectionContent } from '@/lib/strapi'

export async function Benefits() {
  const benefits = await getBenefits()
  const sectionContent = await getSectionContent('benefits-intro')
  return (
    <Section className="flo-blue-section py-16">
      <Container>
        {/* Title with white borders - matching WordPress */}
        <div className="text-center mb-12">
          <div className="border-t-4 border-white mb-6"></div>
          <h3 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            {sectionContent?.content || 'Our Benefits'}
          </h3>
          <div className="border-t-4 border-white mb-6"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit) => (
            <div key={benefit.id} className="flo-card text-center">
              {/* Benefit icon at top */}
              {benefit.icon && (
                <div className="mb-4 -mx-6 -mt-6">
                  <Image
                    src={benefit.icon.startsWith('http') ? benefit.icon : `/${benefit.icon}`}
                    alt={benefit.title}
                    width={266}
                    height={97}
                    className="w-full h-auto"
                  />
                </div>
              )}
              
              <h4 className="text-xl font-bold mb-3 text-[#00349B]">
                {benefit.title}
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

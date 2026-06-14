import Image from 'next/image'
import { Container, Section } from './layout'
import { getVerticals, getSectionContent } from '@/lib/strapi'

export async function Verticals() {
  const verticals = await getVerticals()
  const sectionContent = await getSectionContent('verticals-intro')
  return (
    <Section className="flo-blue-section py-16">
      <Container>
        {/* Title with white borders - matching WordPress */}
        <div className="text-center mb-12">
          <div className="border-t-4 border-white mb-6"></div>
          <h3 className="text-3xl md:text-4xl font-bold mb-6 text-white">Our Verticals</h3>
          <div className="border-t-4 border-white mb-6"></div>
          <p className="text-white text-lg">
            {sectionContent?.content || 'We focus on four main verticals in our expertise.'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {verticals.map((vertical) => (
            <div key={vertical.id} className="flo-card group text-center">
              {/* Vertical image at top */}
              {vertical.icon && (
                <div className="mb-4 -mx-6 -mt-6">
                  <Image
                    src={vertical.icon.startsWith('http') ? vertical.icon : `/${vertical.icon}`}
                    alt={vertical.title}
                    width={266}
                    height={97}
                    className="w-full h-auto"
                  />
                </div>
              )}
              
              <h4 className="text-xl font-bold mb-3 text-[#00349B]">
                {vertical.title}
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                {vertical.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

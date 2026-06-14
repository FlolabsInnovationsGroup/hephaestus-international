import Image from 'next/image'
import { Container, Section } from './layout'
import { getMethodologyItems, getSectionContent } from '@/lib/strapi'

export async function Methodology() {
  const methodologyItems = await getMethodologyItems()
  const titleContent = await getSectionContent('methodology-title')
  const subtitleContent = await getSectionContent('methodology-subtitle')
  return (
    <Section className="flo-blue-section py-16">
      <Container>
        {/* Banner image at top */}
        <div className="mb-12 -mx-4 md:mx-0">
          <Image
            src="https://res.cloudinary.com/dgb6qsvev/image/upload/v1763058517/image_52_2_f28051fbde.jpg"
            alt="Our methodology - collaborative learning"
            width={1024}
            height={266}
            className="w-full h-auto rounded-lg"
          />
        </div>
        
        {/* Title with white borders */}
        <div className="text-center mb-12">
          <div className="border-t-4 border-white mb-6"></div>
          <h3 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            {titleContent?.content || 'HELPING PEOPLE LEARN BETTER.'}
          </h3>
          <div className="border-t-4 border-white mb-6"></div>
          <p className="text-white text-lg">
            {subtitleContent?.content || 'Our methodology is to foster collaboration and creativity.'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {methodologyItems.map((item) => (
            <div key={item.id} className="flo-card text-center">
              <h4 className="text-lg font-bold mb-3 text-[#00349B]">
                {item.title}
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

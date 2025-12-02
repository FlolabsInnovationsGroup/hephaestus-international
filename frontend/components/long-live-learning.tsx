import { Container, Section } from './layout'
import { getSectionContent } from '@/lib/strapi'
import { getServerBrand, transformBrandContent } from '@/lib/branding'

export async function LongLiveLearning() {
  const title = await getSectionContent('long-live-learning-title')
  const content = await getSectionContent('long-live-learning-content')
  const brand = await getServerBrand()
  
  const defaultContent = `<p>Learn about the latest trends in technology. We are learning about the future of <strong>AI, robotics, education,</strong> and so much more. Every day is a great day to learn and we want to continuously learn and we expand.</p><p><strong>${brand.name}</strong> wants to prepare you for your own journey in your career. We help you learn the way you want to learn so you can achieve your goals of getting to the next level.</p>`
  
  const displayContent = content?.content 
    ? transformBrandContent(content.content, brand)
    : defaultContent
  
  return (
    <Section className="bg-white">
      <Container>
        <div className="max-w-6xl mx-auto">
          {/* Side-by-side layout matching WordPress: Blue box LEFT, text RIGHT */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
            {/* Blue bordered box on the left (40%) */}
            <div className="md:col-span-2">
              <div className="gradient-border-box text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-[#00349B] leading-tight">
                  {title?.title ? (
                    <span dangerouslySetInnerHTML={{ __html: title.title }} />
                  ) : (
                    <>
                      Long Live<br />
                      Learning
                    </>
                  )}
                </h2>
              </div>
            </div>
            
            {/* Content text on the right (60%) */}
            <div className="md:col-span-3">
              <div className="border-t-4 border-[#0073e6] mb-4"></div>
              <div 
                className="text-gray-700 text-lg leading-relaxed prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: displayContent }}
              />
              <div className="border-t-4 border-[#0073e6] mt-4"></div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}

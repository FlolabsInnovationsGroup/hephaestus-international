import { Container, Section } from './layout'
import { getSectionContent } from '@/lib/strapi'

export async function GetRecruited() {
  const title = await getSectionContent('get-recruited-title')
  const content = await getSectionContent('get-recruited-content')
  
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
                      Get<br />
                      Recruited<br />
                      Today
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
                dangerouslySetInnerHTML={{ 
                  __html: content?.content || '<p>Join the Hephaestus family and kickstart your career in AI and robotic technologies. We are on a mission to bring the world together with the latest trends in AI and robotics. We are looking for individuals who are hungry for more growth in their experience and knowledge. Gain the experience you desire by applying with us on the programs page.</p>' 
                }}
              />
              <div className="border-t-4 border-[#0073e6] mt-4"></div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}

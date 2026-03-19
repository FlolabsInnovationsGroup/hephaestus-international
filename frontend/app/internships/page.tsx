'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Container, Section } from '@/components/layout'

interface Internship {
  id: number
  title: string
  slug: string
  status: string
}

const statusPriority: Record<string, number> = {
  Open: 0,
  'Closing Soon': 1,
  Pending: 2,
  Filled: 3,
}

function sortInternships(list: Internship[]) {
  return [...list].sort((a, b) => {
    const aPriority = statusPriority[a.status] ?? 99
    const bPriority = statusPriority[b.status] ?? 99

    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }

    return a.title.localeCompare(b.title)
  })
}

export default function InternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([])
  const [filteredInternships, setFilteredInternships] = useState<Internship[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInternships() {
      try {
        const response = await fetch('/api/internships')
        const data = await response.json()
        const sorted = sortInternships(data)
        setInternships(sorted)
        setFilteredInternships(sorted)
      } catch (error) {
        console.error('Error fetching internships:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInternships()
  }, [])

  useEffect(() => {
    const filtered = internships.filter((internship) =>
      internship.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    setFilteredInternships(sortInternships(filtered))
  }, [searchTerm, internships])

  return (
    <main className="min-h-screen bg-white pt-20">
      <Section className="py-16">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#00349B]">
              Internship Positions
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Apply to your passion
            </p>

            <div className="max-w-md mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search internships..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:border-[#00349B] focus:ring-2 focus:ring-[#00349B]/20 outline-none transition-all"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#00349B]"></div>
              <p className="mt-4 text-gray-600">Loading internships...</p>
            </div>
          ) : (
            <>
              {filteredInternships.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-600">
                    {searchTerm
                      ? `No internships found matching "${searchTerm}"`
                      : 'No open internships at the moment. Check back soon!'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="max-w-3xl mx-auto mb-6">
                    <p className="text-center text-gray-600">
                      Showing <strong>{filteredInternships.length}</strong>{' '}
                      {filteredInternships.length === 1 ? 'position' : 'positions'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {filteredInternships.map((internship) => {
                      const getStatusClass = () => {
                        if (internship.status === 'Open') return 'bg-green-100 text-green-800'
                        if (internship.status === 'Filled') return 'bg-gray-100 text-gray-800'
                        return 'bg-yellow-100 text-yellow-800'
                      }

                      return (
                        <Link
                          key={internship.id}
                          href={`/internships/${internship.slug}`}
                          className="group flex flex-col p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-[#00349B] hover:shadow-lg transition-all duration-200"
                        >
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#00349B] transition-colors mb-3">
                              {internship.title}
                            </h3>
                            {internship.status && (
                              <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass()}`}>
                                {internship.status}
                              </span>
                            )}
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <span className="text-[#00349B] font-medium flex items-center gap-2">
                              More Details
                              <svg
                                className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </>
              )}
            </>
          )}

          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-6 text-[#00349B]">About The Internship</h2>

            <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
              <p>
                The FloLabs Innovations Group Internship will have you buzzing for a few key reasons and they all hinge on the exciting
                intersection of AI, robotics, entrepreneurship and various technical domains.
              </p>

              <h3 className="text-2xl font-bold text-gray-900">Flexible. Dynamic. Inspiring.</h3>
              <p>
                FloLabs Innovations Group internships offer flexible schedules, live and recorded
                sessions, and hands-on experience in cutting-edge AI and technology projects.
              </p>
              <p>
                Transform your passion into innovation.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mt-8">Remote Internship Positions</h2>
              <p className="mt-4"></p>

              <h2 className="text-3xl font-bold text-gray-900 mt-8">What We Do:</h2>

              <div className="space-y-6 mt-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Build The Future of Travel with AI</h2>
                  <p>
                    You will be chomping at the bit to contribute to an{' '}
                    <a
                      href="https://www.flomadtravel.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00349B] hover:underline"
                    >
                      AI-powered travel agent
                    </a>{' '}
                    that personalizes experiences with cutting-edge NLP (Natural Language Processing) techniques. Imagine crafting an app that
                    understands complex travel requests and leverages real-time data to create dynamic
                    itineraries. that's disruptive!
                  </p>
                  <p className="mt-3">
                    The chance to integrate multimodal transportation with Generative AI opens a treasure trove of possibilities. We&apos;re talking about seamlessly
                    combining flights, trains, ferries, bus, and even carpooling into optimized travel
                    packages. That&apos;s innovation at its finest.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Pushing Boundaries of AI Research</h2>
                  <p>
                    The opportunity to delve into AGI (Artificial General Intelligence) research is a dream come true. It&apos;s the holy
                    grail of AI, and being involved will be an incredible learning experience. We are eager to
                    stretch our knowledge and understanding of AI&apos;s theoretical underpinnings.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Revolutionize Industries With AI</h2>
                  <p>
                    The prospect of working on{' '}
                    <a
                      href="https://flomad.international/projects/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00349B] hover:underline"
                    >
                      projects that leverage AI
                    </a>{' '}
                    for personalized learning and improved educational outcomes is inspiring.
                    Imagine AI tutors that adapt to individual needs and learning styles. that&apos;s a
                    game-changer.
                  </p>
                  <p className="mt-3">
                    Contributing to advancements in healthcare through AI-powered diagnostics, robotic surgery, and neurotechnology is enormously
                    exciting. The potential to improve patient outcomes and streamline processes is a
                    powerful motivator.
                  </p>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mt-8">The Bottom Line:</h2>
              <p className="mt-4">
                Learning from the brightest minds in AI and robotics through the Masterclass program is a golden opportunity. Gaining in-depth knowledge of the latest
                advancements and real-world applications of AI will be invaluable.
              </p>
              <p className="mt-3">
                This program will equip you with the skills to navigate the evolving landscape
                of AI and robotics, preparing you for a future shaped by these technologies.
                Collaborative Innovation with a Gamified Twist.
              </p>
              <p className="mt-3">
                Working in a collaborative environment that fosters creativity and innovation
                through AI-powered tools and gamification techniques is invigorating. We are creating a
                dynamic space where ideas are valued and progress is celebrated.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  )
}
// 'use client'

// import { useState, useEffect } from 'react'
// import Link from 'next/link'
// import { Container, Section } from '@/components/layout'

// interface Internship {
//   id: number
//   title: string
//   slug: string
//   status: string
// }

// export default function InternshipsPage() {
//   const [internships, setInternships] = useState<Internship[]>([])
//   const [filteredInternships, setFilteredInternships] = useState<Internship[]>([])
//   const [searchTerm, setSearchTerm] = useState('')
//   const [loading, setLoading] = useState(true)
  
//   useEffect(() => {
//     async function fetchInternships() {
//       try {
//         const response = await fetch('/api/internships')
//         const data = await response.json()
//         setInternships(data)
//         setFilteredInternships(data)
//       } catch (error) {
//         console.error('Error fetching internships:', error)
//       } finally {
//         setLoading(false)
//       }
//     }
    
//     fetchInternships()
//   }, [])
  
//   useEffect(() => {
//     const filtered = internships.filter(internship =>
//       internship.title.toLowerCase().includes(searchTerm.toLowerCase())
//     )
//     setFilteredInternships(filtered)
//   }, [searchTerm, internships])

//   return (
//     <main className="min-h-screen bg-white pt-20">
//       <Section className="py-16">
//         <Container>
//           <div className="max-w-3xl mx-auto text-center mb-8">
//             <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#00349B]">
//               Internship Positions
//             </h1>
//             <p className="text-xl text-gray-600 mb-8">
//               Apply to your passion
//             </p>
            
//             {/* Search Bar */}
//             <div className="max-w-md mx-auto">
//               <div className="relative">
//                 <input
//                   type="text"
//                   placeholder="Search internships..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:border-[#00349B] focus:ring-2 focus:ring-[#00349B]/20 outline-none transition-all"
//                 />
//                 <svg
//                   className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//                   />
//                 </svg>
//               </div>
//             </div>
//           </div>

//           {loading ? (
//             <div className="text-center py-12">
//               <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#00349B]"></div>
//               <p className="mt-4 text-gray-600">Loading internships...</p>
//             </div>
//           ) : (
//             <>
//               {filteredInternships.length === 0 ? (
//                 <div className="text-center py-12">
//                   <p className="text-xl text-gray-600">
//                     {searchTerm ? `No internships found matching "${searchTerm}"` : 'No open internships at the moment. Check back soon!'}
//                   </p>
//                 </div>
//               ) : (
//                 <>
//                   {/* Internship Count */}
//                   <div className="max-w-3xl mx-auto mb-6">
//                     <p className="text-center text-gray-600">
//                       Showing <strong>{filteredInternships.length}</strong> {filteredInternships.length === 1 ? 'position' : 'positions'}
//                     </p>
//                   </div>
                  
//                   {/* Grid layout matching WordPress */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
//                     {filteredInternships.map((internship) => {
//                       const getStatusClass = () => {
//                         if (internship.status === 'Open') return 'bg-green-100 text-green-800'
//                         if (internship.status === 'Filled') return 'bg-gray-100 text-gray-800'
//                         return 'bg-yellow-100 text-yellow-800'
//                       }
                      
//                       return (
//                         <Link
//                           key={internship.id}
//                           href={`/internships/${internship.slug}`}
//                           className="group flex flex-col p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-[#00349B] hover:shadow-lg transition-all duration-200"
//                         >
//                           <div className="flex-1">
//                             <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#00349B] transition-colors mb-3">
//                               {internship.title}
//                             </h3>
//                             {internship.status && (
//                               <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass()}`}>
//                                 {internship.status}
//                               </span>
//                             )}
//                           </div>
//                           <div className="mt-4 pt-4 border-t border-gray-200">
//                             <span className="text-[#00349B] font-medium flex items-center gap-2">
//                               More Details 
//                               <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                               </svg>
//                             </span>
//                           </div>
//                         </Link>
//                       )
//                     })}
//                   </div>
//                 </>
//               )}
//             </>
//           )}

//           {/* About The Internship Section */}
//           <div className="max-w-4xl mx-auto mb-16">
//             <h2 className="text-3xl font-bold mb-6 text-[#00349B]">About The Internship</h2>
                
//                 <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
//                   <p>
//                     The FloLabs Innovations Group Internship will have you buzzing for a few key reasons and they all hinge on the exciting
//                     intersection of AI, robotics, entrepreneurship and various technical domains.
//                   </p>
                  
//                   <h3 className="text-2xl font-bold text-gray-900">Flexible. Dynamic. Inspiring.</h3>
//                   <p>
//                     FloLabs Innovations Group internships offer flexible schedules, live and recorded
//                     sessions, and hands-on experience in cutting-edge AI and technology projects.
//                   </p>
//                   <p>
//                     Transform your passion into innovation.
//                   </p>

//                   <h2 className="text-3xl font-bold text-gray-900 mt-8">Remote Internship Positions</h2>
//                   <p className="mt-4">
//                     {/* Empty section matching WordPress structure */}
//                   </p>

//                   <h2 className="text-3xl font-bold text-gray-900 mt-8">What We Do:</h2>
                  
//                   <div className="space-y-6 mt-6">
//                     <div>
//                       <h2 className="text-2xl font-bold text-gray-900 mb-3">Build The Future of Travel with AI</h2>
//                       <p>
//                         You will be chomping at the bit to contribute to an <a href="https://www.flomadtravel.com/" target="_blank" rel="noopener noreferrer" className="text-[#00349B] hover:underline">AI-powered travel agent</a> that personalizes experiences with cutting-edge NLP (Natural Language Processing) techniques. Imagine crafting an app that
//                         understands complex travel requests and leverages real-time data to create dynamic
//                         itineraries – that's disruptive!
//                       </p>
//                       <p className="mt-3">
//                         The chance to integrate multimodal transportation with Generative AI opens a treasure trove of possibilities. We're talking about seamlessly
//                         combining flights, trains, ferries, bus, and even carpooling into optimized travel
//                         packages. That's innovation at its finest.
//                       </p>
//                     </div>

//                     <div>
//                       <h2 className="text-2xl font-bold text-gray-900 mb-3">Pushing Boundaries of AI Research</h2>
//                       <p>
//                         The opportunity to delve into AGI (Artificial General Intelligence) research is a dream come true. It's the holy
//                         grail of AI, and being involved will be an incredible learning experience. We are eager to
//                         stretch our knowledge and understanding of AI's theoretical underpinnings.
//                       </p>
//                     </div>

//                     <div>
//                       <h2 className="text-2xl font-bold text-gray-900 mb-3">Revolutionize Industries With AI</h2>
//                       <p>
//                         The prospect of working on <a href="https://flomad.international/projects/" target="_blank" rel="noopener noreferrer" className="text-[#00349B] hover:underline">projects that leverage AI</a> for personalized learning and improved educational outcomes is inspiring.
//                         Imagine AI tutors that adapt to individual needs and learning styles – that's a
//                         game-changer.
//                       </p>
//                       <p className="mt-3">
//                         Contributing to advancements in healthcare through AI-powered diagnostics, robotic surgery, and neurotechnology is enormously
//                         exciting. The potential to improve patient outcomes and streamline processes is a
//                         powerful motivator.
//                       </p>
//                     </div>
//                   </div>

//                   <h2 className="text-3xl font-bold text-gray-900 mt-8">The Bottom Line:</h2>
//                   <p className="mt-4">
//                     Learning from the brightest minds in AI and robotics through the Masterclass program is a golden opportunity. Gaining in-depth knowledge of the latest
//                     advancements and real-world applications of AI will be invaluable.
//                   </p>
//                   <p className="mt-3">
//                     This program will equip you with the skills to navigate the evolving landscape
//                     of AI and robotics, preparing you for a future shaped by these technologies.
//                     Collaborative Innovation with a Gamified Twist.
//                   </p>
//                   <p className="mt-3">
//                     Working in a collaborative environment that fosters creativity and innovation
//                     through AI-powered tools and gamification techniques is invigorating. We are creating a
//                     dynamic space where ideas are valued and progress is celebrated.
//                   </p>
//               </div>
//             </div>
//         </Container>
//       </Section>
//     </main>
//   )
// }

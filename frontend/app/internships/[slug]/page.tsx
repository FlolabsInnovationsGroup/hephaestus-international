import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container, Section } from '@/components/layout'
import { HubSpotForm } from '@/components/hubspot-form'
import { getInternshipBySlug, getInternships } from '@/lib/strapi'
import { getServerBrand } from '@/lib/branding'

type PageProps = {
  params: Promise<{ slug: string }>
}

type ParsedInternshipContent = {
  overview: string[]
  responsibilities: string[]
  qualifications: string[]
  whyJoinUs: string[]
}

// Allow dynamic params for on-demand generation
export const dynamicParams = true

// Revalidate the page every 60 seconds
export const revalidate = 60

const normalizeText = (value: string) =>
  value.replace(/\r/g, '').replace(/\u00A0/g, ' ').trim()

const cleanItem = (value: string) =>
  normalizeText(value)
    .replace(/^[-•●■▪◦]+\s*/, '')
    .trim()

const isOverviewHeading = (value: string) => /^overview$/i.test(value)
const isResponsibilitiesHeading = (value: string) => /^key responsibilities$/i.test(value)
const isQualificationsHeading = (value: string) =>
  /^qualifications and skills$/i.test(value) || /^qualifications\s*&\s*skills$/i.test(value)
const isWhyJoinUsHeading = (value: string) => /^why join us\??$/i.test(value)
const isHubSpotScript = (value: string) => /hbspt\.forms\.create/i.test(value)

function parseInternshipContent(raw?: string): ParsedInternshipContent {
  const result: ParsedInternshipContent = {
    overview: [],
    responsibilities: [],
    qualifications: [],
    whyJoinUs: [],
  }

  if (!raw) return result

  const blocks = raw
    .split(/\n\s*\n+/)
    .map(normalizeText)
    .filter(Boolean)

  let currentSection: keyof ParsedInternshipContent = 'overview'

  for (const block of blocks) {
    if (isHubSpotScript(block)) {
      continue
    }

    if (isOverviewHeading(block)) {
      currentSection = 'overview'
      continue
    }

    if (isResponsibilitiesHeading(block)) {
      currentSection = 'responsibilities'
      continue
    }

    if (isQualificationsHeading(block)) {
      currentSection = 'qualifications'
      continue
    }

    if (isWhyJoinUsHeading(block)) {
      currentSection = 'whyJoinUs'
      continue
    }

    result[currentSection].push(cleanItem(block))
  }

  return result
}

function splitWhyJoinItem(item: string) {
  const cleaned = cleanItem(item)
  const match = cleaned.match(/^([^:]+):\s*(.+)$/)

  if (!match) {
    return {
      title: '',
      description: cleaned,
    }
  }

  return {
    title: `${match[1].trim()}:`,
    description: match[2].trim(),
  }
}

// Generate static params for all internships
export async function generateStaticParams() {
  const internships = await getInternships()

  return internships.map((internship) => ({
    slug: internship.slug,
  }))
}

// Generate metadata for SEO
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params
  const internship = await getInternshipBySlug(params.slug)
  const brand = await getServerBrand()

  if (!internship) {
    return {
      title: 'Internship Not Found',
    }
  }

  const parsed = parseInternshipContent(internship.description)
  const description =
    parsed.overview.join(' ').substring(0, 160) || `Join our team as a ${internship.title}`

  return {
    title: `${internship.title} | ${brand.fullName} Internships`,
    description,
    openGraph: {
      title: internship.title,
      description,
      type: 'website',
    },
  }
}

export default async function InternshipPage(props: PageProps) {
  const params = await props.params
  const internship = await getInternshipBySlug(params.slug)
  const brand = await getServerBrand()

  if (!internship) {
    notFound()
  }

  const parsed = parseInternshipContent(internship.description)

  return (
    <Section className="bg-white pt-24 pb-16">
      <Container>
        <article className="max-w-4xl mx-auto internship-detail">
          <h1 className="text-4xl md:text-5xl font-bold mb-12 text-gray-900 leading-tight">
            {internship.title}
          </h1>

          {parsed.overview.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">
                Overview
              </h2>
              <div className="text-lg text-gray-700 leading-relaxed space-y-5">
                {parsed.overview.map((paragraph, index) => (
                  <p key={`overview-${index}-${paragraph.slice(0, 40)}`}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {parsed.responsibilities.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">
                Key Responsibilities
              </h2>
              <ul className="space-y-4">
                {parsed.responsibilities.map((item, index) => (
                  <li
                    key={`responsibility-${index}-${item.slice(0, 40)}`}
                    className="flex items-start text-gray-700 leading-relaxed"
                  >
                    <span className="text-[#00349B] font-bold mr-3 mt-1 shrink-0">■</span>
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsed.qualifications.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">
                Qualifications and Skills
              </h2>
              <ul className="space-y-4">
                {parsed.qualifications.map((item, index) => (
                  <li
                    key={`qualification-${index}-${item.slice(0, 40)}`}
                    className="flex items-start text-gray-700 leading-relaxed"
                  >
                    <span className="text-[#00349B] font-bold mr-3 mt-1 shrink-0">■</span>
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsed.whyJoinUs.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">
                Why Join Us?
              </h2>

              <div className="space-y-6">
                {parsed.whyJoinUs.map((item, index) => {
                  const entry = splitWhyJoinItem(item)

                  return (
                    <div key={`why-join-${index}-${item.slice(0, 40)}`} className="text-lg">
                      {entry.title ? (
                        <>
                          <p className="text-gray-900 font-semibold mb-2">{entry.title}</p>
                          <p className="text-gray-700 leading-relaxed">{entry.description}</p>
                        </>
                      ) : (
                        <p className="text-gray-700 leading-relaxed">{entry.description}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-16 pt-12 border-t-2 border-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4 text-[#00349B]">
                Apply for This Position
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Ready to join our team and work on cutting-edge AI and robotics projects?
                Complete the application form below to get started.
              </p>
            </div>

            {internship.hubspotFormId ? (
              <HubSpotForm formId={internship.hubspotFormId} />
            ) : (
              <div className="max-w-2xl mx-auto p-8 bg-gray-50 rounded-lg border-2 border-gray-200 text-center">
                <p className="text-gray-600 text-lg">
                  Application form is being set up. Please check back soon or contact us directly at{' '}
                  <a href={`mailto:${brand.email}`} className="text-[#00349B] underline">
                    {brand.email}
                  </a>
                </p>
              </div>
            )}
          </div>
        </article>
      </Container>
    </Section>
  )
}
// import { Metadata } from 'next'
// import { notFound } from 'next/navigation'
// import { Container, Section } from '@/components/layout'
// import { HubSpotForm } from '@/components/hubspot-form'
// import { getInternshipBySlug, getInternships } from '@/lib/strapi'
// import { getServerBrand } from '@/lib/branding'

// type PageProps = {
//   params: Promise<{ slug: string }>
// }

// // Allow dynamic params for on-demand generation
// export const dynamicParams = true

// // Revalidate the page every 60 seconds
// export const revalidate = 60

// // Generate static params for all internships
// export async function generateStaticParams() {
//   const internships = await getInternships()
  
//   return internships.map((internship) => ({
//     slug: internship.slug,
//   }))
// }

// // Generate metadata for SEO
// export async function generateMetadata(props: PageProps): Promise<Metadata> {
//   const params = await props.params
//   const internship = await getInternshipBySlug(params.slug)
//   const brand = await getServerBrand()

//   if (!internship) {
//     return {
//       title: 'Internship Not Found',
//     }
//   }

//   const description = internship.description?.substring(0, 160) || `Join our team as a ${internship.title}`

//   return {
//     title: `${internship.title} | ${brand.fullName} Internships`,
//     description,
//     openGraph: {
//       title: internship.title,
//       description,
//       type: 'website',
//     },
//   }
// }

// export default async function InternshipPage(props: PageProps) {
//   const params = await props.params
//   const internship = await getInternshipBySlug(params.slug)
//   const brand = await getServerBrand()

//   if (!internship) {
//     notFound()
//   }

//   // Convert array data to arrays if they're strings
//   const getArrayData = (data: string[] | string | undefined): string[] => {
//     if (!data) return []
//     if (Array.isArray(data)) return data
//     // If it's a string, try to parse it
//     return data.split('\n').map(line => line.trim()).filter(line => line.length > 0)
//   }

//   const requirements = getArrayData(internship.requirements)
//   const responsibilities = getArrayData(internship.responsibilities)

//   return (
//     <>
//       {/* WordPress-style layout with enhanced styling */}
//       <Section className="bg-white pt-24 pb-16">
//         <Container>
//           <article className="max-w-4xl mx-auto internship-detail">
//             {/* Title */}
//             <h1 className="text-4xl md:text-5xl font-bold mb-12 text-gray-900 leading-tight">
//               {internship.title}
//             </h1>

//             {/* Overview Section */}
//             <div className="mb-12">
//               <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">
//                 Overview
//               </h2>
//               <div className="text-lg text-gray-700 leading-relaxed space-y-4">
//                 {internship.description.split('\n\n').map((paragraph, index) => (
//                   <p key={`overview-${index}`}>{paragraph}</p>
//                 ))}
//               </div>
//             </div>

//             {/* Key Responsibilities Section */}
//             {responsibilities.length > 0 && (
//               <div className="mb-12">
//                 <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">
//                   Key Responsibilities
//                 </h2>
//                 <ul className="space-y-4">
//                   {responsibilities.map((item, index) => (
//                     <li key={`responsibility-${index}`} className="flex items-start text-gray-700 leading-relaxed">
//                       <span className="text-[#00349B] font-bold mr-3 mt-1 shrink-0">■</span>
//                       <span className="text-lg">{item}</span>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             {/* Qualifications and Skills Section */}
//             {requirements.length > 0 && (
//               <div className="mb-12">
//                 <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">
//                   Qualifications and Skills
//                 </h2>
//                 <ul className="space-y-4">
//                   {requirements.map((item, index) => (
//                     <li key={`requirement-${index}`} className="flex items-start text-gray-700 leading-relaxed">
//                       <span className="text-[#00349B] font-bold mr-3 mt-1 shrink-0">■</span>
//                       <span className="text-lg">{item}</span>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             {/* Why Join Us Section */}
//             <div className="mb-12">
//               <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">
//                 Why Join Us?
//               </h2>
              
//               <div className="space-y-6">
//                 <div className="text-lg">
//                   <p className="text-gray-900 font-semibold mb-2">Stay at the Forefront of Innovation:</p>
//                   <p className="text-gray-700 leading-relaxed">
//                     Explore the latest advancements in AI, robotics, and cutting-edge technologies, 
//                     contributing to scientific publications and research papers.
//                   </p>
//                 </div>
                
//                 <div className="text-lg">
//                   <p className="text-gray-900 font-semibold mb-2">Fully Remote & Flexible Schedule:</p>
//                   <p className="text-gray-700 leading-relaxed">
//                     This internship is entirely remote, allowing you to contribute from anywhere. 
//                     You can choose to work full-time (up to 40 hours per week) or part-time 
//                     (a minimum of 8-10 hours per week) based on your availability.
//                   </p>
//                 </div>
                
//                 <div className="text-lg">
//                   <p className="text-gray-900 font-semibold mb-2">On-site Internship (Optional):</p>
//                   <p className="text-gray-700 leading-relaxed">
//                     If interested, we can offer onsite internships at two locations: Austin, Texas, and Lemnos, Greece.
//                   </p>
//                 </div>
                
//                 <div className="text-lg">
//                   <p className="text-gray-900 font-semibold mb-2">Work on Cutting-Edge Projects:</p>
//                   <p className="text-gray-700 leading-relaxed">
//                     Contribute to advanced AI, robotics, and technology initiatives, gaining hands-on 
//                     experience with state-of-the-art tools and methodologies in real-world applications.
//                   </p>
//                 </div>
                
//                 <div className="text-lg">
//                   <p className="text-gray-900 font-semibold mb-2">Interdisciplinary Collaboration:</p>
//                   <p className="text-gray-700 leading-relaxed">
//                     Work alongside experts from diverse fields including AI researchers, robotics engineers, 
//                     data scientists, designers, and business strategists, expanding your professional network and skillset.
//                   </p>
//                 </div>
                
//                 <div className="text-lg">
//                   <p className="text-gray-900 font-semibold mb-2">Hands-On Development & Professional Growth:</p>
//                   <p className="text-gray-700 leading-relaxed">
//                     Build practical skills, contribute to research publications, and gain experience that 
//                     will accelerate your career in technology and innovation.
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Application Form */}
//             <div className="mt-16 pt-12 border-t-2 border-gray-200">
//               <div className="text-center mb-8">
//                 <h3 className="text-3xl font-bold mb-4 text-[#00349B]">Apply for This Position</h3>
//                 <p className="text-lg text-gray-600 max-w-2xl mx-auto">
//                   Ready to join our team and work on cutting-edge AI and robotics projects? 
//                   Complete the application form below to get started.
//                 </p>
//               </div>
//               {internship.hubspotFormId ? (
//                 <HubSpotForm formId={internship.hubspotFormId} />
//               ) : (
//                 <div className="max-w-2xl mx-auto p-8 bg-gray-50 rounded-lg border-2 border-gray-200 text-center">
//                   <p className="text-gray-600 text-lg">
//                     Application form is being set up. Please check back soon or contact us directly at{' '}
//                     <a href={`mailto:${brand.email}`} className="text-[#00349B] underline">
//                       {brand.email}
//                     </a>
//                   </p>
//                 </div>
//               )}
//             </div>
//           </article>
//         </Container>
//       </Section>
//     </>
//   )
// }

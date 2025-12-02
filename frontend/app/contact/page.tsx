import { Metadata } from 'next'
import { Container, Section } from '@/components/layout'
import { getSiteSettings } from '@/lib/strapi'
import { getServerBrand } from '@/lib/branding'

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getServerBrand()
  return {
    title: `Contact Us | ${brand.name} International`,
    description: `Get in touch with ${brand.name} International. Contact us for inquiries about internships, projects, and collaborations.`,
  }
}

export default async function ContactPage() {
  const siteSettings = await getSiteSettings()
  const brand = await getServerBrand()
  
  return (
    <>
      {/* Hero Section */}
      <Section className="flo-blue-section pt-32 pb-16">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-white/90">
              Have questions? We&apos;d love to hear from you.
            </p>
          </div>
        </Container>
      </Section>

      {/* Contact Form Section */}
      <Section className="bg-white">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-8 text-[#00349B] text-center">
                Send Us a Message
              </h2>
              
              <form className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#00349B] focus:ring-2 focus:ring-[#00349B]/20 outline-none transition-all"
                    placeholder="Your full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#00349B] focus:ring-2 focus:ring-[#00349B]/20 outline-none transition-all"
                    placeholder="your.email@example.com"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#00349B] focus:ring-2 focus:ring-[#00349B]/20 outline-none transition-all"
                    placeholder="What is this regarding?"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#00349B] focus:ring-2 focus:ring-[#00349B]/20 outline-none transition-all resize-vertical"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                {/* Submit Button */}
                <div className="text-center pt-4">
                  <button
                    type="submit"
                    className="px-8 py-4 bg-[#00349B] text-white font-semibold rounded-lg hover:bg-[#002775] transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>

            {/* Contact Information */}
            <div className="mt-12 text-center">
              <h3 className="text-2xl font-bold mb-6 text-gray-900">
                Other Ways to Reach Us
              </h3>
              
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong className="text-[#00349B]">Email:</strong>{' '}
                  <a href={`mailto:${siteSettings?.contactEmail || brand.email}`} className="hover:underline">
                    {siteSettings?.contactEmail || brand.email}
                  </a>
                </p>
                
                <p>
                  <strong className="text-[#00349B]">LinkedIn:</strong>{' '}
                  <a 
                    href={siteSettings?.socialLinks?.linkedin || 'https://www.linkedin.com/company/flomad-labs-r-d/'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {brand.fullName} on LinkedIn
                  </a>
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}

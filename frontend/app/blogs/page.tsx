import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Container, Section } from '@/components/layout'
import { formatDate } from '@/lib/utils'
import { getBlogPosts, getStrapiImageUrl } from '@/lib/strapi'

export const metadata: Metadata = {
  title: 'Blogs | Hephaestus Labs Institute of Experiential Learning Center of Excellence',
  description: 'Explore Blogs on AI Breakthroughs, Internships & Emerging Tech Trends - Stay ahead with Hephaestus Labs Institute.',
}

export const revalidate = 60 // Revalidate every 60 seconds

export default async function BlogsPage() {
  const blogPosts = await getBlogPosts()
  
  return (
    <>
      {/* Hero Section - Matching WordPress exactly */}
      <Section className="flo-blue-section py-24 md:py-32">
        <Container>
          <div className="max-w-6xl mx-auto text-center">
            {/* Centered Logo */}
            <div className="mb-12">
              <Image
                src="https://res.cloudinary.com/dgb6qsvev/image/upload/v1763058482/Frame_4_3f70d2d7b7.jpg"
                alt="Hephaestus Labs Institute Logo"
                width={200}
                height={200}
                className="mx-auto"
                priority
              />
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Blogs
            </h1>
            
            <h2 className="text-2xl md:text-3xl font-normal mb-12 text-white/90">
              Explore Blogs on AI Breakthroughs, Internships & Emerging Tech Trends
            </h2>

            {/* Hero Image */}
            <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
              <Image
                src="https://res.cloudinary.com/dgb6qsvev/image/upload/v1763058594/Frame_26_1_c2da48aa4e.jpg"
                alt="blogs page image"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="text-lg text-white leading-relaxed space-y-4 max-w-4xl mx-auto">
              <p>
                Welcome to Hephaestus Labs Institute Blogs- your gateway to the world of AI innovation,{' '}
                <Link href="/internships" className="text-cyan-300 hover:underline font-semibold">
                  hands-on internships
                </Link>
                , and cutting-edge tech trends. Whether you&apos;re a student, professional, or tech enthusiast, our blogs are here to inform, inspire, and{' '}
                <a 
                  href="https://www.linkedin.com/pulse/tech-journey-beginners-guide-nouwen-mokua-7rpqf/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-300 hover:underline font-semibold"
                >
                  power up your tech journey
                </a>
                {' '}into the future of technology. Dive in and stay ahead!
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Blog Posts List - Matching WordPress single column layout */}
      <Section className="bg-white py-16">
        <Container>
          {blogPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 mb-6">
                No blog posts available at the moment.
              </p>
              <p className="text-gray-500">
                Check back soon for updates from our team!
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-12">
              {blogPosts.map((post) => (
                <article key={post.id} className="bg-white overflow-hidden hover:shadow-lg transition-shadow duration-300 border-b-2 border-gray-100 pb-8">
                  <Link href={`/blogs/${post.slug}`} className="group block">
                    {/* Featured Image */}
                    {post.featuredImage && (
                      <div className="relative w-full h-64 md:h-80 mb-6 rounded-lg overflow-hidden">
                        <Image
                          src={getStrapiImageUrl(post.featuredImage.url) || ''}
                          alt={post.featuredImage.alternativeText || post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      {/* Title */}
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-[#00349B] transition-colors">
                        {post.title}
                      </h2>
                      
                      {/* Meta */}
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="font-medium">{post.author}</span>
                        <span>/</span>
                        <time dateTime={post.publishedDate}>
                          {formatDate(post.publishedDate)}
                        </time>
                      </div>

                      {/* Excerpt */}
                      <p className="text-gray-700 text-base leading-relaxed">
                        {post.excerpt}
                      </p>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-blue-50 text-[#00349B] text-sm rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </Container>
      </Section>


    </>
  )
}

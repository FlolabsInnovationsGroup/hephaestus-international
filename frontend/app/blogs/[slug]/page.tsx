import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container, Section } from '@/components/layout'
import { formatDate } from '@/lib/utils'
import { getBlogPosts, getBlogPostBySlug } from '@/lib/strapi'

export const revalidate = 60 // Revalidate every 60 seconds

interface BlogDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const posts = await getBlogPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata(
  props: BlogDetailPageProps
): Promise<Metadata> {
  const params = await props.params
  const post = await getBlogPostBySlug(params.slug)

  if (!post) {
    return {
      title: 'Blog Post Not Found | Hephaestus',
    }
  }

  return {
    title: `${post.title} | Hephaestus Blog`,
    description: post.excerpt || '',
  }
}

export default async function BlogDetailPage(props: BlogDetailPageProps) {
  const params = await props.params
  const post = await getBlogPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  // Get related posts (exclude current post, limit to 2)
  const allPosts = await getBlogPosts()
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2)

  return (
    <>
      {/* Hero Section */}
      <Section className="flo-blue-section">
        <Container>
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-6">
              <Link
                href="/blogs"
                className="text-white/80 hover:text-white transition-colors"
              >
                ← Back to Blog
              </Link>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <span className="font-medium">{post.author}</span>
              <span>•</span>
              <time dateTime={post.publishedDate}>
                {formatDate(post.publishedDate)}
              </time>
            </div>
          </div>
        </Container>
      </Section>

      {/* Content */}
      <Section className="bg-white">
        <Container>
          <div className="max-w-4xl mx-auto">
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 bg-blue-50 text-[#00349B] text-sm font-medium rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Article Content */}
            <article className="prose prose-lg max-w-none">
              <div
                className="whitespace-pre-wrap leading-relaxed text-gray-800"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </article>
          </div>
        </Container>
      </Section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <Section className="bg-gray-50">
          <Container>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-[#00349B] mb-8">
                Related Articles
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/blogs/${relatedPost.slug}`}
                    className="group"
                  >
                    <article className="flo-card h-full hover:shadow-xl transition-all duration-300">
                      <h3 className="text-xl font-bold text-[#00349B] group-hover:text-[#002775] transition-colors mb-3">
                        {relatedPost.title}
                      </h3>
                      <p className="text-gray-700 mb-3 line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                      <div className="text-sm text-gray-500">
                        {formatDate(relatedPost.publishedDate)}
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* Call to Action */}
      <Section className="flo-blue-section">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Interested in Working With Us?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join our team and contribute to cutting-edge AI and robotics research.
            </p>
            <Link
              href="/internships"
              className="inline-block px-8 py-3 bg-white text-[#00349B] font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              View Opportunities
            </Link>
          </div>
        </Container>
      </Section>
    </>
  )
}

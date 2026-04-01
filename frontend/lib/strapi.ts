// Strapi API Helper Functions
// Based on official Strapi v5 documentation

// const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'
// const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN

const STRAPI_URL = "strapi-production-7ecb.up.railway.app"
const STRAPI_TOKEN ="UoGvTL55YkgnaTYQRypCow=="

interface StrapiResponse<T> {
  data: T
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

interface StrapiAttributes {
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

// Internship interface matching Strapi schema
export interface Internship extends StrapiAttributes {
  id: number
  documentId: string
  title: string
  slug: string
  status: 'Open' | 'Closed' | 'Filled'
  location: string
  duration?: string
  description: string
  requirements?: string
  responsibilities?: string
  hubspotFormId?: string
  images?: {
    url: string
    alternativeText?: string
  }[]
}

export interface Project extends StrapiAttributes {
  id: number
  documentId: string
  title: string
  slug: string
  description: string
  shortDescription?: string
  currentWork?: string
  images?: {
    url: string
    alternativeText?: string
  }[]
  link?: string
  order: number
}

export interface BlogPost extends StrapiAttributes {
  id: number
  documentId: string
  title: string
  slug: string
  author: string
  publishedDate: string
  featuredImage?: {
    url: string
    alternativeText?: string
  }
  content: string
  excerpt?: string
  tags?: string[]
}

export interface TeamMember extends StrapiAttributes {
  id: number
  documentId: string
  name: string
  role: string
  bio?: string
  image?: {
    url: string
    alternativeText?: string
  }
  order: number
}

export interface Page extends StrapiAttributes {
  id: number
  documentId: string
  title: string
  slug: string
  content: string
  seo?: {
    metaTitle?: string
    metaDescription?: string
  }
}

// Generic fetch function
async function fetchAPI<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${STRAPI_URL}/api${path}`
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (options.headers) {
    Object.assign(headers, options.headers)
  }

  if (STRAPI_TOKEN) {
    headers['Authorization'] = `Bearer ${STRAPI_TOKEN}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Strapi API error: ${response.status} ${response.statusText}`)
      console.error(`URL: ${url}`)
      console.error(`Response: ${errorText}`)
      throw new Error(`Strapi API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Strapi fetch error:', error)
    console.error(`Failed URL: ${url}`)
    throw error
  }
}

// Internship API calls
export async function getInternships(filters?: {
  status?: string
  search?: string
}): Promise<Internship[]> {
  try {
    let query = '/internships?populate=*&pagination[pageSize]=100'
    
    if (filters?.status) {
      query += `&filters[status][$eq]=${filters.status}`
    }
    
    if (filters?.search) {
      query += `&filters[$or][0][title][$containsi]=${filters.search}`
      query += `&filters[$or][1][description][$containsi]=${filters.search}`
    }

    const response = await fetchAPI<StrapiResponse<Internship[]>>(query)
    return response.data || []
  } catch (error) {
    console.warn('Failed to fetch internships:', error)
    return []
  }
}

export async function getInternshipBySlug(slug: string): Promise<Internship | null> {
  try {
    const response = await fetchAPI<StrapiResponse<Internship[]>>(
      `/internships?filters[slug][$eq]=${slug}&populate=*`
    )
    return response.data?.[0] || null
  } catch (error) {
    console.warn(`Failed to fetch internship with slug "${slug}":`, error)
    return null
  }
}

// Project API calls
export async function getProjects(): Promise<Project[]> {
  const response = await fetchAPI<StrapiResponse<Project[]>>('/projects?populate=*&sort=order:asc')
  return response.data || []
}

// Get only projects marked for homepage display
export async function getHomepageProjects(): Promise<Project[]> {
  const response = await fetchAPI<StrapiResponse<Project[]>>('/projects?filters[showOnHomepage][$eq]=true&populate=*&sort=order:asc')
  return response.data || []
}

export async function getProjectById(id: number): Promise<Project | null> {
  try {
    const response = await fetchAPI<StrapiResponse<Project>>(
      `/projects/${id}?populate=*`
    )
    return response.data || null
  } catch (error) {
    console.warn(`Failed to fetch project with ID ${id}:`, error)
    return null
  }
}

// Blog API calls
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetchAPI<StrapiResponse<BlogPost[]>>(
      '/blog-posts?populate=*&sort=publishedDate:desc'
    )
    return response.data || []
  } catch (error) {
    console.warn('Failed to fetch blog posts:', error)
    return []
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetchAPI<StrapiResponse<BlogPost[]>>(
      `/blog-posts?filters[slug][$eq]=${slug}&populate=*`
    )
    return response.data?.[0] || null
  } catch (error) {
    console.warn(`Failed to fetch blog post with slug "${slug}":`, error)
    return null
  }
}

// Team API calls
export async function getTeamMembers(): Promise<TeamMember[]> {
  const response = await fetchAPI<StrapiResponse<TeamMember[]>>(
    '/team-members?populate=*&sort=order:asc'
  )
  return response.data || []
}

// Page API calls
export async function getPageBySlug(slug: string): Promise<Page | null> {
  const response = await fetchAPI<StrapiResponse<Page[]>>(
    `/pages?filters[slug][$eq]=${slug}&populate=*`
  )
  return response.data?.[0] || null
}

// Image URL helper
export function getStrapiImageUrl(imageUrl?: string): string | null {
  if (!imageUrl) return null
  
  // If already a full URL, return as-is
  if (imageUrl.startsWith('http')) {
    return imageUrl
  }
  
  // Otherwise, prepend Strapi URL
  return `${STRAPI_URL}${imageUrl}`
}

// New dynamic content types
export interface SiteSettings extends StrapiAttributes {
  id: number
  siteName: string
  siteTagline?: string
  contactEmail?: string
  contactPhone?: string
  socialLinks?: {
    facebook?: string
    twitter?: string
    linkedin?: string
    instagram?: string
    github?: string
  }
  logo?: {
    url: string
    alternativeText?: string
  }
  favicon?: {
    url: string
  }
  footerText?: string
  copyrightText: string
}

export interface Benefit extends StrapiAttributes {
  id: number
  documentId: string
  title: string
  description: string
  icon?: string
  order: number
}

export interface Vertical extends StrapiAttributes {
  id: number
  documentId: string
  title: string
  description: string
  icon?: string
  order: number
}

export interface MethodologyItem extends StrapiAttributes {
  id: number
  documentId: string
  title: string
  description: string
  order: number
  stepNumber: number
}

export interface SectionContent extends StrapiAttributes {
  id: number
  documentId: string
  identifier: string
  title: string
  content: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
  backgroundImage?: {
    url: string
    alternativeText?: string
  }
}

export interface Intern extends StrapiAttributes {
  id: number
  documentId: string
  name: string
  role: string
  bio?: string
  photo?: {
    url: string
    alternativeText?: string
  }
  linkedIn?: string
  email?: string
  order: number
  isActive: boolean
  startDate?: string
  endDate?: string
}

// Site Settings API (single type)
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const response = await fetchAPI<StrapiResponse<SiteSettings>>(
      '/site-setting?populate=*'
    )
    return response.data || null
  } catch (error) {
    console.warn('Failed to fetch site settings:', error)
    return null
  }
}

// Benefits API calls
export async function getBenefits(): Promise<Benefit[]> {
  try {
    const response = await fetchAPI<StrapiResponse<Benefit[]>>(
      '/benefits?populate=*&sort=order:asc'
    )
    return response.data || []
  } catch (error) {
    console.warn('Failed to fetch benefits:', error)
    return []
  }
}

// Verticals API calls
export async function getVerticals(): Promise<Vertical[]> {
  try {
    const response = await fetchAPI<StrapiResponse<Vertical[]>>(
      '/verticals?populate=*&sort=order:asc'
    )
    return response.data || []
  } catch (error) {
    console.warn('Failed to fetch verticals:', error)
    return []
  }
}

// Methodology Items API calls
export async function getMethodologyItems(): Promise<MethodologyItem[]> {
  try {
    const response = await fetchAPI<StrapiResponse<MethodologyItem[]>>(
      '/methodology-items?populate=*&sort=order:asc'
    )
    return response.data || []
  } catch (error) {
    console.warn('Failed to fetch methodology items:', error)
    return []
  }
}

// Section Content API calls
export async function getSectionContent(identifier: string): Promise<SectionContent | null> {
  try {
    const response = await fetchAPI<StrapiResponse<SectionContent[]>>(
      `/section-contents?filters[identifier][$eq]=${identifier}&populate=*`
    )
    return response.data?.[0] || null
  } catch (error) {
    console.warn(`Failed to fetch section content for identifier "${identifier}":`, error)
    return null
  }
}

export async function getAllSectionContents(): Promise<SectionContent[]> {
  const response = await fetchAPI<StrapiResponse<SectionContent[]>>(
    '/section-contents?populate=*'
  )
  return response.data || []
}

// Interns API calls
export async function getInterns(activeOnly = true): Promise<Intern[]> {
  try {
    const filters = activeOnly ? '&filters[isActive][$eq]=true' : ''
    const response = await fetchAPI<StrapiResponse<Intern[]>>(
      `/interns?populate=photo&sort=order:asc${filters}`
    )
    return response.data || []
  } catch (error) {
    console.warn('Failed to fetch interns:', error)
    return []
  }
}

export async function getIntern(id: number): Promise<Intern | null> {
  const response = await fetchAPI<StrapiResponse<Intern>>(
    `/interns/${id}?populate=photo`
  )
  return response.data || null
}

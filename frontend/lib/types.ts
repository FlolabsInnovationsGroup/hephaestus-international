// Shared TypeScript types for the application

export type InternshipCategory = 
  | 'Engineering' 
  | 'Marketing' 
  | 'Design' 
  | 'Business' 
  | 'Science' 
  | 'Operations' 
  | 'Research' 
  | 'Legal'

export type InternshipStatus = 'Open' | 'Closed'

export interface Internship {
  id: number
  slug: string
  title: string
  category: InternshipCategory
  status: InternshipStatus
  description: string
  shortDescription?: string
  requirements?: string[]
  responsibilities?: string[]
  whatYouWillLearn?: string[]
  benefits?: string[]
  duration?: string
  timeCommitment?: string
  location: string
  remote: boolean
  paid: boolean
  hubspotFormId?: string
  createdAt: string
  updatedAt: string
}

export interface InternshipFilters {
  category?: InternshipCategory
  status?: InternshipStatus
  search?: string
}

export interface Project {
  id: number
  slug: string
  title: string
  description: string
  currentWork?: string
  link?: string
  order?: number
  images?: Array<{
    url: string
    alternativeText?: string
    name?: string
  }>
  createdAt: string
  updatedAt: string
}

export interface BlogPost {
  id: number
  slug: string
  title: string
  excerpt?: string
  content: string
  author: string
  publishedDate: string
  coverImage?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface Page {
  id: number
  slug: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface StrapiResponse<T> {
  data: T
  meta: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export interface NavLink {
  href: string
  label: string
  external?: boolean
}

export interface SiteConfig {
  name: string
  description: string
  url: string
  ogImage: string
  links: {
    github?: string
    twitter?: string
    linkedin?: string
  }
}

// New dynamic content types from Strapi
export interface SiteSettings {
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

export interface Benefit {
  id: number
  title: string
  description: string
  icon?: string
  order: number
}

export interface Vertical {
  id: number
  title: string
  description: string
  icon?: string
  order: number
}

export interface MethodologyItem {
  id: number
  title: string
  description: string
  order: number
  stepNumber: number
}

export interface SectionContent {
  id: number
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

export interface Intern {
  id: number
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

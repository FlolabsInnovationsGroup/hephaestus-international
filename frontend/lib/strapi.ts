// // Strapi API Helper Functions
// // Based on official Strapi v5 documentation

// const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'
// const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN

// // const STRAPI_URL = "NEXT_PUBLIC_STRAPI_URL:https://hephaestus-international-production.up.railway.app"
// // const STRAPI_TOKEN ="d4c2540ef2327333ce7afc207eb5a79434fce32bb58b846495faa4ea5372b9de8c042d16cfde2c27cf55538b00fe37036e93fa7fe8ca5708292423d5f3c08f181be023543ee7d1353023f3704f2fcb009d2bbbb4d8a5a99c51bb66aeff5954e816d8fceb34ba3ce08405c2278a98c698920d79334258f75731293a1133bd0183"

// interface StrapiResponse<T> {
//   data: T
//   meta?: {
//     pagination?: {
//       page: number
//       pageSize: number
//       pageCount: number
//       total: number
//     }
//   }
// }

// interface StrapiAttributes {
//   createdAt: string
//   updatedAt: string
//   publishedAt?: string
// }

// // Internship interface matching Strapi schema
// export interface Internship extends StrapiAttributes {
//   id: number
//   documentId: string
//   title: string
//   slug: string
//   status: 'Open' | 'Closed' | 'Filled'
//   location: string
//   duration?: string
//   description: string
//   requirements?: string
//   responsibilities?: string
//   hubspotFormId?: string
//   images?: {
//     url: string
//     alternativeText?: string
//   }[]
// }

// export interface Project extends StrapiAttributes {
//   id: number
//   documentId: string
//   title: string
//   slug: string
//   description: string
//   shortDescription?: string
//   currentWork?: string
//   images?: {
//     url: string
//     alternativeText?: string
//   }[]
//   link?: string
//   order: number
// }

// export interface BlogPost extends StrapiAttributes {
//   id: number
//   documentId: string
//   title: string
//   slug: string
//   author: string
//   publishedDate: string
//   featuredImage?: {
//     url: string
//     alternativeText?: string
//   }
//   content: string
//   excerpt?: string
//   tags?: string[]
// }

// export interface TeamMember extends StrapiAttributes {
//   id: number
//   documentId: string
//   name: string
//   role: string
//   bio?: string
//   image?: {
//     url: string
//     alternativeText?: string
//   }
//   order: number
// }

// export interface Page extends StrapiAttributes {
//   id: number
//   documentId: string
//   title: string
//   slug: string
//   content: string
//   seo?: {
//     metaTitle?: string
//     metaDescription?: string
//   }
// }

// // Generic fetch function
// async function fetchAPI<T>(
//   path: string,
//   options: RequestInit = {}
// ): Promise<T> {
//   const url = `${STRAPI_URL}/api${path}`

//   const headers: Record<string, string> = {
//     'Content-Type': 'application/json',
//   }

//   if (options.headers) {
//     Object.assign(headers, options.headers)
//   }

//   if (STRAPI_TOKEN) {
//     headers['Authorization'] = `Bearer ${STRAPI_TOKEN}`
//   }

//   try {
//     const response = await fetch(url, {
//       ...options,
//       headers,
//       next: { revalidate: 60 }, // Revalidate every 60 seconds
//     })

//     if (!response.ok) {
//       const errorText = await response.text()
//       console.error(`Strapi API error: ${response.status} ${response.statusText}`)
//       console.error(`URL: ${url}`)
//       console.error(`Response: ${errorText}`)
//       throw new Error(`Strapi API error: ${response.status} ${response.statusText}`)
//     }

//     return await response.json()
//   } catch (error) {
//     console.error('Strapi fetch error:', error)
//     console.error(`Failed URL: ${url}`)
//     throw error
//   }
// }

// // Internship API calls
// export async function getInternships(filters?: {
//   status?: string
//   search?: string
// }): Promise<Internship[]> {
//   try {
//     let query = '/internships?populate=*&pagination[pageSize]=100'

//     if (filters?.status) {
//       query += `&filters[status][$eq]=${filters.status}`
//     }

//     if (filters?.search) {
//       query += `&filters[$or][0][title][$containsi]=${filters.search}`
//       query += `&filters[$or][1][description][$containsi]=${filters.search}`
//     }

//     const response = await fetchAPI<StrapiResponse<Internship[]>>(query)
//     return response.data || []
//   } catch (error) {
//     console.warn('Failed to fetch internships:', error)
//     return []
//   }
// }

// export async function getInternshipBySlug(slug: string): Promise<Internship | null> {
//   try {
//     const response = await fetchAPI<StrapiResponse<Internship[]>>(
//       `/internships?filters[slug][$eq]=${slug}&populate=*`
//     )
//     return response.data?.[0] || null
//   } catch (error) {
//     console.warn(`Failed to fetch internship with slug "${slug}":`, error)
//     return null
//   }
// }

// // Project API calls
// export async function getProjects(): Promise<Project[]> {
//   const response = await fetchAPI<StrapiResponse<Project[]>>('/projects?populate=*&sort=order:asc')
//   return response.data || []
// }

// // Get only projects marked for homepage display
// export async function getHomepageProjects(): Promise<Project[]> {
//   const response = await fetchAPI<StrapiResponse<Project[]>>('/projects?filters[showOnHomepage][$eq]=true&populate=*&sort=order:asc')
//   return response.data || []
// }

// export async function getProjectById(id: number): Promise<Project | null> {
//   try {
//     const response = await fetchAPI<StrapiResponse<Project>>(
//       `/projects/${id}?populate=*`
//     )
//     return response.data || null
//   } catch (error) {
//     console.warn(`Failed to fetch project with ID ${id}:`, error)
//     return null
//   }
// }

// // Blog API calls
// export async function getBlogPosts(): Promise<BlogPost[]> {
//   try {
//     const response = await fetchAPI<StrapiResponse<BlogPost[]>>(
//       '/blog-posts?populate=*&sort=publishedDate:desc'
//     )
//     return response.data || []
//   } catch (error) {
//     console.warn('Failed to fetch blog posts:', error)
//     return []
//   }
// }

// export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
//   try {
//     const response = await fetchAPI<StrapiResponse<BlogPost[]>>(
//       `/blog-posts?filters[slug][$eq]=${slug}&populate=*`
//     )
//     return response.data?.[0] || null
//   } catch (error) {
//     console.warn(`Failed to fetch blog post with slug "${slug}":`, error)
//     return null
//   }
// }

// // Team API calls
// export async function getTeamMembers(): Promise<TeamMember[]> {
//   const response = await fetchAPI<StrapiResponse<TeamMember[]>>(
//     '/team-members?populate=*&sort=order:asc'
//   )
//   return response.data || []
// }

// // Page API calls
// export async function getPageBySlug(slug: string): Promise<Page | null> {
//   const response = await fetchAPI<StrapiResponse<Page[]>>(
//     `/pages?filters[slug][$eq]=${slug}&populate=*`
//   )
//   return response.data?.[0] || null
// }

// // Image URL helper
// export function getStrapiImageUrl(imageUrl?: string): string | null {
//   if (!imageUrl) return null

//   // If already a full URL, return as-is
//   if (imageUrl.startsWith('http')) {
//     return imageUrl
//   }

//   // Otherwise, prepend Strapi URL
//   return `${STRAPI_URL}${imageUrl}`
// }

// // New dynamic content types
// export interface SiteSettings extends StrapiAttributes {
//   id: number
//   siteName: string
//   siteTagline?: string
//   contactEmail?: string
//   contactPhone?: string
//   socialLinks?: {
//     facebook?: string
//     twitter?: string
//     linkedin?: string
//     instagram?: string
//     github?: string
//   }
//   logo?: {
//     url: string
//     alternativeText?: string
//   }
//   favicon?: {
//     url: string
//   }
//   footerText?: string
//   copyrightText: string
// }

// export interface Benefit extends StrapiAttributes {
//   id: number
//   documentId: string
//   title: string
//   description: string
//   icon?: string
//   order: number
// }

// export interface Vertical extends StrapiAttributes {
//   id: number
//   documentId: string
//   title: string
//   description: string
//   icon?: string
//   order: number
// }

// export interface MethodologyItem extends StrapiAttributes {
//   id: number
//   documentId: string
//   title: string
//   description: string
//   order: number
//   stepNumber: number
// }

// export interface SectionContent extends StrapiAttributes {
//   id: number
//   documentId: string
//   identifier: string
//   title: string
//   content: string
//   subtitle?: string
//   ctaText?: string
//   ctaLink?: string
//   backgroundImage?: {
//     url: string
//     alternativeText?: string
//   }
// }

// export interface Intern extends StrapiAttributes {
//   id: number
//   documentId: string
//   name: string
//   role: string
//   bio?: string
//   photo?: {
//     url: string
//     alternativeText?: string
//   }
//   linkedIn?: string
//   email?: string
//   order: number
//   isActive: boolean
//   startDate?: string
//   endDate?: string
// }

// // Site Settings API (single type)
// export async function getSiteSettings(): Promise<SiteSettings | null> {
//   try {
//     const response = await fetchAPI<StrapiResponse<SiteSettings>>(
//       '/site-setting?populate=*'
//     )
//     return response.data || null
//   } catch (error) {
//     console.warn('Failed to fetch site settings:', error)
//     return null
//   }
// }

// // Benefits API calls
// export async function getBenefits(): Promise<Benefit[]> {
//   try {
//     const response = await fetchAPI<StrapiResponse<Benefit[]>>(
//       '/benefits?populate=*&sort=order:asc'
//     )
//     return response.data || []
//   } catch (error) {
//     console.warn('Failed to fetch benefits:', error)
//     return []
//   }
// }

// // Verticals API calls
// export async function getVerticals(): Promise<Vertical[]> {
//   try {
//     const response = await fetchAPI<StrapiResponse<Vertical[]>>(
//       '/verticals?populate=*&sort=order:asc'
//     )
//     return response.data || []
//   } catch (error) {
//     console.warn('Failed to fetch verticals:', error)
//     return []
//   }
// }

// // Methodology Items API calls
// export async function getMethodologyItems(): Promise<MethodologyItem[]> {
//   try {
//     const response = await fetchAPI<StrapiResponse<MethodologyItem[]>>(
//       '/methodology-items?populate=*&sort=order:asc'
//     )
//     return response.data || []
//   } catch (error) {
//     console.warn('Failed to fetch methodology items:', error)
//     return []
//   }
// }

// // Section Content API calls
// export async function getSectionContent(identifier: string): Promise<SectionContent | null> {
//   try {
//     const response = await fetchAPI<StrapiResponse<SectionContent[]>>(
//       `/section-contents?filters[identifier][$eq]=${identifier}&populate=*`
//     )
//     return response.data?.[0] || null
//   } catch (error) {
//     console.warn(`Failed to fetch section content for identifier "${identifier}":`, error)
//     return null
//   }
// }

// export async function getAllSectionContents(): Promise<SectionContent[]> {
//   const response = await fetchAPI<StrapiResponse<SectionContent[]>>(
//     '/section-contents?populate=*'
//   )
//   return response.data || []
// }

// // Interns API calls
// export async function getInterns(activeOnly = true): Promise<Intern[]> {
//   try {
//     const filters = activeOnly ? '&filters[isActive][$eq]=true' : ''
//     const response = await fetchAPI<StrapiResponse<Intern[]>>(
//       `/interns?populate=photo&sort=order:asc${filters}`
//     )
//     return response.data || []
//   } catch (error) {
//     console.warn('Failed to fetch interns:', error)
//     return []
//   }
// }

// export async function getIntern(id: number): Promise<Intern | null> {
//   const response = await fetchAPI<StrapiResponse<Intern>>(
//     `/interns/${id}?populate=photo`
//   )
//   return response.data || null
// }

// Strapi API Helper Functions
// Based on official Strapi v5 documentation

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

const CONTENT_STRAPI_URL = process.env.CONTENT_STRAPI_URL;
const CONTENT_STRAPI_API_TOKEN = process.env.CONTENT_STRAPI_API_TOKEN;

interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiAttributes {
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Internship interface matching Strapi schema
export interface Internship extends StrapiAttributes {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  status: "Open" | "Closed" | "Filled";
  location: string;
  duration?: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  hubspotFormId?: string;
  images?: {
    url: string;
    alternativeText?: string;
  }[];
  /** Content Strapi uses this field name; normalized to `status` in getters */
  internship_status?: string;
}

/** Map content Strapi `internship_status` onto `status` for the rest of the app */
function normalizeInternship(row: Internship): Internship {
  const s = row.status ?? row.internship_status;
  return {
    ...row,
    status: (s ?? "Filled") as Internship["status"],
  };
}

export interface Project extends StrapiAttributes {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  currentWork?: string;
  images?: {
    url: string;
    alternativeText?: string;
  }[];
  link?: string;
  order: number;
}

export interface BlogPost extends StrapiAttributes {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  author: string;
  publishedDate: string;
  featuredImage?: {
    url: string;
    alternativeText?: string;
  };
  content: string;
  excerpt?: string;
  tags?: string[];
}

export interface TeamMember extends StrapiAttributes {
  id: number;
  documentId: string;
  name: string;
  role: string;
  bio?: string;
  image?: {
    url: string;
    alternativeText?: string;
  };
  order: number;
}

export interface Page extends StrapiAttributes {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  content: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

type FetchAPIOptions = RequestInit & {
  /** When true, 404 does not log or throw; returns `{ data: null }` (useful if a collection may not exist yet). */
  notFoundReturnsNull?: boolean;
};

// Generic fetch function for the main Strapi instance
async function fetchAPI<T>(
  path: string,
  options: FetchAPIOptions = {},
): Promise<T> {
  const { notFoundReturnsNull, ...fetchInit } = options;
  const url = `${STRAPI_URL}/api${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (fetchInit.headers) {
    Object.assign(headers, fetchInit.headers);
  }

  if (STRAPI_TOKEN) {
    headers["Authorization"] = `Bearer ${STRAPI_TOKEN}`;
  }

  try {
    const response = await fetch(url, {
      ...fetchInit,
      headers,
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      if (response.status === 404 && notFoundReturnsNull) {
        return { data: null } as T;
      }
      const errorText = await response.text();
      console.error(
        `Strapi API error: ${response.status} ${response.statusText}`,
      );
      console.error(`URL: ${url}`);
      console.error(`Response: ${errorText}`);
      throw new Error(
        `Strapi API error: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Strapi fetch error:", error);
    console.error(`Failed URL: ${url}`);
    throw error;
  }
}

// Generic fetch function for the content-only Strapi instance (projects, blogs, internships)
export async function fetchContentAPI<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!CONTENT_STRAPI_URL) {
    throw new Error("Missing CONTENT_STRAPI_URL");
  }

  const url = `${CONTENT_STRAPI_URL}/api${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (CONTENT_STRAPI_API_TOKEN) {
    headers["Authorization"] = `Bearer ${CONTENT_STRAPI_API_TOKEN}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Content Strapi API error: ${response.status} ${response.statusText}`,
      );
      console.error(`URL: ${url}`);
      console.error(`Response: ${errorText}`);
      throw new Error(
        `Content Strapi API error: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Content Strapi fetch error:", error);
    console.error(`Failed URL: ${url}`);
    throw error;
  }
}

// Internship API calls. From content Strapi
export async function getInternships(filters?: {
  status?: string;
  search?: string;
}): Promise<Internship[]> {
  try {
    let query = "/internships?populate=*&pagination[pageSize]=100";

    if (filters?.search) {
      query += `&filters[$or][0][title][$containsi]=${encodeURIComponent(filters.search)}`;
      query += `&filters[$or][1][description][$containsi]=${encodeURIComponent(filters.search)}`;
    }

    const response = await fetchContentAPI<StrapiResponse<Internship[]>>(query);
    let list = (response.data || []).map(normalizeInternship);

    if (filters?.status) {
      list = list.filter((item) => item.status === filters.status);
    }

    return list;
  } catch (error) {
    console.warn("Failed to fetch internships:", error);
    return [];
  }
}

export async function getInternshipBySlug(
  slug: string,
): Promise<Internship | null> {
  try {
    const response = await fetchContentAPI<StrapiResponse<Internship[]>>(
      `/internships?filters[slug][$eq]=${slug}&populate=*`,
    );
    const raw = response.data?.[0];
    return raw ? normalizeInternship(raw) : null;
  } catch (error) {
    console.warn(`Failed to fetch internship with slug "${slug}":`, error);
    return null;
  }
}

// Project API calls. From content Strapi
export async function getProjects(): Promise<Project[]> {
  try {
    const response = await fetchContentAPI<StrapiResponse<Project[]>>(
      "/projects?populate=*&sort=order:asc",
    );
    return response.data || [];
  } catch (error) {
    console.warn("Failed to fetch projects:", error);
    return [];
  }
}

// Get only projects marked for homepage display
export async function getHomepageProjects(): Promise<Project[]> {
  try {
    const response = await fetchContentAPI<StrapiResponse<Project[]>>(
      "/projects?filters[showOnHomepage][$eq]=true&populate=*&sort=order:asc",
    );
    return response.data || [];
  } catch (error) {
    console.warn("Failed to fetch homepage projects:", error);
    return [];
  }
}

export async function getProjectById(id: number): Promise<Project | null> {
  try {
    const response = await fetchContentAPI<StrapiResponse<Project>>(
      `/projects/${id}?populate=*`,
    );
    return response.data || null;
  } catch (error) {
    console.warn(`Failed to fetch project with ID ${id}:`, error);
    return null;
  }
}

// Blog API calls. From content Strapi
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetchContentAPI<StrapiResponse<BlogPost[]>>(
      "/blog-posts?populate=*&sort=publishedDate:desc",
    );
    return response.data || [];
  } catch (error) {
    console.warn("Failed to fetch blog posts:", error);
    return [];
  }
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  try {
    const response = await fetchContentAPI<StrapiResponse<BlogPost[]>>(
      `/blog-posts?filters[slug][$eq]=${slug}&populate=*`,
    );
    return response.data?.[0] || null;
  } catch (error) {
    console.warn(`Failed to fetch blog post with slug "${slug}":`, error);
    return null;
  }
}

// Team API calls. From main Strapi
export async function getTeamMembers(): Promise<TeamMember[]> {
  const response = await fetchAPI<StrapiResponse<TeamMember[]>>(
    "/team-members?populate=*&sort=order:asc",
  );
  return response.data || [];
}

// Page API calls. From main Strapi
export async function getPageBySlug(slug: string): Promise<Page | null> {
  const response = await fetchAPI<StrapiResponse<Page[]>>(
    `/pages?filters[slug][$eq]=${slug}&populate=*`,
  );
  return response.data?.[0] || null;
}

// Image URL helper for main Strapi
export function getStrapiImageUrl(imageUrl?: string): string | null {
  if (!imageUrl) return null;

  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  return `${STRAPI_URL}${imageUrl}`;
}

// Image URL helper for content Strapi
export function getContentStrapiImageUrl(imageUrl?: string): string | null {
  if (!imageUrl) return null;

  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  if (!CONTENT_STRAPI_URL) {
    return imageUrl;
  }

  return `${CONTENT_STRAPI_URL}${imageUrl}`;
}

// New dynamic content types
export interface SiteSettings extends StrapiAttributes {
  id: number;
  siteName: string;
  siteTagline?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    github?: string;
  };
  logo?: {
    url: string;
    alternativeText?: string;
  };
  favicon?: {
    url: string;
  };
  footerText?: string;
  copyrightText: string;
}

export interface Benefit extends StrapiAttributes {
  id: number;
  documentId: string;
  title: string;
  description: string;
  icon?: string;
  order: number;
}

export interface Vertical extends StrapiAttributes {
  id: number;
  documentId: string;
  title: string;
  description: string;
  icon?: string;
  order: number;
}

export interface MethodologyItem extends StrapiAttributes {
  id: number;
  documentId: string;
  title: string;
  description: string;
  order: number;
  stepNumber: number;
}

export interface SectionContent extends StrapiAttributes {
  id: number;
  documentId: string;
  identifier: string;
  title: string;
  content: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: {
    url: string;
    alternativeText?: string;
  };
}

export interface Intern extends StrapiAttributes {
  id: number;
  documentId: string;
  name: string;
  role: string;
  bio?: string;
  photo?: {
    url: string;
    alternativeText?: string;
  };
  linkedIn?: string;
  email?: string;
  order: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

// Site Settings API. From main Strapi
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const response = await fetchAPI<StrapiResponse<SiteSettings>>(
      "/site-setting?populate=*",
    );
    return response.data || null;
  } catch (error) {
    console.warn("Failed to fetch site settings:", error);
    return null;
  }
}

// Benefits API calls. From main Strapi
export async function getBenefits(): Promise<Benefit[]> {
  try {
    const response = await fetchAPI<StrapiResponse<Benefit[]>>(
      "/benefits?populate=*&sort=order:asc",
    );
    return response.data || [];
  } catch (error) {
    console.warn("Failed to fetch benefits:", error);
    return [];
  }
}

// Verticals API calls. From main Strapi
export async function getVerticals(): Promise<Vertical[]> {
  try {
    const response = await fetchAPI<StrapiResponse<Vertical[]>>(
      "/verticals?populate=*&sort=order:asc",
    );
    return response.data || [];
  } catch (error) {
    console.warn("Failed to fetch verticals:", error);
    return [];
  }
}

// Methodology Items API calls. From main Strapi
export async function getMethodologyItems(): Promise<MethodologyItem[]> {
  try {
    const response = await fetchAPI<StrapiResponse<MethodologyItem[]>>(
      "/methodology-items?populate=*&sort=order:asc",
    );
    return response.data || [];
  } catch (error) {
    console.warn("Failed to fetch methodology items:", error);
    return [];
  }
}

// Section Content API calls. From main Strapi
export async function getSectionContent(
  identifier: string,
): Promise<SectionContent | null> {
  try {
    const response = await fetchAPI<StrapiResponse<SectionContent[]>>(
      `/section-contents?filters[identifier][$eq]=${identifier}&populate=*`,
    );
    return response.data?.[0] || null;
  } catch (error) {
    console.warn(
      `Failed to fetch section content for identifier "${identifier}":`,
      error,
    );
    return null;
  }
}

export async function getAllSectionContents(): Promise<SectionContent[]> {
  const response = await fetchAPI<StrapiResponse<SectionContent[]>>(
    "/section-contents?populate=*",
  );
  return response.data || [];
}

// Interns API calls. From main Strapi (collection may be absent — 404 yields empty list without dev overlay noise)
export async function getInterns(activeOnly = true): Promise<Intern[]> {
  try {
    const filters = activeOnly ? "&filters[isActive][$eq]=true" : "";
    const response = await fetchAPI<StrapiResponse<Intern[]>>(
      `/interns?populate=photo&sort=order:asc${filters}`,
      { notFoundReturnsNull: true },
    );
    return response.data || [];
  } catch (error) {
    console.warn("Failed to fetch interns:", error);
    return [];
  }
}

export async function getIntern(id: number): Promise<Intern | null> {
  try {
    const response = await fetchAPI<StrapiResponse<Intern>>(
      `/interns/${id}?populate=photo`,
      { notFoundReturnsNull: true },
    );
    return response.data || null;
  } catch (error) {
    console.warn(`Failed to fetch intern ${id}:`, error);
    return null;
  }
}

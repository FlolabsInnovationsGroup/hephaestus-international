// Brand configuration for dynamic branding based on domain
// Supports both hephaestus.international and efestos.international

export interface BrandConfig {
  name: string                    // "Hephaestus" or "Efestos"
  fullName: string                // "Hephaestus Labs Institute" or "Efestos Labs Institute"
  tagline: string                 // Full institute name
  domain: string                  // "hephaestus.international" or "efestos.international"
  email: string                   // Contact email
  websiteUrl: string              // Main website URL
}

export const brands: Record<string, BrandConfig> = {
  hephaestus: {
    name: 'Hephaestus',
    fullName: 'Hephaestus Labs Institute',
    tagline: 'Hephaestus Labs Institute of Experiential Learning Center of Excellence',
    domain: 'hephaestus.international',
    email: 'info@hephaestus.international',
    websiteUrl: 'https://hephaestusinternational.com/',
  },
  efestos: {
    name: 'Efestos',
    fullName: 'Efestos Labs Institute',
    tagline: 'Efestos Labs Institute of Experiential Learning Center of Excellence',
    domain: 'efestos.international',
    email: 'info@efestos.international',
    websiteUrl: 'https://efestos.international/',
  },
}

// Default brand (used for SSR and fallback)
export const defaultBrand = brands.hephaestus

/**
 * Detect which brand to use based on hostname
 * Works on both server and client side
 */
export function getBrandFromHostname(hostname: string): BrandConfig {
  const lowercaseHost = hostname.toLowerCase()
  
  if (lowercaseHost.includes('efestos')) {
    return brands.efestos
  }
  
  // Default to Hephaestus for all other cases
  // (including localhost, hephaestus.*, etc.)
  return brands.hephaestus
}

/**
 * Get brand configuration on the server side
 * Uses headers to detect the hostname
 */
export async function getServerBrand(): Promise<BrandConfig> {
  // Dynamic import to avoid issues with server/client
  const { headers } = await import('next/headers')
  
  try {
    const headersList = await headers()
    const host = headersList.get('host') || ''
    console.log('[Server Brand Detection] Host:', host)
    const brand = getBrandFromHostname(host)
    console.log('[Server Brand Detection] Detected brand:', brand.name)
    return brand
  } catch (error) {
    // Fallback for static generation or when headers aren't available
    console.log('[Server Brand Detection] Error, using default brand:', error)
    return defaultBrand
  }
}

/**
 * Helper to replace brand-specific text in content
 * Useful for transforming CMS content that might contain hardcoded brand names
 */
export function transformBrandContent(content: string, brand: BrandConfig): string {
  if (brand.name === 'Hephaestus') {
    // No transformation needed for default brand
    return content
  }
  
  // Replace Hephaestus with Efestos (case-insensitive)
  return content
    .replace(/Hephaestus Labs Institute/gi, `${brand.name} Labs Institute`)
    .replace(/Hephaestus R&D/gi, `${brand.name} R&D`)
    .replace(/Hephaestus/gi, brand.name)
    .replace(/hephaestus\.international/gi, brand.domain)
    .replace(/info@hephaestus\.international/gi, brand.email)
    .replace(/hephaestusinternational\.com/gi, brand.domain)
}

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { BrandConfig, defaultBrand, getBrandFromHostname } from '@/lib/branding'

interface BrandContextType {
  brand: BrandConfig
  isLoading: boolean
}

const BrandContext = createContext<BrandContextType>({
  brand: defaultBrand,
  isLoading: true,
})

export function useBrand() {
  return useContext(BrandContext)
}

interface BrandProviderProps {
  children: ReactNode
  initialBrand?: BrandConfig
}

export function BrandProvider({ children, initialBrand }: BrandProviderProps) {
  const [brand, setBrand] = useState<BrandConfig>(initialBrand || defaultBrand)
  const [isLoading, setIsLoading] = useState(!initialBrand)

  useEffect(() => {
    // Detect brand from client-side hostname
    if (typeof window !== 'undefined') {
      const detectedBrand = getBrandFromHostname(window.location.hostname)
      setBrand(detectedBrand)
      setIsLoading(false)
    }
  }, [])

  return (
    <BrandContext.Provider value={{ brand, isLoading }}>
      {children}
    </BrandContext.Provider>
  )
}

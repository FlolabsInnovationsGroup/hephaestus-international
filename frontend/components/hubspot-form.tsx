'use client'

import { useEffect, useRef, useState } from 'react'

interface HubSpotFormProps {
  readonly portalId?: string
  readonly formId: string
  readonly region?: string
  readonly targetId?: string
}

declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (config: {
          portalId: string
          formId: string
          region: string
          target: string
          onFormReady?: () => void
        }) => void
      }
    }
  }
}

export function HubSpotForm({
  portalId = '45023159',
  formId,
  region = 'na1',
  targetId = 'hubspot-form',
}: HubSpotFormProps) {
  const formRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let attempts = 0
    const maxAttempts = 50 // 5 seconds max

    const checkAndCreateForm = () => {
      if (globalThis.window?.hbspt?.forms) {
        try {
          globalThis.window.hbspt.forms.create({
            portalId,
            formId,
            region,
            target: `#${targetId}`,
            onFormReady: () => {
              setLoaded(true)
            }
          })
        } catch (error) {
          console.error('Error creating HubSpot form:', error)
        }
      } else if (attempts < maxAttempts) {
        attempts++
        setTimeout(checkAndCreateForm, 100)
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(checkAndCreateForm, 100)

    return () => {
      clearTimeout(timer)
      // Clean up form on unmount
      const formContainer = document.getElementById(targetId)
      if (formContainer) {
        formContainer.innerHTML = ''
      }
    }
  }, [portalId, formId, region, targetId])

  return (
    <div className="hubspot-form-wrapper">
      <div id={targetId} ref={formRef} className="hubspot-form-container" />
      {!loaded && (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading application form...</p>
        </div>
      )}
    </div>
  )
}

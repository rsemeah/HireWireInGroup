"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react"
import { useEffect } from "react"
import { useUser } from "./user-provider"

// Initialize PostHog only on client side
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false, // We handle this manually for better control
    capture_pageleave: true,
    autocapture: {
      dom_event_allowlist: ["click", "submit"],
      element_allowlist: ["button", "a", "form"],
    },
  })
}

// User identification component
function PostHogUserIdentify() {
  const { user } = useUser()
  const posthogClient = usePostHog()

  useEffect(() => {
    if (user && posthogClient) {
      posthogClient.identify(user.id, {
        email: user.email,
        created_at: user.created_at,
      })
    } else if (!user && posthogClient) {
      posthogClient.reset()
    }
  }, [user, posthogClient])

  return null
}

// Page view tracker component
function PostHogPageView() {
  const posthogClient = usePostHog()

  useEffect(() => {
    if (posthogClient) {
      posthogClient.capture("$pageview")
    }
  }, [posthogClient])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Don't render provider if no key configured
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>
  }

  return (
    <PHProvider client={posthog}>
      <PostHogUserIdentify />
      <PostHogPageView />
      {children}
    </PHProvider>
  )
}

// Framework-only event tracking - no product-specific events
export const trackEvent = {
  // Generic events only
  error: (props: { error_type: string; message: string; context?: Record<string, unknown> }) => {
    posthog.capture("error_occurred", props)
  },
}
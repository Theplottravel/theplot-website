"use client"

import Script from "next/script"
import { useEffect } from "react"
import { usePathname } from "next/navigation" // Import usePathname
import { useReportWebVitals } from "next/web-vitals"

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
  }
}

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  const pathname = usePathname() // Get the current pathname

  useReportWebVitals((metric) => {
    if (window.gtag) {
      window.gtag("event", metric.name, {
        value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value), // values must be integers
        event_label: metric.id, // id unique to current page load
        non_interaction: true, // avoids affecting bounce rate.
      })
    }
  })

  useEffect(() => {
    if (window.gtag) {
      // Send a page_view event on every route change
      window.gtag("config", gaId, {
        page_path: pathname,
      })
    }
  }, [pathname, gaId]) // Re-run effect when pathname or gaId changes

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  )
}

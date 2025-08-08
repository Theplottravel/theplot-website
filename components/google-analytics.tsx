"use client"

import Script from "next/script"
import { useReportWebVitals } from "next/web-vitals"

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void // Changed any[] to unknown[]
  }
}

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  useReportWebVitals((metric) => {
    if (window.gtag) {
      window.gtag("event", metric.name, {
        value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value), // values must be integers
        event_label: metric.id, // id unique to current page load
        non_interaction: true, // avoids affecting bounce rate.
      })
    }
  })

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

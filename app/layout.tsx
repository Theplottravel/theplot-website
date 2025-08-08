import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { GoogleAnalytics } from "@//components/google-analytics"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "The Plot - Join the new age of travel documenting",
  description: "Find, plot, and remember your travels. Made by travellers for travellers for easy sharing of routes, hostels, activities and more.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        {children}
        <GoogleAnalytics gaId="G-Z3KQ7VBFV4" />
      </body>
    </html>
  )
}
import Link from "next/link"
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FFFFF2]">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#4EB15B] hover:text-[#4EB15B]/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-[#4EB15B] mb-8">Privacy Policy for The Plot</h1>
          <p className="text-gray-600 mb-8">
            <em>Last updated: 27 May 2025</em>
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
            This Privacy Policy {`("Policy")`} describes the manner in which The Plot ("Company," "we," "us," or "our")
            collects, processes, and protects personal data when users ("you," "your") access and use the Plot mobile
            application ("App"). By accessing or using the App, you acknowledge and consent to the practices set forth
              in this Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Data Collection</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              While using Our Service, We may ask You to provide Us with certain personally identifiable information
              that can be used to contact or identify You. Personally identifiable information may include, but is not
              limited to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Name</li>
              <li>Email address</li>
              <li>Location data</li>
              <li>Trip details</li>
              <li>Age</li>
              <li>Sex</li>
            </ul>
          </section>

          <div className="mt-12 p-6 bg-[#4EB15B]/5 rounded-lg">
            <p className="text-gray-700">
              If you have any questions about this Privacy Policy, contact us at{" "}
              <a href="mailto:theplot.travel@gmail.com" className="text-[#4EB15B] hover:underline">
                theplot.travel@gmail.com
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
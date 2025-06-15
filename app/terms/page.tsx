import Link from "next/link"
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-[#4EB15B] mb-8">Terms & Conditions</h1>
          <p className="text-gray-600 mb-8">
            <em>Last updated: 27 May 2025</em>
          </p>

          <section className="mb-8">
            <p className="text-gray-700 leading-relaxed">
            Welcome to the Plot {`("App")`}. These Terms and Conditions {`("Terms")`} govern your access and use of The Plot,
            operated by theplot LTD {`("Company," "we," "us," or "our")`} in the United Kingdom. By using the App, you
              agree to be bound by these Terms. If you do not agree, you must discontinue using the App immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. User Eligibility</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You must be at least 13 years old to create an account.</li>
              <li>By using the App, you confirm that you are legally capable of entering into these Terms.</li>
            </ul>
          </section>

          <div className="mt-12 p-6 bg-[#4EB15B]/5 rounded-lg">
            <p className="text-gray-700">
              If you have any questions about these Terms & Conditions, contact us at{" "}
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
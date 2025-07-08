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
              Welcome to ThePlot ("App"). These Terms and Conditions ("Terms") govern your access and use of ThePlot, operated by ThePlot LTD ("Company," "we," "us," or "our") in the United Kingdom. By using the App, you agree to be bound by these Terms. If you do not agree, you must discontinue using the App immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. User Eligibility</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You must be at least 13 years old to create an account.</li>
              <li>By using the App, you confirm that you are legally capable of entering into these Terms.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. User Responsibilities</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide accurate and up-to-date information when creating an account.</li>
              <li>Use the App for lawful purposes only.</li>
              <li>Refrain from posting illegal, defamatory, abusive, or misleading content.</li>
              <li>Not submit fake travel reviews, spam, or deceptive content.</li>
              <li>Ensure that all uploaded content complies with applicable laws and regulations.</li>
            </ul>
            <p className="text-gray-700 mt-2">Failure to comply may result in suspension or termination of your account.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Content Ownership</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Users retain ownership of any content uploaded to the App.</li>
              <li>By posting, you grant us a non-exclusive, royalty-free licence to use, reproduce, and display your content.</li>
              <li>By submitting place information, you grant us the right to include it in our shared database of places for the benefit of all users.</li>
              <li>We may remove content that violates these Terms.</li>
              <li>Users can report inappropriate content in app for review within 48 hours.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Limitation of Liability</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>We are not responsible for user-generated content accuracy.</li>
              <li>We do not guarantee uninterrupted service.</li>
              <li>We are not liable for issues caused by third-party services like Mapbox or Google Places API.</li>
              <li>To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages.</li>
              <li>Jurisdiction limitations may alter some of these disclaimers.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. “AS IS” and “AS AVAILABLE” Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">The service is provided “as is” without warranties of any kind. We do not guarantee that the service will meet expectations or be error-free.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Service Availability</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>The app and its features may not always be available.</li>
              <li>We may modify or discontinue features at any time.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Prohibited Activities</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>No hate speech, harassment, or unlawful activity.</li>
              <li>No attempts to disrupt or hack the service.</li>
              <li>No uploading offensive or explicit content.</li>
            </ul>
            <p className="text-gray-700 mt-2">Violations may result in account suspension or legal action.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Copyright and Intellectual Property</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You must own or have rights to all uploaded content.</li>
              <li>Report infringements to emilia@theplot.world</li>
              <li>We may remove infringing content and suspend repeat offenders.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Location Data and Privacy</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>We collect and use location data to enhance experience.</li>
              <li>Opt out of location tracking via app settings.</li>
              <li>We are not liable for risks of real-time location sharing.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Account Termination</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You may delete your account at any time.</li>
              <li>We may suspend or terminate accounts for policy violations.</li>
              <li>We may restrict access at our discretion.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Advertising and Sponsored Content</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Sponsored content may appear in the app.</li>
              <li>It will be clearly labelled as such.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Law Enforcement Requests</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>User data may be disclosed to authorities when legally required.</li>
              <li>UK laws govern these Terms.</li>
              <li>EU residents retain their local legal rights.</li>
              <li>You confirm you are not on any US restricted list.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Dispute Resolution</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Please attempt informal resolution by contacting us first.</li>
              <li>Only the original English version of these Terms is valid.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Modifications</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>We may modify these Terms at any time.</li>
              <li>Continued use constitutes acceptance of changes.</li>
              <li>We encourage regular review of these Terms.</li>
            </ul>
          </section>

          <div className="mt-12 p-6 bg-[#4EB15B]/5 rounded-lg">
            <p className="text-gray-700">
              If you have any questions about these Terms & Conditions, contact us at{' '}
              <a href="mailto:emilia@theplot.world" className="text-[#4EB15B] hover:underline">
                emilia@theplot.world
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

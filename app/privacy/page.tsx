import Link from "next/link"
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FFFFF2]">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[##17cd1c] hover:text-[##17cd1c]/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-[##17cd1c] mb-8">Privacy Policy for The Plot</h1>
          <p className="text-gray-600 mb-8">
            <em>Last updated: 8 July 2025</em>
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              This Privacy Policy ("Policy") describes the manner in which ThePlot LTD ("Company," "we," "us," or "our") collects, processes, and protects personal data when users ("you," "your") access and use ThePlot mobile application ("App"). By accessing or using the App, you acknowledge and consent to the practices set forth in this Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Data Collection</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
     While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:
              </p>
  <ul className="list-disc pl-6 text-gray-700 space-y-2">
    <li>Name</li>
    <li>Email address</li>
    <li>Location data</li>
    <li>Trip details</li>
    <li>Age</li>
    <li>Sex</li>
  </ul>
  <p className="text-gray-700 leading-relaxed mt-4">
    We respect your privacy — we do <strong>not sell, rent, or trade your personal information (such as your name or email address) to third parties</strong>. Your personally identifiable information is used solely to provide and improve the App, and to communicate with you when necessary.
  </p>
</section>

<section className="mb-8">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Purpose and Use of Data</h2>
  <ul className="list-disc pl-6 text-gray-700 space-y-2">
    <li>To provide and improve the App’s functionality and services.</li>
    <li>To display trip details and user-generated content on maps.</li>
    <li>To facilitate social interactions within the App.</li>
    <li>To analyse user engagement and improve the App experience.</li>
    <li>To contact You regarding service updates and features (if you have provided your email).</li>
    <li>For analytics, trends, marketing improvements, and your experience.</li>
  </ul>
</section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Photo Storage and User Content</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Photos are stored on Google Firebase.</li>
              <li>Photos are kept according to retention policies.</li>
              <li>Photos are not edited beyond necessary performance optimisations.</li>
              <li>Visibility is governed by your privacy settings.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Usage</h2>
            <p className="text-gray-700 leading-relaxed">
              Usage Data includes IP addresses, browser types, visit dates and durations, and device identifiers. This may be collected automatically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Sharing and Third Parties</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Google Places API, Mapbox for maps, analytics services, and social media platforms.</li>
              <li>Business transfers and partnerships.</li>
              <li>Only shared with your consent or legal basis.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. User Rights</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Access, correct, delete, or object to data usage.</li>
              <li>Request actions to be done in app or by emailing emilia@theplot.world</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              Data is retained as long as necessary for the purposes in this policy and as required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Delete Your Personal Data</h2>
            <p className="text-gray-700 leading-relaxed">
              You may delete your data via your account or request deletion directly. Some data may be retained where legally necessary.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              We do not knowingly collect data from children under 13. Contact us if you believe this has occurred.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Legal Compliance</h2>
            <p className="text-gray-700 leading-relaxed">
              We comply with GDPR and relevant laws. Data may be disclosed to comply with legal obligations or protect safety and rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Business Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              If we are acquired or merged, your data may be transferred to the new entity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. External Links</h2>
            <p className="text-gray-700 leading-relaxed">
              We are not responsible for privacy policies or content of third-party websites linked from our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Changes</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this policy. Changes are posted on this page with the updated date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Device Permissions</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Camera access: for taking and uploading photos.</li>
              <li>Photo Library: to enable uploads, with your permission.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
  We do not collect or track your real-time GPS location. Any location data stored in the App is entered by you manually, solely for the purpose of displaying your travel history.
</p>
          </section>

          <div className="mt-12 p-6 bg-[#4EB15B]/5 rounded-lg">
            <p className="text-gray-700">
              If you have any questions about this Privacy Policy, contact us at{' '}
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

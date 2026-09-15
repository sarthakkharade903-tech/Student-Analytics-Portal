import Link from 'next/link'
import { ArrowLeft, Scale, ShieldAlert, CheckCircle, Mail } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | StudentIQ',
  description: 'StudentIQ Terms of Service governing platform usage for coaching centers, tutors, and parents.',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Scale className="w-4 h-4 text-blue-400" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">StudentIQ Legal</span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4">
            <Scale className="w-3 h-3" />
            Terms of Use
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Terms of Service
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Effective Date: September 15, 2026 &bull; Last Updated: September 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
        <section className="space-y-4">
          <p>
            Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using the <strong className="text-white">StudentIQ</strong> portal and mobile applications operated by StudentIQ (&ldquo;us&rdquo;, &ldquo;we&rdquo;, or &ldquo;our&rdquo;).
          </p>
          <p>
            By creating an account, logging in, or accessing StudentIQ services, you agree to be legally bound by these Terms. If you disagree with any part of the terms, you may not access the service.
          </p>
        </section>

        {/* Section 1: Permitted Use */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            1. Authorized Use &amp; Account Types
          </h2>
          <p>
            StudentIQ provides distinct access portals based on user role:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>
              <strong className="text-slate-200">Coaching Administrators:</strong> Responsible for maintaining the confidentiality of admin credentials, ensuring accurate student rosters, marks entry, and authorized staff access codes.
            </li>
            <li>
              <strong className="text-slate-200">Students &amp; Parents:</strong> Permitted to access and view their respective academic records, attendance percentages, report cards, and fee receipts through verified roll numbers and authentication codes.
            </li>
          </ul>
        </section>

        {/* Section 2: Data Accuracy & Responsibility */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            2. Data Integrity &amp; Institute Responsibilities
          </h2>
          <p>
            Coaching institutes represent and warrant that they possess all necessary consents to upload and manage student names, parent contact numbers, and test scores on StudentIQ. The institute is solely responsible for the accuracy and completeness of marks and fee structures entered into the portal.
          </p>
        </section>

        {/* Section 3: Prohibited Conduct */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            3. Prohibited Activities
          </h2>
          <p>Users agree not to:</p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-400">
            <li>Attempt to bypass authentication, brute-force access codes, or access records belonging to other institutes.</li>
            <li>Use any automated scraping, crawling, or denial-of-service tools against the platform.</li>
            <li>Reverse engineer, decompile, or tamper with the application bundle or underlying API endpoints.</li>
            <li>Upload malicious code, viruses, or corrupted CSV files designed to harm system availability.</li>
          </ul>
        </section>

        {/* Section 4: Service Availability & Disclaimer */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            4. Service Availability &amp; Modifications
          </h2>
          <p>
            We strive to ensure uninterrupted service; however, the service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. Scheduled maintenance, updates, or third-party infrastructure incidents (e.g., cloud provider outages) may cause temporary downtime without prior notice.
          </p>
        </section>

        {/* Section 5: Intellectual Property */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            5. Intellectual Property
          </h2>
          <p>
            The StudentIQ brand, interface designs, analytics algorithms, and software code are the intellectual property of StudentIQ. Coaching institutes retain full ownership of their proprietary institute logos, custom exam papers, and student records uploaded to the service.
          </p>
        </section>

        {/* Section 6: Termination */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            6. Account Termination
          </h2>
          <p>
            We reserve the right to suspend or terminate access to any account that violates these Terms or engages in unauthorized activity. Coaching centers may terminate their subscription at any time and request full export or deletion of their stored data.
          </p>
        </section>

        {/* Section 7: Contact */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            7. Contact Information
          </h2>
          <p className="text-slate-400 text-sm">
            If you have questions regarding these Terms of Service, please contact:
          </p>
          <div className="text-slate-200 font-medium text-sm space-y-1">
            <p>StudentIQ Support &amp; Operations</p>
            <p>
              Email:{' '}
              <a href="mailto:studentiqteam@gmail.com" className="text-blue-400 hover:underline">
                studentiqteam@gmail.com
              </a>
            </p>
            <p>Phone: +91 7385519619 / +91 9067290164</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} StudentIQ. All rights reserved.</p>
      </footer>
    </div>
  )
}

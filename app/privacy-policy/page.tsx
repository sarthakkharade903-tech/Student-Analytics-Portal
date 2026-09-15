import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Lock, EyeOff, UserCheck, Mail, Database, Smartphone } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | StudentIQ',
  description: 'StudentIQ Privacy Policy detailing exact data handling, student records, portal authentication, and data protection practices.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Header / Nav */}
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
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">StudentIQ Legal</span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4">
            <Lock className="w-3 h-3" />
            Play Store &amp; Regulatory Compliant
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Effective Date: September 15, 2026 &bull; Last Updated: September 2026
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
        {/* Intro */}
        <section className="space-y-4">
          <p>
            Welcome to <strong className="text-white">StudentIQ</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). StudentIQ provides performance analytics, student record management, and parent communication tools tailored for coaching institutes, educators, students, and parents.
          </p>
          <p>
            This Privacy Policy transparently describes how we collect, store, authenticate, and process academic and personal records through the StudentIQ web portal, mobile application, and related software interfaces.
          </p>
        </section>

        {/* Core Principles Cards */}
        <div className="grid sm:grid-cols-3 gap-4 my-8">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <EyeOff className="w-5 h-5 text-blue-400 mb-2" />
            <h2 className="font-semibold text-white text-sm">No Advertising or Profiling</h2>
            <p className="text-xs text-slate-400 mt-1">
              We never show third-party ads, sell personal information, or monetize student profiles.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <Lock className="w-5 h-5 text-emerald-400 mb-2" />
            <h2 className="font-semibold text-white text-sm">TLS/HTTPS Encryption</h2>
            <p className="text-xs text-slate-400 mt-1">
              All communications between your device, the app, and our servers are encrypted in transit.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <UserCheck className="w-5 h-5 text-indigo-400 mb-2" />
            <h2 className="font-semibold text-white text-sm">Educational Scope</h2>
            <p className="text-xs text-slate-400 mt-1">
              Data is maintained solely for authorized coaching record-keeping and student progress tracking.
            </p>
          </div>
        </div>

        {/* Section 1: Role Definitions */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            1. Roles &amp; Data Stewardship
          </h2>
          <p>
            To understand how your data is handled, please note the distinction of roles:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>
              <strong className="text-slate-200">Coaching Institute (Data Custodian):</strong> The educational coaching center or tutor who registers on StudentIQ is the primary custodian of student and parent records. The institute collects student details and uploads test scores, batches, and attendance into the platform.
            </li>
            <li>
              <strong className="text-slate-200">StudentIQ (Platform Provider):</strong> StudentIQ acts as the technology and software provider, processing and storing the data strictly on behalf of and according to the instructions of the coaching institute.
            </li>
            <li>
              <strong className="text-slate-200">Students and Parents (End Users):</strong> Individuals authorized by their coaching institute to access student scorecards, rankings, attendance logs, and fee receipts.
            </li>
          </ul>
        </section>

        {/* Section 2: Information Collected */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            2. Information Collected
          </h2>
          <p>
            We collect and process only the minimal information required to deliver coaching management and analytics functionality:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>
              <strong className="text-slate-200">Coaching Center Account Information:</strong> Institute name, administrator/teacher name, email address, phone number, location, and uploaded academy logo.
            </li>
            <li>
              <strong className="text-slate-200">Student Profiles &amp; Academic Data:</strong> Student full name, roll number, class/standard (e.g. 11th, 12th), assigned batch (e.g. JEE, NEET, MHT-CET), subject-wise marks, test dates, total scores, percentile rankings, and attendance history uploaded by the institute.
            </li>
            <li>
              <strong className="text-slate-200">Parent Contact Information:</strong> Parent phone number provided by the coaching institute, used for portal authentication and message dispatch.
            </li>
            <li>
              <strong className="text-slate-200">Fee Records (Optional):</strong> Fee installment logs, payment modes, and receipt timestamps recorded by the coaching administration.
            </li>
          </ul>
        </section>

        {/* Section 3: Exact Authentication Mechanisms */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-400" />
            3. Authentication &amp; Access Mechanisms
          </h2>
          <p>
            Access to StudentIQ is partitioned based on user role using specific verification credentials:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>
              <strong className="text-slate-200">Coaching Administrators &amp; Staff:</strong> Authenticate using an account email and secure password managed through Supabase Authentication.
            </li>
            <li>
              <strong className="text-slate-200">Student Portal (/portal):</strong> Students log in by verifying their institute-registered <strong className="text-white">Roll Number</strong> and associated <strong className="text-white">Parent Phone Number</strong>. No email address or public self-registration is required.
            </li>
            <li>
              <strong className="text-slate-200">Parent Portal (/parent/login):</strong> Parents authenticate using their <strong className="text-white">Parent Phone Number</strong> and an institute-assigned <strong className="text-white">PIN</strong>.
            </li>
            <li>
              <strong className="text-slate-200">Staff Feature Lock PINs:</strong> Sensitive modules within the coaching center dashboard (such as fee structures) can be optionally guarded by an institute-configured access PIN.
            </li>
          </ul>
        </section>

        {/* Section 4: Cookies and Session Technologies */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            4. Cookies &amp; Session Storage Technologies
          </h2>
          <p>
            StudentIQ uses essential first-party HTTP-only cookies solely for user session management and security. We do not use third-party tracking or advertising cookies:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>
              <code className="text-blue-300 text-xs bg-slate-900 px-2 py-0.5 rounded">portal_session</code>: A secure, HTTP-only cookie storing a verified student session identifier for up to 30 days.
            </li>
            <li>
              <code className="text-blue-300 text-xs bg-slate-900 px-2 py-0.5 rounded">parent_token</code>: A cryptographically signed, HTTP-only JWT token maintaining parent session authorization for up to 7 days.
            </li>
            <li>
              <code className="text-blue-300 text-xs bg-slate-900 px-2 py-0.5 rounded">sb-*-auth-token</code>: Standard session cookies utilized by Supabase to maintain coaching administrator authentication.
            </li>
          </ul>
        </section>

        {/* Section 5: WhatsApp & Communication Dispatches */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            5. WhatsApp &amp; Communication Dispatches
          </h2>
          <p>
            When a coaching institute chooses to dispatch test scorecards or attendance updates to parents:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-400">
            <li>The message template formats relevant academic details (including student name, test name, marks obtained, percentage/rank, and attendance status).</li>
            <li>Dispatches occur strictly via institute-directed channels to the parent phone number on record.</li>
            <li>StudentIQ does not use student or parent phone numbers for marketing promotions, telemarketing, or external broadcasts.</li>
          </ul>
        </section>

        {/* Section 6: AI & Automated Analytics */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            6. Automated Analytics &amp; AI Processing Status
          </h2>
          <p>
            All performance percentiles, subject averages, highest score comparisons, and attendance metrics are computed deterministically via our internal server-side algorithms.
          </p>
          <p className="text-slate-400">
            <strong className="text-slate-200">Current AI Status:</strong> External third-party AI text-generation models and third-party AI pipelines are currently <strong className="text-white">inactive and disabled</strong>. Student and academic records are not transmitted to third-party artificial intelligence services. Should open-source or licensed AI assistance be reintroduced in future updates, this policy will explicitly specify the exact model provider and processing boundaries.
          </p>
        </section>

        {/* Section 7: Data Storage & Technical Safeguards */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            7. Infrastructure &amp; Technical Security
          </h2>
          <p>
            We implement sensible, industry-standard security safeguards to protect user records:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>
              <strong className="text-slate-200">Transmission Encryption:</strong> All data exchanged between the browser/app and server is encrypted using industry-standard Transport Layer Security (TLS/HTTPS).
            </li>
            <li>
              <strong className="text-slate-200">Multi-Tenant Isolation:</strong> Institute data is partitioned using coaching center identification scoping (<code className="text-blue-300 text-xs bg-slate-900 px-1.5 py-0.5 rounded">coaching_center_id</code>) and authenticated server-side API validation on our Supabase (PostgreSQL) backend.
            </li>
            <li>
              <strong className="text-slate-200">Storage Buckets:</strong> Institute academy logos are stored in secured cloud storage buckets.
            </li>
          </ul>
        </section>

        {/* Section 8: Retention & Deletion */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            8. Data Retention &amp; User Deletion Rights
          </h2>
          <p>
            Student and parent academic records are retained for the duration of the coaching institute&apos;s active academic cycle or enrollment term.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>
              <strong className="text-slate-200">Institute Self-Service Deletion:</strong> Institute administrators can remove student profiles, marks sheets, and batch records directly from their management dashboard at any time.
            </li>
            <li>
              <strong className="text-slate-200">Direct Deletion Requests:</strong> Parents, students, or institutes can request the complete deletion of their records by sending an email with their Roll Number and Coaching Center name to{' '}
              <a href="mailto:studentiqteam@gmail.com" className="text-blue-400 underline hover:text-blue-300">
                studentiqteam@gmail.com
              </a>
              . Requests are verified and acknowledged within 7 business days, and permanently purged from active databases within 30 business days.
            </li>
          </ul>
        </section>

        {/* Section 9: Contact */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            9. Contact &amp; Grievance Redressal
          </h2>
          <p className="text-slate-400 text-sm">
            For questions, policy clarification, or privacy grievances regarding StudentIQ, please contact our team:
          </p>
          <div className="text-slate-200 font-medium text-sm space-y-1">
            <p>StudentIQ Privacy &amp; Data Compliance</p>
            <p>
              Email:{' '}
              <a href="mailto:studentiqteam@gmail.com" className="text-blue-400 hover:underline">
                studentiqteam@gmail.com
              </a>
            </p>
            <p>Phone: +91 7385519619 &bull; +91 9067290164</p>
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

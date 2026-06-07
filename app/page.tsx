import Link from 'next/link'
import { ArrowRight, BarChart3, Bell, CheckCircle, Shield, Zap } from 'lucide-react'

const features = [
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description: 'Track student progress across all tests with beautiful charts and insights.',
  },
  {
    icon: Bell,
    title: 'Automated Parent Updates',
    description: 'Send performance reports to parents automatically — no manual calls needed.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Enterprise-grade security ensures your student data stays safe at all times.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Built for speed. Get insights in seconds, not hours.',
  },
]

const stats = [
  { value: '500+', label: 'Coaching Institutes' },
  { value: '50K+', label: 'Students Tracked' },
  { value: '2M+', label: 'Reports Sent' },
  { value: '98%', label: 'Parent Satisfaction' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] glass-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg tracking-tight">
                Parent Analytics Portal
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-all duration-200 hover:shadow-lg hover:shadow-[oklch(0.65_0.22_265/0.3)]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 grid-pattern opacity-50 pointer-events-none" />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[oklch(0.65_0.22_265/0.08)] rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--secondary)] text-xs text-[var(--muted-foreground)] mb-8 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Now available for all coaching institutes
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
            Keep Parents{' '}
            <span className="gradient-text">Informed</span>
            <br />
            Automatically
          </h1>

          <p className="text-lg sm:text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Help coaching institutes track student performance and keep parents
            updated without manual calls. Built for JEE, NEET, MHT-CET and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              id="cta-signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[var(--primary)] text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-200 hover:gap-3 glow-primary text-base"
            >
              Start for Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              id="cta-login"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-[var(--border)] text-[var(--foreground)] font-medium rounded-xl hover:bg-[var(--secondary)] transition-all duration-200 text-base"
            >
              Sign In
            </Link>
          </div>

          <p className="mt-5 text-xs text-[var(--muted-foreground)]">
            No credit card required · Free for up to 50 students
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 border-y border-[var(--border)]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything your institute needs
            </h2>
            <p className="text-[var(--muted-foreground)] text-lg max-w-xl mx-auto">
              A complete platform to manage students, track performance, and delight parents.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="glass-card rounded-2xl p-6 hover:border-[oklch(0.65_0.22_265/0.5)] transition-all duration-300 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[oklch(0.65_0.22_265/0.15)] flex items-center justify-center mb-4 group-hover:bg-[oklch(0.65_0.22_265/0.25)] transition-colors">
                    <Icon className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                    {f.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center glass-card rounded-3xl p-12 glow-primary">
          <div className="flex justify-center mb-4">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400 text-xl">★</span>
            ))}
          </div>
          <blockquote className="text-lg italic text-[var(--muted-foreground)] mb-6">
            &ldquo;We reduced parent complaint calls by 80% in the first month. Parents love the automated updates.&rdquo;
          </blockquote>
          <p className="text-sm font-medium mb-8">— Director, Apex Coaching Institute, Pune</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--primary)] text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-200 glow-primary text-base"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[var(--primary)] flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium">Parent Analytics Portal</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            All systems operational
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            © 2026 Parent Analytics Portal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

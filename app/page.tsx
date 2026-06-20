'use client'

import Link from 'next/link'
import Image from 'next/image'
import RequestDemoModal from '@/components/RequestDemoModal'
import {
  ArrowRight,
  BarChart3,
  Users,
  FileSpreadsheet,
  TrendingUp,
  CalendarCheck,
  LayoutDashboard,
  Lightbulb,
  Phone,
  Mail,
  CheckCircle2,
  MessageSquare,
  LineChart,
  BookOpen,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

/* ─────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────── */
const features = [
  {
    icon: Users,
    title: 'Student Management',
    desc: 'Store and manage student records efficiently.',
    color: '#2563eb',
    bg: '#eff6ff',
  },
  {
    icon: FileSpreadsheet,
    title: 'Excel Upload',
    desc: 'Import students and test data in seconds.',
    color: '#0d9488',
    bg: '#f0fdfa',
  },
  {
    icon: BarChart3,
    title: 'Test Analytics',
    desc: 'Analyze performance across subjects and tests.',
    color: '#4f46e5',
    bg: '#eef2ff',
  },
  {
    icon: CalendarCheck,
    title: 'Attendance Tracking',
    desc: 'Monitor attendance trends across batches.',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    icon: LayoutDashboard,
    title: 'Parent Dashboard',
    desc: 'Allow parents to stay informed and updated.',
    color: '#0891b2',
    bg: '#ecfeff',
  },
  {
    icon: TrendingUp,
    title: 'Progress Insights',
    desc: 'Track academic improvement over time.',
    color: '#059669',
    bg: '#ecfdf5',
  },
]

const values = [
  {
    icon: MessageSquare,
    title: 'Reduce Manual Parent Follow-Ups',
    desc: 'Parents access real-time performance data without phone calls.',
  },
  {
    icon: LineChart,
    title: 'Performance Reports in One Place',
    desc: 'All test data, attendance, and analytics in a single dashboard.',
  },
  {
    icon: TrendingUp,
    title: 'Track Student Growth Easily',
    desc: 'Monitor each student\'s academic trajectory over time.',
  },
  {
    icon: CheckCircle2,
    title: 'Better Parent Communication',
    desc: 'Keep parents informed automatically through a dedicated login.',
  },
]

const steps = [
  {
    num: '01',
    title: 'Add Students',
    desc: 'Register students with batch, subject and contact details.',
    icon: Users,
  },
  {
    num: '02',
    title: 'Upload Test Results',
    desc: 'Import scores via Excel — no manual data entry needed.',
    icon: FileSpreadsheet,
  },
  {
    num: '03',
    title: 'Generate Analytics',
    desc: 'Instant charts, rankings, and performance breakdowns.',
    icon: BarChart3,
  },
  {
    num: '04',
    title: 'Parents View Performance',
    desc: 'Parents log in and track their child\'s progress anytime.',
    icon: LayoutDashboard,
  },
]

/* ─────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="sap-root">

      {/* ══ NAVBAR ══════════════════════════════════════════════ */}
      <nav className="sap-nav">
        <div className="sap-container sap-nav-inner">
          <Link href="/" className="sap-logo">
            <div className="sap-logo-icon">
              <BarChart3 size={18} color="#fff" />
            </div>
            <span className="sap-logo-text">Student Analytics Portal</span>
          </Link>

          <div className="sap-nav-links">
            <Link href="#features" className="sap-nav-link">Features</Link>
            <Link href="#how-it-works" className="sap-nav-link">How It Works</Link>
            <Link href="#contact" className="sap-nav-link">Contact</Link>
          </div>

          <div className="sap-nav-ctas">
            <RequestDemoModal />
            <Link href="/login" className="sap-btn sap-btn-ghost">Admin Login</Link>
            <Link href="/parent/login" className="sap-btn sap-btn-primary">Student Login</Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="sap-hero">
        <div className="sap-hero-bg-dots" aria-hidden />
        <div className="sap-container sap-hero-grid">

          {/* Left */}
          <div className="sap-hero-copy">
            <div className="sap-badge">
              <span className="sap-badge-dot" />
              Built for JEE, NEET, MHT-CET &amp; Competitive Exam Coaching Institutes
            </div>

            <h1 className="sap-hero-h1">
              Student{' '}
              <span className="sap-gradient-text">Performance Tracking</span>{' '}
              Made Simple
            </h1>

            <p className="sap-hero-sub">
              Manage student records, upload test results, track attendance,
              and help parents stay informed through a centralized analytics platform.
            </p>

            <div className="sap-hero-actions">
              <Link href="/parent/login" className="sap-btn sap-btn-primary sap-btn-lg">
                Student / Parent Login
                <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="sap-btn sap-btn-outline sap-btn-lg">
                Admin Login
              </Link>
            </div>

            {/* Request Demo CTA */}
            <div className="mt-4 flex items-center gap-3">
              <RequestDemoModal />
              <span className="text-sm text-[var(--muted-foreground,#6b7280)]">Get a free 3-day trial for your institute</span>
            </div>
          </div>

          {/* Right — photo + floating cards */}
          <div className="sap-hero-visual">
            <div className="sap-hero-img-wrap">
              <Image
                src="/hero_family.png"
                alt="Indian parents checking student performance on a smartphone"
                width={620}
                height={430}
                priority
                className="sap-hero-img"
              />

              {/* Floating analytics cards */}
              <div className="sap-float-card sap-float-tl">
                <div className="sap-float-label">Attendance</div>
                <div className="sap-float-value sap-color-teal">92%</div>
              </div>
              <div className="sap-float-card sap-float-tr">
                <div className="sap-float-label">Latest Rank</div>
                <div className="sap-float-value sap-color-indigo">#18</div>
              </div>
              <div className="sap-float-card sap-float-bl">
                <div className="sap-float-label">Performance</div>
                <div className="sap-float-value sap-color-green">Improving ↑</div>
              </div>
              <div className="sap-float-card sap-float-br">
                <div className="sap-float-label">Test Average</div>
                <div className="sap-float-value sap-color-blue">78%</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════════ */}
      <section id="features" className="sap-section sap-section-gray">
        <div className="sap-container">
          <div className="sap-section-header">
            <span className="sap-section-tag">Features</span>
            <h2 className="sap-section-h2">Everything Your Institute Needs</h2>
            <p className="sap-section-sub">
              Purpose-built tools for coaching institutes to manage students, analyse performance and engage parents.
            </p>
          </div>

          <div className="sap-features-grid">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="sap-feature-card">
                  <div className="sap-feature-icon" style={{ background: f.bg }}>
                    <Icon size={22} color={f.color} />
                  </div>
                  <h3 className="sap-feature-title">{f.title}</h3>
                  <p className="sap-feature-desc">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ VALUE SECTION ═══════════════════════════════════════ */}
      <section className="sap-section sap-section-white">
        <div className="sap-container">
          <div className="sap-section-header">
            <span className="sap-section-tag">Why Institutes Choose Us</span>
            <h2 className="sap-section-h2">Why Coaching Institutes Use Student Analytics Portal</h2>
          </div>

          <div className="sap-value-grid">
            {values.map((v) => {
              const Icon = v.icon
              return (
                <div key={v.title} className="sap-value-card">
                  <div className="sap-value-icon">
                    <Icon size={24} color="#2563eb" />
                  </div>
                  <h3 className="sap-value-title">{v.title}</h3>
                  <p className="sap-value-desc">{v.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════ */}
      <section id="how-it-works" className="sap-section sap-how-section">
        <div className="sap-container">
          <div className="sap-section-header">
            <span className="sap-section-tag sap-tag-light">How It Works</span>
            <h2 className="sap-section-h2 sap-h2-white">Simple. Powerful. Instant.</h2>
            <p className="sap-section-sub sap-sub-light">
              Get your institute up and running in four simple steps.
            </p>
          </div>

          <div className="sap-steps-grid">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.num} className="sap-step-card">
                  <div className="sap-step-num">{step.num}</div>
                  <div className="sap-step-icon-wrap">
                    <Icon size={28} color="#2563eb" />
                  </div>
                  <h3 className="sap-step-title">{step.title}</h3>
                  <p className="sap-step-desc">{step.desc}</p>
                  {i < steps.length - 1 && (
                    <div className="sap-step-arrow" aria-hidden>
                      <ChevronRight size={20} color="#93c5fd" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ DASHBOARD PREVIEW ═══════════════════════════════════ */}
      <section className="sap-section sap-section-white">
        <div className="sap-container">
          <div className="sap-section-header">
            <span className="sap-section-tag">Product Preview</span>
            <h2 className="sap-section-h2">A Dashboard Built for Clarity</h2>
            <p className="sap-section-sub">
              Every metric your admin needs — student count, test performance, attendance, and rankings — in one clean view.
            </p>
          </div>

          <div className="sap-dashboard-wrap">
            <div className="sap-dashboard-chrome">
              <div className="sap-chrome-dots">
                <span /><span /><span />
              </div>
              <div className="sap-chrome-bar">
                <span>Student Analytics Portal — Dashboard</span>
              </div>
            </div>
            <Image
              src="/dashboard_preview.png"
              alt="Student Analytics Portal admin dashboard showing performance charts and student data"
              width={1200}
              height={680}
              className="sap-dashboard-img"
            />
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══════════════════════════════════════════ */}
      <section className="sap-cta-section">
        <div className="sap-cta-bg" aria-hidden />
        <div className="sap-container sap-cta-inner">
          <BookOpen size={36} color="#93c5fd" style={{ marginBottom: '16px' }} />
          <h2 className="sap-cta-h2">
            Ready to Modernize Student Performance Tracking?
          </h2>
          <p className="sap-cta-sub">
            Join coaching institutes simplifying analytics and parent communication.
          </p>
          <div className="sap-cta-actions">
            <Link href="/parent/login" className="sap-btn sap-btn-white sap-btn-lg">
              Student / Parent Login
              <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="sap-btn sap-btn-outline-white sap-btn-lg">
              Admin Login
            </Link>
          </div>
        </div>
      </section>

      {/* ══ CONTACT ═════════════════════════════════════════════ */}
      <section id="contact" className="sap-section sap-section-gray">
        <div className="sap-container">
          <div className="sap-section-header">
            <span className="sap-section-tag">Contact</span>
            <h2 className="sap-section-h2">Get in Touch</h2>
            <p className="sap-section-sub">
              Interested in a demo? Reach out and we'll be happy to help.
            </p>
          </div>

          <div className="sap-contact-grid">
            <div className="sap-contact-card">
              <div className="sap-contact-icon">
                <Phone size={22} color="#2563eb" />
              </div>
              <div>
                <div className="sap-contact-label">Phone</div>
                <a href="tel:7385519619" className="sap-contact-value">7385519619</a>
              </div>
            </div>
            <div className="sap-contact-card">
              <div className="sap-contact-icon">
                <Phone size={22} color="#4f46e5" />
              </div>
              <div>
                <div className="sap-contact-label">Phone</div>
                <a href="tel:9067290164" className="sap-contact-value">9067290164</a>
              </div>
            </div>
            <div className="sap-contact-card">
              <div className="sap-contact-icon">
                <Mail size={22} color="#0d9488" />
              </div>
              <div>
                <div className="sap-contact-label">Email</div>
                <a href="mailto:contact@studentanalyticsportal.com" className="sap-contact-value">
                  contact@studentanalyticsportal.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="sap-footer">
        <div className="sap-container sap-footer-inner">
          <div className="sap-footer-brand">
            <Link href="/" className="sap-logo">
              <div className="sap-logo-icon">
                <BarChart3 size={16} color="#fff" />
              </div>
              <span className="sap-logo-text sap-logo-text-light">Student Analytics Portal</span>
            </Link>
            <p className="sap-footer-tagline">
              Helping coaching institutes track performance and keep parents informed.
            </p>
          </div>

          <div className="sap-footer-links-group">
            <div className="sap-footer-col">
              <h4 className="sap-footer-col-title">Product</h4>
              <Link href="#features" className="sap-footer-link">Features</Link>
              <Link href="#how-it-works" className="sap-footer-link">How It Works</Link>
            </div>
            <div className="sap-footer-col">
              <h4 className="sap-footer-col-title">Access</h4>
              <Link href="/login" className="sap-footer-link">Admin Login</Link>
              <Link href="/parent/login" className="sap-footer-link">Student Login</Link>
            </div>
            <div className="sap-footer-col">
              <h4 className="sap-footer-col-title">Legal</h4>
              <Link href="#" className="sap-footer-link">Privacy Policy</Link>
              <Link href="#" className="sap-footer-link">Terms</Link>
              <Link href="#contact" className="sap-footer-link">Contact</Link>
            </div>
          </div>
        </div>

        <div className="sap-container sap-footer-bottom">
          <p>© {new Date().getFullYear()} Student Analytics Portal. All rights reserved.</p>
          <p>contact@studentanalyticsportal.com</p>
        </div>
      </footer>

      {/* ══ GLOBAL STYLES ═══════════════════════════════════════ */}
      <style>{`
        /* ── Reset & base ─────────────────────────────────── */
        .sap-root {
          min-height: 100vh;
          background: #fff;
          color: #111827;
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .sap-container {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 24px;
        }
        a { text-decoration: none; }
        * { box-sizing: border-box; }

        /* ── Navbar ───────────────────────────────────────── */
        .sap-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e5e7eb;
        }
        .sap-nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }
        .sap-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .sap-logo-icon {
          width: 34px; height: 34px;
          border-radius: 8px;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(37,99,235,0.35);
        }
        .sap-logo-text {
          font-weight: 700;
          font-size: 15px;
          color: #111827;
          letter-spacing: -0.02em;
        }
        .sap-logo-text-light { color: #f9fafb; }
        .sap-nav-links {
          display: flex;
          gap: 32px;
        }
        .sap-nav-link {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          transition: color 0.15s;
        }
        .sap-nav-link:hover { color: #111827; }
        .sap-nav-ctas {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        /* ── Buttons ──────────────────────────────────────── */
        .sap-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 20px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.18s ease;
          text-decoration: none;
          line-height: 1;
        }
        .sap-btn-lg {
          padding: 13px 26px;
          font-size: 15px;
          border-radius: 10px;
        }
        .sap-btn-primary {
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          color: #fff;
          box-shadow: 0 2px 10px rgba(37,99,235,0.35);
        }
        .sap-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37,99,235,0.45);
          opacity: 0.95;
        }
        .sap-btn-ghost {
          background: transparent;
          color: #374151;
          border: 1px solid #e5e7eb;
        }
        .sap-btn-ghost:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        .sap-btn-outline {
          background: #fff;
          color: #374151;
          border: 1.5px solid #d1d5db;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .sap-btn-outline:hover {
          border-color: #2563eb;
          color: #2563eb;
          transform: translateY(-1px);
        }
        .sap-btn-white {
          background: #fff;
          color: #2563eb;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        }
        .sap-btn-white:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        }
        .sap-btn-outline-white {
          background: transparent;
          color: #fff;
          border: 1.5px solid rgba(255,255,255,0.5);
        }
        .sap-btn-outline-white:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.8);
        }

        /* ── Hero ─────────────────────────────────────────── */
        .sap-hero {
          position: relative;
          padding: 110px 0 0;
          background: #f8faff;
          overflow: hidden;
        }
        .sap-hero-bg-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, #c7d2fe 1px, transparent 1px);
          background-size: 28px 28px;
          opacity: 0.45;
          pointer-events: none;
        }
        .sap-hero-grid {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 56px;
          align-items: center;
          padding-bottom: 0;
        }
        .sap-hero-copy {
          padding: 40px 0 60px;
        }
        .sap-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 20px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          font-size: 12px;
          font-weight: 600;
          color: #1d4ed8;
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .sap-badge-dot {
          display: inline-block;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
        }
        .sap-hero-h1 {
          font-size: clamp(30px, 4.5vw, 52px);
          font-weight: 800;
          line-height: 1.12;
          color: #0f172a;
          letter-spacing: -0.03em;
          margin-bottom: 20px;
        }
        .sap-gradient-text {
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .sap-hero-sub {
          font-size: 17px;
          color: #475569;
          line-height: 1.75;
          margin-bottom: 36px;
          max-width: 490px;
        }
        .sap-hero-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        /* ── Hero Visual ──────────────────────────────────── */
        .sap-hero-visual {
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
        }
        .sap-hero-img-wrap {
          position: relative;
          width: 100%;
          max-width: 560px;
        }
        .sap-hero-img {
          width: 100%;
          height: auto;
          border-radius: 16px 16px 0 0;
          object-fit: cover;
          box-shadow: 0 20px 60px rgba(37,99,235,0.15);
        }

        /* Floating cards */
        .sap-float-card {
          position: absolute;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px 16px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.10);
          min-width: 120px;
          animation: sap-float 3s ease-in-out infinite;
        }
        .sap-float-tl { top: 20px; left: -16px; animation-delay: 0s; }
        .sap-float-tr { top: 24px; right: -16px; animation-delay: 0.6s; }
        .sap-float-bl { bottom: 60px; left: -16px; animation-delay: 1.2s; }
        .sap-float-br { bottom: 60px; right: -16px; animation-delay: 1.8s; }
        .sap-float-label {
          font-size: 11px;
          font-weight: 500;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 2px;
        }
        .sap-float-value {
          font-size: 20px;
          font-weight: 800;
          line-height: 1;
        }
        .sap-color-teal { color: #0d9488; }
        .sap-color-indigo { color: #4f46e5; }
        .sap-color-green { color: #059669; }
        .sap-color-blue { color: #2563eb; }

        @keyframes sap-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        /* ── Section Shared ───────────────────────────────── */
        .sap-section { padding: 88px 0; }
        .sap-section-white { background: #fff; }
        .sap-section-gray { background: #f8faff; }
        .sap-section-header {
          text-align: center;
          margin-bottom: 56px;
        }
        .sap-section-tag {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          font-size: 12px;
          font-weight: 700;
          color: #2563eb;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 14px;
        }
        .sap-tag-light { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3); color: #bfdbfe; }
        .sap-section-h2 {
          font-size: clamp(24px, 3.2vw, 38px);
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.025em;
          line-height: 1.2;
          margin-bottom: 14px;
        }
        .sap-h2-white { color: #fff; }
        .sap-section-sub {
          font-size: 17px;
          color: #64748b;
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.7;
        }
        .sap-sub-light { color: #93c5fd; }

        /* ── Feature Cards ────────────────────────────────── */
        .sap-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .sap-feature-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 28px 24px;
          transition: all 0.22s ease;
          cursor: default;
        }
        .sap-feature-card:hover {
          border-color: #bfdbfe;
          box-shadow: 0 8px 30px rgba(37,99,235,0.1);
          transform: translateY(-4px);
        }
        .sap-feature-icon {
          width: 48px; height: 48px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px;
        }
        .sap-feature-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }
        .sap-feature-desc {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.65;
        }

        /* ── Value Cards ──────────────────────────────────── */
        .sap-value-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .sap-value-card {
          display: flex;
          gap: 18px;
          align-items: flex-start;
          background: #f8faff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 28px 24px;
          transition: all 0.2s ease;
        }
        .sap-value-card:hover {
          border-color: #bfdbfe;
          box-shadow: 0 4px 20px rgba(37,99,235,0.08);
        }
        .sap-value-icon {
          width: 48px; height: 48px;
          background: #eff6ff;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .sap-value-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 6px;
        }
        .sap-value-desc {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.65;
        }

        /* ── How It Works ─────────────────────────────────── */
        .sap-how-section {
          background: linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #4c1d95 100%);
          padding: 96px 0;
        }
        .sap-steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          position: relative;
        }
        .sap-step-card {
          position: relative;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 16px;
          padding: 32px 24px;
          text-align: center;
          backdrop-filter: blur(8px);
          transition: all 0.22s ease;
        }
        .sap-step-card:hover {
          background: rgba(255,255,255,0.12);
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.2);
        }
        .sap-step-num {
          font-size: 36px;
          font-weight: 900;
          color: rgba(147,197,253,0.3);
          margin-bottom: 12px;
          line-height: 1;
          letter-spacing: -0.04em;
        }
        .sap-step-icon-wrap {
          width: 56px; height: 56px;
          background: #eff6ff;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 18px;
        }
        .sap-step-title {
          font-size: 17px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 10px;
        }
        .sap-step-desc {
          font-size: 14px;
          color: #93c5fd;
          line-height: 1.65;
        }
        .sap-step-arrow {
          position: absolute;
          top: 50%;
          right: -12px;
          transform: translateY(-50%);
          z-index: 10;
          background: rgba(30,58,138,0.8);
          border-radius: 50%;
          width: 24px; height: 24px;
          display: flex; align-items: center; justify-content: center;
        }

        /* ── Dashboard Preview ────────────────────────────── */
        .sap-dashboard-wrap {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(37,99,235,0.12), 0 4px 16px rgba(0,0,0,0.06);
        }
        .sap-dashboard-chrome {
          background: #f1f5f9;
          border-bottom: 1px solid #e5e7eb;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sap-chrome-dots {
          display: flex; gap: 6px;
        }
        .sap-chrome-dots span {
          display: block;
          width: 12px; height: 12px;
          border-radius: 50%;
        }
        .sap-chrome-dots span:nth-child(1) { background: #f87171; }
        .sap-chrome-dots span:nth-child(2) { background: #fbbf24; }
        .sap-chrome-dots span:nth-child(3) { background: #34d399; }
        .sap-chrome-bar {
          flex: 1;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 4px 14px;
          font-size: 12px;
          color: #9ca3af;
          text-align: center;
        }
        .sap-dashboard-img {
          width: 100%;
          height: auto;
          display: block;
        }

        /* ── CTA Section ──────────────────────────────────── */
        .sap-cta-section {
          position: relative;
          padding: 96px 24px;
          text-align: center;
          overflow: hidden;
          background: linear-gradient(135deg, #1d4ed8 0%, #4f46e5 60%, #7c3aed 100%);
        }
        .sap-cta-bg {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }
        .sap-cta-inner {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .sap-cta-h2 {
          font-size: clamp(24px, 3.5vw, 40px);
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.025em;
          margin-bottom: 16px;
          max-width: 700px;
          line-height: 1.2;
        }
        .sap-cta-sub {
          font-size: 17px;
          color: #bfdbfe;
          margin-bottom: 36px;
        }
        .sap-cta-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* ── Contact ──────────────────────────────────────── */
        .sap-contact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          max-width: 860px;
          margin: 0 auto;
        }
        .sap-contact-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 28px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: all 0.2s;
        }
        .sap-contact-card:hover {
          border-color: #bfdbfe;
          box-shadow: 0 6px 24px rgba(37,99,235,0.1);
          transform: translateY(-2px);
        }
        .sap-contact-icon {
          width: 48px; height: 48px;
          background: #eff6ff;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .sap-contact-label {
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 4px;
        }
        .sap-contact-value {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          transition: color 0.15s;
        }
        .sap-contact-value:hover { color: #2563eb; }

        /* ── Footer ───────────────────────────────────────── */
        .sap-footer {
          background: #0f172a;
          color: #94a3b8;
          padding: 60px 0 0;
        }
        .sap-footer-inner {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 64px;
          align-items: flex-start;
          padding-bottom: 48px;
          border-bottom: 1px solid #1e293b;
        }
        .sap-footer-brand { max-width: 320px; }
        .sap-footer-tagline {
          font-size: 14px;
          color: #64748b;
          line-height: 1.7;
          margin-top: 14px;
        }
        .sap-footer-links-group {
          display: flex;
          gap: 56px;
        }
        .sap-footer-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sap-footer-col-title {
          font-size: 13px;
          font-weight: 700;
          color: #e2e8f0;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }
        .sap-footer-link {
          font-size: 14px;
          color: #64748b;
          transition: color 0.15s;
        }
        .sap-footer-link:hover { color: #cbd5e1; }
        .sap-footer-bottom {
          display: flex;
          justify-content: space-between;
          padding: 20px 0;
          font-size: 13px;
          color: #475569;
        }

        /* ── Responsive ───────────────────────────────────── */
        @media (max-width: 1024px) {
          .sap-features-grid { grid-template-columns: repeat(2, 1fr); }
          .sap-steps-grid { grid-template-columns: repeat(2, 1fr); }
          .sap-step-arrow { display: none; }
        }
        @media (max-width: 768px) {
          .sap-nav-links { display: none; }
          .sap-hero-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .sap-hero-copy { padding-bottom: 0; }
          .sap-hero-visual { justify-content: center; }
          .sap-hero-img-wrap { max-width: 100%; }
          .sap-float-card { display: none; }
          .sap-features-grid { grid-template-columns: 1fr; }
          .sap-value-grid { grid-template-columns: 1fr; }
          .sap-steps-grid { grid-template-columns: 1fr; }
          .sap-contact-grid { grid-template-columns: 1fr; }
          .sap-footer-inner { grid-template-columns: 1fr; gap: 32px; }
          .sap-footer-links-group { flex-wrap: wrap; gap: 32px; }
          .sap-footer-bottom { flex-direction: column; gap: 8px; }
          .sap-nav-ctas .sap-btn-ghost { display: none; }
        }
      `}</style>
    </div>
  )
}

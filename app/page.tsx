import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  BarChart3,
  Users,
  FileSpreadsheet,
  Activity,
  MonitorPlay,
  LineChart,
  FileText,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f6fa',
        color: '#111827',
        fontFamily:
          "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: 'rgba(245, 246, 250, 0.92)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChart3 style={{ width: '18px', height: '18px', color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>
              Parent Analytics Portal
            </span>
          </div>

          {/* Desktop links */}
          <div
            className="hidden md:flex"
            style={{ gap: '28px', fontSize: '14px', color: '#6b7280' }}
          >
            <Link href="#features" className="nav-link">Features</Link>
            <Link href="#how-it-works" className="nav-link">How It Works</Link>
            <Link href="#contact" className="nav-link">Contact</Link>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link
              href="/login"
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                textDecoration: 'none',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#fff',
                transition: 'background 0.15s',
              }}
            >
              Admin Login
            </Link>
            <Link
              href="/signup"
              style={{
                padding: '8px 18px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '6px',
                backgroundColor: '#4f46e5',
                boxShadow: '0 1px 3px rgba(79,70,229,0.3)',
                transition: 'opacity 0.15s',
              }}
            >
              Book Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section
        style={{
          paddingTop: '100px',
          paddingBottom: '0',
          backgroundColor: '#fff',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '48px',
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          {/* Left: Copy */}
          <div style={{ paddingBottom: '64px', paddingTop: '32px' }}>
            {/* Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1px solid #c7d2fe',
                backgroundColor: '#eef2ff',
                fontSize: '12px',
                color: '#4338ca',
                fontWeight: 500,
                marginBottom: '24px',
              }}
            >
              Designed for JEE · NEET · MHT-CET · Competitive Exam Coaching Centers
            </div>

            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 48px)',
                fontWeight: 700,
                lineHeight: 1.15,
                color: '#111827',
                marginBottom: '20px',
                letterSpacing: '-0.02em',
              }}
            >
              Parent Performance Tracking{' '}
              <span style={{ color: '#4f46e5' }}>for Coaching Institutes</span>
            </h1>

            <p
              style={{
                fontSize: '17px',
                color: '#6b7280',
                lineHeight: 1.7,
                marginBottom: '36px',
                maxWidth: '480px',
              }}
            >
              Manage student records, upload test results, and help parents stay
              informed through a simple performance dashboard.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link
                href="/signup"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  backgroundColor: '#4f46e5',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '15px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(79,70,229,0.35)',
                }}
              >
                Request Demo
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </Link>
              <Link
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontWeight: 500,
                  fontSize: '15px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  border: '1px solid #d1d5db',
                }}
              >
                Admin Login
              </Link>
            </div>
          </div>

          {/* Right: Hero illustration */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              paddingTop: '32px',
            }}
          >
            <Image
              src="/hero_family.png"
              alt="Parents reviewing student performance on a tablet with their child"
              width={620}
              height={420}
              priority
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: '12px 12px 0 0',
              }}
            />
          </div>
        </div>
      </section>

      {/* ── "Designed for Coaching Institutes" trust section ─────── */}
      <section
        id="features"
        style={{
          backgroundColor: '#f5f6fa',
          padding: '80px 24px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2
              style={{
                fontSize: 'clamp(22px, 3vw, 32px)',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '14px',
              }}
            >
              Designed for Coaching Institutes
            </h2>
            <p style={{ color: '#6b7280', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
              Built to simplify student performance tracking and parent communication.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
            }}
          >
            {[
              {
                icon: <Users style={{ width: '20px', height: '20px', color: '#4f46e5' }} />,
                title: 'Student Records',
                desc: 'Maintain and organize student information in one place.',
              },
              {
                icon: <FileText style={{ width: '20px', height: '20px', color: '#4f46e5' }} />,
                title: 'Test Performance',
                desc: 'Upload and review weekly test results.',
              },
              {
                icon: <MonitorPlay style={{ width: '20px', height: '20px', color: '#4f46e5' }} />,
                title: 'Parent Visibility',
                desc: 'Give parents easy access to performance updates.',
              },
              {
                icon: <Activity style={{ width: '20px', height: '20px', color: '#4f46e5' }} />,
                title: 'Progress Tracking',
                desc: 'Monitor academic improvement over time.',
              },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#eef2ff',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  {card.icon}
                </div>
                <h3
                  style={{
                    fontWeight: 600,
                    color: '#111827',
                    fontSize: '15px',
                    marginBottom: '8px',
                  }}
                >
                  {card.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.65 }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Preview ─────────────────────────────────────── */}
      <section
        id="how-it-works"
        style={{
          backgroundColor: '#fff',
          padding: '80px 24px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '64px',
              alignItems: 'center',
            }}
            className="preview-grid"
          >
            {/* Mobile mockup */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Image
                src="/mobile_mockup.png"
                alt="Parent Analytics Portal mobile app showing student performance dashboard"
                width={340}
                height={520}
                style={{
                  width: '100%',
                  maxWidth: '320px',
                  height: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 16px 40px rgba(79,70,229,0.15))',
                }}
              />
            </div>

            {/* Feature list */}
            <div>
              <h2
                style={{
                  fontSize: 'clamp(22px, 3vw, 34px)',
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: '16px',
                  letterSpacing: '-0.01em',
                }}
              >
                Everything Needed to Track Student Performance
              </h2>
              <p
                style={{
                  color: '#6b7280',
                  fontSize: '16px',
                  lineHeight: 1.7,
                  marginBottom: '36px',
                }}
              >
                One platform for admins to manage data and for parents to stay updated.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  {
                    icon: <Users style={{ width: '18px', height: '18px', color: '#4f46e5' }} />,
                    title: 'Student Management',
                    desc: 'Store and manage student records.',
                  },
                  {
                    icon: <FileSpreadsheet style={{ width: '18px', height: '18px', color: '#4f46e5' }} />,
                    title: 'Excel Uploads',
                    desc: 'Import student and test data efficiently.',
                  },
                  {
                    icon: <MonitorPlay style={{ width: '18px', height: '18px', color: '#4f46e5' }} />,
                    title: 'Parent Dashboard',
                    desc: 'Allow parents to view performance and attendance.',
                  },
                  {
                    icon: <LineChart style={{ width: '18px', height: '18px', color: '#4f46e5' }} />,
                    title: 'Performance Analytics',
                    desc: 'Track trends and academic progress.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: '#eef2ff',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '15px',
                          color: '#111827',
                          marginBottom: '4px',
                        }}
                      >
                        {item.title}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: '#4f46e5',
          padding: '64px 24px',
        }}
      >
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <h2
            style={{
              fontSize: 'clamp(22px, 3vw, 32px)',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '14px',
            }}
          >
            Ready to simplify performance tracking?
          </h2>
          <p
            style={{
              color: '#c7d2fe',
              fontSize: '16px',
              lineHeight: 1.7,
              marginBottom: '32px',
            }}
          >
            Schedule a demo and see how the portal works for your institute.
          </p>
          <Link
            href="/signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '13px 28px',
              backgroundColor: '#fff',
              color: '#4f46e5',
              fontWeight: 600,
              fontSize: '15px',
              borderRadius: '8px',
              textDecoration: 'none',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}
          >
            Request Demo
            <ArrowRight style={{ width: '16px', height: '16px' }} />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer
        id="contact"
        style={{
          backgroundColor: '#111827',
          color: '#d1d5db',
          padding: '60px 24px 32px',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '40px',
            marginBottom: '48px',
          }}
        >
          {/* Brand */}
          <div style={{ gridColumn: 'span 2' }} className="footer-brand">
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: '#4f46e5',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChart3 style={{ width: '15px', height: '15px', color: '#fff' }} />
              </div>
              <span style={{ fontWeight: 600, color: '#fff', fontSize: '15px' }}>
                Parent Analytics Portal
              </span>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.7, maxWidth: '280px', color: '#9ca3af' }}>
              Built for coaching institutes to track performance and communicate with parents effectively.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 style={{ fontWeight: 600, color: '#fff', fontSize: '14px', marginBottom: '16px' }}>
              Product
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Features', 'Dashboard', 'Analytics'].map((item) => (
                <li key={item}>
                  <Link href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '14px' }}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontWeight: 600, color: '#fff', fontSize: '14px', marginBottom: '16px' }}>
              Company
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['About', 'Contact'].map((item) => (
                <li key={item}>
                  <Link href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '14px' }}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontWeight: 600, color: '#fff', fontSize: '14px', marginBottom: '16px' }}>
              Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Privacy Policy', 'Terms'].map((item) => (
                <li key={item}>
                  <Link href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '14px' }}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid #1f2937',
            paddingTop: '28px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            © {new Date().getFullYear()} Parent Analytics Portal. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="#" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
            <Link href="#" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>
              Terms
            </Link>
          </div>
        </div>
      </footer>

      {/* ── Responsive tweaks ──────────────────────────────────── */}
      <style>{`
        .nav-link {
          color: #6b7280;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.15s;
        }
        .nav-link:hover {
          color: #111827;
        }
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
          .preview-grid {
            grid-template-columns: 1fr !important;
          }
          .footer-brand {
            grid-column: span 1 !important;
          }
        }
      `}</style>
    </div>
  )
}

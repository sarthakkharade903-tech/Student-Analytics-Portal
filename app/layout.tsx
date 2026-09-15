import type { Metadata, Viewport } from 'next'
import { Inter, Geist } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils"
import PwaRegister from '@/components/PwaRegister'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: {
    template: '%s | StudentIQ',
    default: 'StudentIQ | Coaching Analytics Portal',
  },
  description:
    'Help coaching institutes track student performance and keep parents updated without manual calls. Built for JEE, NEET, MHT-CET and more.',
  keywords: 'coaching institute, student analytics, parent portal, JEE, NEET',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'StudentIQ',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className={inter.className}>
        <PwaRegister />
        {children}
      </body>
    </html>
  )
}

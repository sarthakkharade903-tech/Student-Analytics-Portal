import type { Metadata } from 'next'
import { Inter, Geist } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Parent Analytics Portal – Keep Parents Informed Automatically',
  description:
    'Help coaching institutes track student performance and keep parents updated without manual calls. Built for JEE, NEET, MHT-CET and more.',
  keywords: 'coaching institute, student analytics, parent portal, JEE, NEET',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}

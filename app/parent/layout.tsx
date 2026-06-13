import { ReactNode } from 'react'
import ParentNav from './ParentNav'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('parent_token')?.value
  let studentId = null

  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'super-secret-parent-token-key-change-me-in-prod'
      )
      const { payload } = await jwtVerify(token, secret)
      studentId = payload.student_id as string
    } catch (e) {
      console.error('Invalid parent token', e)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1729] text-slate-100 font-sans selection:bg-blue-500/30">
      <ParentNav studentId={studentId} />
      <main className="max-w-5xl mx-auto px-4 py-8 lg:px-8">
        {children}
      </main>
    </div>
  )
}

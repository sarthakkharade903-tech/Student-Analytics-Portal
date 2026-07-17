import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { jwtVerify } from 'jose'

// Lightweight JWT signing using Web Crypto API — no extra deps needed
async function sign(payload: object, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  const data = `${header}.${body}`
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${data}.${sigB64}`
}

export async function GET(req: NextRequest) {
  try {
    // 1. Get the logged-in student from the parent_token JWT cookie
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'super-secret-parent-token-key-change-me-in-prod'
    )
    const { payload: sessionPayload } = await jwtVerify(token, secret)
    const studentId = sessionPayload.student_id as string

    if (!studentId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 2. Fetch student data including coaching_center_id
    const { data: student, error } = await supabase
      .from('students')
      .select('id, name, roll_no, batch, standard, coaching_center_id')
      .eq('id', studentId)
      .single()

    if (error || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // 3. Build a short-lived SSO JWT (5 min expiry)
    const ssoSecret = process.env.EXAM_ENGINE_JWT_SECRET!
    const payload = {
      type: 'student_sso',
      student_id: student.id,
      roll_no: student.roll_no,
      name: student.name,
      batch: student.batch,
      standard: student.standard,
      coaching_center_id: student.coaching_center_id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
    }

    const ssoToken = await sign(payload, ssoSecret)
    const examEngineUrl = process.env.NEXT_PUBLIC_EXAM_ENGINE_URL || 'http://localhost:3001'

    // 4. Redirect the student directly into the Exam Engine
    return NextResponse.redirect(`${examEngineUrl}/student/sso?token=${ssoToken}`)
  } catch (e) {
    console.error('Student SSO error:', e)
    return NextResponse.json({ error: 'SSO failed' }, { status: 500 })
  }
}

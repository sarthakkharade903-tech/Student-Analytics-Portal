import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Get the logged-in coaching admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Get their coaching_center_id
    const { data: profile, error } = await supabase
      .from('users')
      .select('coaching_center_id, coaching_centers(name)')
      .eq('id', user.id)
      .single()

    if (error || !profile?.coaching_center_id) {
      return NextResponse.json({ error: 'No coaching center found for this account' }, { status: 404 })
    }

    const center = Array.isArray(profile.coaching_centers)
      ? profile.coaching_centers[0]
      : profile.coaching_centers

    // 3. Build a short-lived SSO JWT (5 min expiry)
    const secret = process.env.EXAM_ENGINE_JWT_SECRET!
    const payload = {
      type: 'admin_sso',
      user_id: user.id,
      email: user.email,
      coaching_center_id: profile.coaching_center_id,
      coaching_name: (center as any)?.name ?? '',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
    }

    const token = await sign(payload, secret)
    const examEngineUrl = process.env.NEXT_PUBLIC_EXAM_ENGINE_URL || 'http://localhost:3001'

    // 4. Redirect admin directly into the Exam Engine Operator Portal
    return NextResponse.redirect(`${examEngineUrl}/operator/sso?token=${token}`)
  } catch (e) {
    console.error('Admin SSO error:', e)
    return NextResponse.json({ error: 'SSO failed' }, { status: 500 })
  }
}

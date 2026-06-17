import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SignJWT } from 'jose'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Use service role key to bypass RLS — this runs on the server only, never exposed to browser
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// In production, you should set JWT_SECRET in your .env
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-parent-token-key-change-me-in-prod'
)

export async function POST(req: Request) {
  try {
    const { parent_phone, pin } = await req.json()

    if (!parent_phone || !pin) {
      return NextResponse.json(
        { error: 'Parent phone number and PIN are required' },
        { status: 400 }
      )
    }

    // Lookup student
    // Note: We are using the Supabase ANON key. Ensure Row Level Security (RLS)
    // allows reading the 'students' table with anon key if RLS is enabled, or bypassed for MVP.
    const { data: student, error } = await supabase
      .from('students')
      .select('id, name')
      .eq('parent_phone', parent_phone)
      .eq('pin', pin)
      .single()

    if (error || !student) {
      return NextResponse.json(
        { error: 'Invalid phone number or PIN.' },
        { status: 401 }
      )
    }

    // Create JWT
    const token = await new SignJWT({ student_id: student.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    // Set cookie
    const response = NextResponse.json({ success: true, name: student.name })
    response.cookies.set('parent_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

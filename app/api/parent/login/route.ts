import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SignJWT } from 'jose'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// In production, you should set JWT_SECRET in your .env
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-parent-token-key-change-me-in-prod'
)

export async function POST(req: Request) {
  try {
    const { roll_no, parent_phone } = await req.json()

    if (!roll_no || !parent_phone) {
      return NextResponse.json(
        { error: 'Roll number and parent phone number are required' },
        { status: 400 }
      )
    }

    // Lookup student
    // Note: We are using the Supabase ANON key. Ensure Row Level Security (RLS)
    // allows reading the 'students' table with anon key if RLS is enabled, or bypassed for MVP.
    const { data: student, error } = await supabase
      .from('students')
      .select('id, name')
      .eq('roll_no', roll_no)
      .eq('parent_phone', parent_phone)
      .single()

    if (error || !student) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please check the roll number and phone number.' },
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

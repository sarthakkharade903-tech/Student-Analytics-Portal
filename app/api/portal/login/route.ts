import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { roll_no, parent_phone } = await req.json()

    if (!roll_no || !parent_phone) {
      return NextResponse.json(
        { error: 'Roll number and parent phone are required.' },
        { status: 400 }
      )
    }

    // Normalise inputs
    const normRoll = String(roll_no).trim()
    const normPhone = String(parent_phone).trim().replace(/[\s\-+()]/g, '')

    const supabase = await createClient()

    // Look up the student — match roll_no AND parent_phone
    const { data: students, error } = await supabase
      .from('students')
      .select('id, name, batch, roll_no, parent_phone')
      .eq('roll_no', normRoll)

    if (error) {
      return NextResponse.json({ error: 'Database error.' }, { status: 500 })
    }

    // Find match where phone also matches (last 10 digits to be safe)
    const student = (students ?? []).find((s) => {
      const dbPhone = String(s.parent_phone ?? '').trim().replace(/[\s\-+()]/g, '')
      return (
        dbPhone.slice(-10) === normPhone.slice(-10)
      )
    })

    if (!student) {
      return NextResponse.json(
        { error: 'No student found with this Roll Number and Parent Phone combination.' },
        { status: 401 }
      )
    }

    // Set httpOnly cookie — UUID is unguessable
    const response = NextResponse.json({ success: true, name: student.name })
    response.cookies.set('portal_session', student.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      secure: process.env.NODE_ENV === 'production',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
}

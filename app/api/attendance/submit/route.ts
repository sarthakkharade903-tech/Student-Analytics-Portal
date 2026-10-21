import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recordCheckIn } from '@/lib/attendanceSession'

// ── POST /api/attendance/submit ──────────────────────────────────────────────
// Student submits the session code. Validates against in-memory store.
// Saves is_present=true (and is_late=true for late code) into the attendance table.
export async function POST(req: NextRequest) {
  try {
    // Identify student via portal cookie
    const studentId = req.cookies.get('portal_session')?.value
    if (!studentId) {
      return NextResponse.json({ error: 'Not logged in.' }, { status: 401 })
    }

    const supabase = await createClient()

    // Fetch student's coaching center and standard
    const { data: student } = await supabase
      .from('students')
      .select('id, coaching_center_id, standard')
      .eq('id', studentId)
      .single()

    if (!student?.coaching_center_id) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 })
    }

    const body = await req.json()
    const submittedCode: string = body.code ?? ''
    const date: string = body.date ?? new Date().toISOString().split('T')[0]
    const standard: string = body.standard ?? student.standard ?? '11th'
    const lat: number | undefined = body.lat
    const lon: number | undefined = body.lon

    // Validate code against in-memory session
    const result = recordCheckIn(
      student.coaching_center_id,
      date,
      standard,
      studentId,
      submittedCode,
      lat,
      lon
    )

    if (result === 'invalid') {
      return NextResponse.json(
        { error: 'Invalid or expired code. Please check the code and try again.' },
        { status: 400 }
      )
    }

    if (result === 'too_far') {
      return NextResponse.json(
        { error: 'You are too far from the coaching center to mark attendance.' },
        { status: 403 }
      )
    }

    if (result === 'already_marked') {
      return NextResponse.json(
        { error: 'You have already marked your attendance for this session.' },
        { status: 409 }
      )
    }

    // Save to database
    const isLate = result === 'late'
    const { error: dbError } = await supabase
      .from('attendance')
      .upsert(
        {
          student_id: studentId,
          coaching_center_id: student.coaching_center_id,
          date,
          is_present: true,
          is_late: isLate,
        },
        { onConflict: 'student_id,date' }
      )

    if (dbError) {
      console.error('DB error saving attendance:', dbError)
      return NextResponse.json({ error: 'Failed to save attendance.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      status: result, // 'present' or 'late'
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

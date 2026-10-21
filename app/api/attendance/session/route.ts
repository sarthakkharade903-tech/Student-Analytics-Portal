import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createSession,
  getSession,
  endSession,
} from '@/lib/attendanceSession'

// ── POST /api/attendance/session ─────────────────────────────────────────────
// Teacher starts a new attendance session. Returns the code + expiry.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('coaching_center_id')
      .eq('id', user.id)
      .single()

    if (!profile?.coaching_center_id) {
      return NextResponse.json({ error: 'No coaching center found' }, { status: 403 })
    }

    // Fetch stored GPS for this coaching center
    const { data: cc } = await supabase
      .from('coaching_centers')
      .select('gps_lat, gps_lon, gps_radius_m')
      .eq('id', profile.coaching_center_id)
      .single()

    const body = await req.json()
    const standard: string = body.standard ?? '11th'
    const date: string = body.date ?? new Date().toISOString().split('T')[0]
    const durationMs: number = (body.durationMinutes ?? 10) * 60 * 1000

    // Use stored coaching center GPS (set by admin in Settings)
    const lat: number | null = cc?.gps_lat ?? null
    const lon: number | null = cc?.gps_lon ?? null
    const radiusM: number = cc?.gps_radius_m ?? 150

    const session = createSession(profile.coaching_center_id, date, standard, durationMs, lat, lon, radiusM)

    return NextResponse.json({
      code: session.code,
      expiresAt: session.expiresAt,
      date: session.date,
      standard: session.standard,
      gpsEnabled: lat !== null,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── GET /api/attendance/session ──────────────────────────────────────────────
// Two modes:
//   ?teacher=1  → admin polls for live session status (uses Supabase auth)
//   (default)   → student portal polls (uses portal_session cookie)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]
    const isTeacher = searchParams.get('teacher') === '1'

    if (isTeacher) {
      // ── Teacher mode ─────────────────────────────────────────────────────
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ active: false })

      const { data: profile } = await supabase
        .from('users')
        .select('coaching_center_id')
        .eq('id', user.id)
        .single()

      if (!profile?.coaching_center_id) return NextResponse.json({ active: false })

      const session = getSession(profile.coaching_center_id, date)
      if (!session) return NextResponse.json({ active: false })

      const now = Date.now()
      const mainActive = now <= session.expiresAt
      const lateActive = !!(session.lateCode && session.lateExpiresAt && now <= session.lateExpiresAt)

      return NextResponse.json({
        active: mainActive || lateActive,
        mainActive,
        lateActive,
        expiresAt: session.expiresAt,
        lateExpiresAt: session.lateExpiresAt,
        lateCode: session.lateCode,
        code: session.code,
        checkedInCount: session.checkedIn.size,
        lateCheckedInCount: session.lateCheckedIn.size,
        totalCheckedIn: session.checkedIn.size + session.lateCheckedIn.size,
        gpsEnabled: session.lat != null,
      })
    }

    // ── Student mode ─────────────────────────────────────────────────────────
    const standard = searchParams.get('standard') ?? '11th'

    // Read portal_session cookie to identify student
    const studentId = req.cookies.get('portal_session')?.value
    if (!studentId) return NextResponse.json({ active: false })

    const supabase = await createClient()
    const { data: student } = await supabase
      .from('students')
      .select('coaching_center_id, standard')
      .eq('id', studentId)
      .single()

    if (!student?.coaching_center_id) return NextResponse.json({ active: false })

    // Use student's own coaching center — standard no longer part of the key
    const session = getSession(student.coaching_center_id, date)
    if (!session) return NextResponse.json({ active: false })

    const now = Date.now()
    const mainActive = now <= session.expiresAt
    const lateActive = !!(session.lateCode && session.lateExpiresAt && now <= session.lateExpiresAt)

    // Tell student if they already checked in
    const alreadyMarked =
      session.checkedIn.has(studentId) || session.lateCheckedIn.has(studentId)

    return NextResponse.json({
      active: mainActive || lateActive,
      mainActive,
      lateActive,
      expiresAt: session.expiresAt,
      lateExpiresAt: session.lateExpiresAt,
      alreadyMarked,
      requiresGps: session.lat != null,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ active: false })
  }
}

// ── DELETE /api/attendance/session ───────────────────────────────────────────
// Teacher manually ends a session.
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('coaching_center_id')
      .eq('id', user.id)
      .single()

    if (!profile?.coaching_center_id) {
      return NextResponse.json({ error: 'No coaching center found' }, { status: 403 })
    }

    const body = await req.json()
    const date: string = body.date ?? new Date().toISOString().split('T')[0]

    endSession(profile.coaching_center_id, date)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { startLateWindow } from '@/lib/attendanceSession'

// ── POST /api/attendance/late-session ────────────────────────────────────────
// Teacher starts a late check-in window for an existing session.
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

    const body = await req.json()
    const standard: string = body.standard ?? '11th'
    const date: string = body.date ?? new Date().toISOString().split('T')[0]
    const durationMs: number = (body.durationMinutes ?? 5) * 60 * 1000

    const session = startLateWindow(profile.coaching_center_id, date, standard, durationMs)
    if (!session) {
      return NextResponse.json(
        { error: 'No active session found. Start attendance first.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      lateCode: session.lateCode,
      lateExpiresAt: session.lateExpiresAt,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

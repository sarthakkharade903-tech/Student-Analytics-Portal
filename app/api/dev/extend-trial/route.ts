import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/dev/extend-trial
 * Extends the current logged-in admin's coaching center end_date by 30 days.
 * Useful for local development / testing when trial has expired.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get the coaching center for this user
    const { data: profile } = await supabase
      .from('users')
      .select('coaching_center_id')
      .eq('id', user.id)
      .single()

    if (!profile?.coaching_center_id) {
      return NextResponse.json({ error: 'No coaching center found' }, { status: 404 })
    }

    // Extend end_date by 30 days from today
    const newEndDate = new Date()
    newEndDate.setDate(newEndDate.getDate() + 30)

    const { error } = await supabase
      .from('coaching_centers')
      .update({
        end_date: newEndDate.toISOString(),
        account_status: 'Active',
        is_active: true,
      })
      .eq('id', profile.coaching_center_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      new_end_date: newEndDate.toISOString().split('T')[0],
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

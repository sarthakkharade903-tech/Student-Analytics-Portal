import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Basic auth check
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('super_admin_auth')?.value
    if (!authCookie || authCookie !== process.env.SUPER_ADMIN_SECURITY_CODE) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { instituteId, isActive } = await request.json()
    if (!instituteId) {
      return NextResponse.json({ success: false, message: 'Institute ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Update the is_active status
    const { error } = await supabase
      .from('coaching_centers')
      .update({ is_active: isActive })
      .eq('id', instituteId)

    if (error) throw error

    // Log the event
    await supabase.from('audit_logs').insert({
      event_type: 'SUBSCRIPTION_TOGGLED',
      description: `Institute ${instituteId} was ${isActive ? 'activated' : 'deactivated'} manually.`
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Toggle error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

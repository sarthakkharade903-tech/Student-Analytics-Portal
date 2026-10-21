import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json()

    if (!key || key.trim() === '') {
      return NextResponse.json({ success: false, error: 'Security key is required' }, { status: 400 })
    }

    // We need service role to check and update access codes
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // User must be authenticated
    const authHeader = req.headers.get('Authorization')
    const token = req.cookies.get('sb-access-token')?.value || '' // or use server client

    // Let's use the normal server client to get the user
    const { createClient: createServerClient } = await import('@/lib/supabase/server')
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('coaching_center_id')
      .eq('id', user.id)
      .single()

    if (!profile?.coaching_center_id) {
      return NextResponse.json({ success: false, error: 'No coaching center found' }, { status: 404 })
    }

    const coachingCenterId = profile.coaching_center_id

    // Check if the code is valid and unused
    const { data: codeData } = await supabaseAdmin
      .from('institute_access_codes')
      .select('id, status, coaching_center_id')
      .eq('code', key.trim().toUpperCase())
      .single()

    if (!codeData) {
      return NextResponse.json({ success: false, error: 'Invalid security key' }, { status: 400 })
    }

    if (codeData.status === 'Used') {
      return NextResponse.json({ success: false, error: 'This security key has already been used' }, { status: 400 })
    }

    // Optional check: if it's pre-assigned, it must match this coaching center
    if (codeData.coaching_center_id && codeData.coaching_center_id !== coachingCenterId) {
      return NextResponse.json({ success: false, error: 'This security key is assigned to a different institute' }, { status: 400 })
    }

    // Mark code as used
    await supabaseAdmin
      .from('institute_access_codes')
      .update({ status: 'Used', coaching_center_id: coachingCenterId })
      .eq('id', codeData.id)

    // Extend the plan by 365 days (1 year)
    const newEndDate = new Date()
    newEndDate.setFullYear(newEndDate.getFullYear() + 1)

    const { error: updateError } = await supabaseAdmin
      .from('coaching_centers')
      .update({
        end_date: newEndDate.toISOString(),
        account_status: 'Active',
        plan_type: 'Standard',
        is_active: true
      })
      .eq('id', coachingCenterId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })

  } catch (e: any) {
    console.error('Renew plan error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

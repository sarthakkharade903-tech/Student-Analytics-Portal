import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('coaching_center_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.coaching_center_id || profile.role !== 'owner') {
      return NextResponse.json({ success: false, message: 'Forbidden: Only owners can update feature settings.' }, { status: 403 })
    }

    const body = await request.json()
    const { features } = body

    if (!features) {
      return NextResponse.json({ success: false, message: 'Features data required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('coaching_centers')
      .update({ features })
      .eq('id', profile.coaching_center_id)

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Update features error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

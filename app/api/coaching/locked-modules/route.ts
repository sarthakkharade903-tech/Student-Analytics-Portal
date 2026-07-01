import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, lockedModules: {} }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('coaching_center_id')
      .eq('id', user.id)
      .single()

    if (!profile?.coaching_center_id) {
      return NextResponse.json({ success: true, lockedModules: {} })
    }

    const { data: center } = await supabase
      .from('coaching_centers')
      .select('features')
      .eq('id', profile.coaching_center_id)
      .single()

    const lockedModules = center?.features?.locked_modules ?? {}

    return NextResponse.json({ success: true, lockedModules })
  } catch (error: any) {
    console.error('Fetch locked modules error:', error)
    return NextResponse.json({ success: false, lockedModules: {} }, { status: 500 })
  }
}

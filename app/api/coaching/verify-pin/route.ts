import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

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
      .select('coaching_center_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.coaching_center_id) {
      return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { featureKey, pin } = body

    if (!featureKey || !pin) {
      return NextResponse.json({ success: false, message: 'Feature Key and PIN required' }, { status: 400 })
    }

    const { data: center } = await supabase
      .from('coaching_centers')
      .select('features')
      .eq('id', profile.coaching_center_id)
      .single()

    const lockedModules = center?.features?.locked_modules || {}
    const actualPin = lockedModules[featureKey]

    if (actualPin && actualPin === pin) {
      // PIN matches, set secure HTTPOnly cookie
      const cookieStore = await cookies()
      cookieStore.set(`unlocked_${featureKey}`, 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      })

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, message: 'Incorrect PIN' })
    }

  } catch (error: any) {
    console.error('Verify PIN error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

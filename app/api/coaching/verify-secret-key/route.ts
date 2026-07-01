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
      .select('coaching_center_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.coaching_center_id) {
      return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { secretKey } = body

    if (!secretKey) {
      return NextResponse.json({ success: false, message: 'Secret Key required' }, { status: 400 })
    }

    // Check if the secret key matches any access code linked to this coaching center
    const { data: accessCode } = await supabase
      .from('institute_access_codes')
      .select('id')
      .eq('coaching_center_id', profile.coaching_center_id)
      .eq('code', secretKey.trim().toUpperCase())
      .maybeSingle()

    if (accessCode) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, message: 'Incorrect Secret Key' })
    }

  } catch (error: any) {
    console.error('Verify secret key error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

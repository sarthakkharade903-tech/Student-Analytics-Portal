import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ success: false, message: 'Password required' }, { status: 400 })
    }

    // Verify the password by attempting to sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    })

    if (authError || !authData.user) {
      return NextResponse.json({ success: false, message: 'Incorrect Password' })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Verify password error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

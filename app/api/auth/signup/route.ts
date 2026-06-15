import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { coachingName, ownerName, email, phone, password, inviteCode } = await req.json()

    // Step 0: Verify invite code server-side
    const validCode = process.env.ADMIN_INVITE_CODE
    if (!validCode) {
      return NextResponse.json({ error: 'Signups are currently disabled.' }, { status: 403 })
    }
    if (!inviteCode || inviteCode.trim() !== validCode.trim()) {
      return NextResponse.json({ error: 'Invalid invite code. Please contact the administrator.' }, { status: 401 })
    }

    // Use service role key — bypasses RLS safely on the server
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Step 1: Check if email already has a complete account (coaching center + user)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists. Please log in instead.' }, { status: 409 })
    }

    // Step 2: Create auth user using the Admin API (service role)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm so they don't need email verification
      user_metadata: { name: ownerName },
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Could not create account.' }, { status: 500 })
    }

    const userId = authData.user.id

    // Step 3: Create coaching center
    const { data: centerData, error: centerError } = await supabase
      .from('coaching_centers')
      .insert({ name: coachingName, phone, email })
      .select('id')
      .single()

    if (centerError || !centerData) {
      // Rollback: delete the auth user we just created
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Failed to create coaching center: ' + centerError?.message }, { status: 500 })
    }

    // Step 4: Create user profile
    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      coaching_center_id: centerData.id,
      name: ownerName,
      email,
      role: 'owner',
    })

    if (userError) {
      // Rollback: delete auth user and coaching center
      await supabase.auth.admin.deleteUser(userId)
      await supabase.from('coaching_centers').delete().eq('id', centerData.id)
      return NextResponse.json({ error: 'Failed to create user profile: ' + userError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

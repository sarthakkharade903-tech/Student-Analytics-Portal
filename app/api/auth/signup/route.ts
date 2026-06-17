import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { coachingName, ownerName, email, phone, password, inviteCode } = await req.json()

    // Use service role key — bypasses RLS safely on the server
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Step 0: Verify invite code against institute_access_codes table
    const { data: accessCodeRecord, error: accessCodeError } = await supabase
      .from('institute_access_codes')
      .select('*')
      .eq('code', inviteCode.trim())
      .eq('status', 'Unused')
      .maybeSingle()

    if (!accessCodeRecord || accessCodeError) {
      return NextResponse.json({ error: 'Invalid or already used invite code. Please contact the administrator.' }, { status: 401 })
    }

    // Step 1: Check if email already has a complete account
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists. Please log in instead.' }, { status: 409 })
    }

    // Step 2: Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: ownerName },
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Could not create account.' }, { status: 500 })
    }

    const userId = authData.user.id

    // Default dates for a standard 1 year plan (fallback)
    const startDate = new Date()
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 1)

    // Step 3: Create or Update coaching center
    let centerData;
    let centerError;

    if (accessCodeRecord.coaching_center_id) {
      // Pre-created by Super Admin, update with final details
      const response = await supabase
        .from('coaching_centers')
        .update({ 
          name: coachingName, 
          owner_name: ownerName,
          phone, 
          email,
        })
        .eq('id', accessCodeRecord.coaching_center_id)
        .select('id')
        .single()
      centerData = response.data
      centerError = response.error
    } else {
      // Legacy code (no pre-created institute)
      const response = await supabase
        .from('coaching_centers')
        .insert({ 
          name: coachingName, 
          owner_name: ownerName,
          phone, 
          email,
          plan_type: 'Standard',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          account_status: 'Active',
          is_active: true
        })
        .select('id')
        .single()
      centerData = response.data
      centerError = response.error
    }

    if (centerError || !centerData) {
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Failed to initialize coaching center: ' + centerError?.message }, { status: 500 })
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
      await supabase.auth.admin.deleteUser(userId)
      await supabase.from('coaching_centers').delete().eq('id', centerData.id)
      return NextResponse.json({ error: 'Failed to create user profile: ' + userError.message }, { status: 500 })
    }

    // Step 5: Mark access code as used and permanently link it
    await supabase.from('institute_access_codes').update({ 
      status: 'Used',
      coaching_center_id: centerData.id
    }).eq('id', accessCodeRecord.id)
    
    // Step 6: Log audit event
    await supabase.from('audit_logs').insert({
      event_type: 'ACCESS_CODE_USED',
      description: `Access code ${accessCodeRecord.code} was used to create coaching center: ${coachingName}`
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

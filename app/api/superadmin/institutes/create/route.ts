import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'

function generateAccessCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed easily confused chars like I, 1, O, 0
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('super_admin_auth')?.value
    const validCode = process.env.SUPER_ADMIN_SECURITY_CODE

    if (!authCookie || authCookie !== validCode) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, owner_name, email, phone, city, plan_type, start_date, end_date, account_status } = body

    if (!name || !owner_name || !email) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Use provided dates or fall back to defaults
    const startDate = start_date ? new Date(start_date) : new Date()
    const endDate = end_date ? new Date(end_date) : (() => {
      const d = new Date()
      if (plan_type === 'Trial') d.setDate(d.getDate() + 14)
      else d.setFullYear(d.getFullYear() + 1)
      return d
    })()

    // 1. Create the Coaching Center
    const { data: centerData, error: centerError } = await supabase
      .from('coaching_centers')
      .insert({
        name,
        owner_name,
        email,
        phone,
        city: city || null,
        plan_type: plan_type || 'Standard',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        account_status: account_status || 'Active',
        is_active: true
      })
      .select('id')
      .single()

    if (centerError || !centerData) {
      return NextResponse.json({ success: false, message: 'Failed to create institute: ' + centerError?.message }, { status: 500 })
    }

    // 2. Generate and store the access code
    let accessCode = generateAccessCode()
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 5) {
      const { data: existing } = await supabase
        .from('institute_access_codes')
        .select('id')
        .eq('code', accessCode)
        .single()

      if (!existing) {
        isUnique = true
      } else {
        accessCode = generateAccessCode()
        attempts++
      }
    }

    const { error: codeError } = await supabase
      .from('institute_access_codes')
      .insert({
        code: accessCode,
        status: 'Unused',
        coaching_center_id: centerData.id
      })

    if (codeError) {
      // rollback
      await supabase.from('coaching_centers').delete().eq('id', centerData.id)
      return NextResponse.json({ success: false, message: 'Failed to create access code' }, { status: 500 })
    }

    // 3. Log it
    await supabase.from('audit_logs').insert({
      event_type: 'INSTITUTE_CREATED',
      description: `Super Admin created institute "${name}" and generated code ${accessCode}`
    })

    return NextResponse.json({ success: true, code: accessCode })

  } catch (error: any) {
    console.error('Create institute error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

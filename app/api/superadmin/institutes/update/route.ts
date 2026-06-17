import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('super_admin_auth')?.value
    const validCode = process.env.SUPER_ADMIN_SECURITY_CODE

    if (!authCookie || authCookie !== validCode) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, owner_name, email, phone, city, plan_type, start_date, end_date, account_status } = body

    if (!id) {
      return NextResponse.json({ success: false, message: 'Institute ID required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('coaching_centers')
      .update({
        name,
        owner_name,
        email,
        phone,
        city,
        plan_type,
        start_date,
        end_date,
        account_status
      })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    await supabase.from('audit_logs').insert({
      event_type: 'INSTITUTE_UPDATED',
      description: `Super Admin updated details for institute: ${name}`
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Update institute error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

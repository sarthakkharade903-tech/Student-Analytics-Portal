import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { inviteCode } = await req.json()

    if (!inviteCode || inviteCode.trim().length < 4) {
      return NextResponse.json({ found: false })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: codeRecord } = await supabase
      .from('institute_access_codes')
      .select('status, coaching_center_id')
      .eq('code', inviteCode.trim().toUpperCase())
      .maybeSingle()

    if (!codeRecord) {
      return NextResponse.json({ found: false, error: 'Invalid invite code.' })
    }

    if (codeRecord.status === 'Used') {
      return NextResponse.json({ found: false, error: 'This invite code has already been used.' })
    }

    // Fetch the pre-created coaching center details
    if (codeRecord.coaching_center_id) {
      const { data: center } = await supabase
        .from('coaching_centers')
        .select('name, owner_name, email, phone, city, plan_type')
        .eq('id', codeRecord.coaching_center_id)
        .single()

      if (center) {
        return NextResponse.json({
          found: true,
          institute: {
            name: center.name,
            owner_name: center.owner_name,
            email: center.email,
            phone: center.phone,
            city: center.city,
            plan_type: center.plan_type,
          }
        })
      }
    }

    return NextResponse.json({ found: true, institute: null })
  } catch (err) {
    return NextResponse.json({ found: false, error: 'Server error' }, { status: 500 })
  }
}

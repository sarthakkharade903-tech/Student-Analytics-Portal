import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { institute_name, owner_name, email_id, mobile_number, location, student_count, remarks } = body

    if (!institute_name || !owner_name || !email_id || !mobile_number || !location || !student_count) {
      return NextResponse.json({ success: false, message: 'Please fill in all required fields.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('demo_leads')
      .insert({
        institute_name,
        owner_name,
        email: email_id,
        mobile_number,
        location,
        student_count: parseInt(student_count),
        remarks: remarks || null,
        status: 'Pending',
      })

    if (error) {
      console.error('Demo lead insert error:', error)
      return NextResponse.json({ success: false, message: 'Failed to submit request. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Demo request submitted successfully!' })
  } catch (error) {
    console.error('Demo submit error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
  }
}

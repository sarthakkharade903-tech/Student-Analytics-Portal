import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { template } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get coaching center ID
    const { data: profile } = await supabase
      .from('users')
      .select('coaching_center_id')
      .eq('id', user.id)
      .single()

    if (!profile?.coaching_center_id) {
      return NextResponse.json({ error: 'No coaching center found' }, { status: 400 })
    }

    // Update the template
    const { error: updateError } = await supabase
      .from('coaching_centers')
      .update({ whatsapp_test_template: template })
      .eq('id', profile.coaching_center_id)

    if (updateError) {
      console.error('Failed to update template', updateError)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Template save error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

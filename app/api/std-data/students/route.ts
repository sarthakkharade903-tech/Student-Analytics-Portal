import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const std = req.nextUrl.searchParams.get('std')
  const standard = std === '12th' ? '12th' : '11th'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userProfile } = await supabase
    .from('users')
    .select('coaching_center_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.coaching_center_id) {
    return NextResponse.json({ students: [] })
  }

  // Use the `standard` column directly — same as dashboard/tests/attendance pages.
  // DO NOT filter by batch name pattern ('%12%') — batches like "CET A", "JEE", "NEET"
  // don't contain "12" so that approach silently returns zero results.
  const { data: students, error } = await supabase
    .from('students')
    .select('id, name, roll_no, batch, parent_phone, pin, created_at')
    .eq('coaching_center_id', userProfile.coaching_center_id)
    .eq('standard', standard)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ students: students ?? [] })
}


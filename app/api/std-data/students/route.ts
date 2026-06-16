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

  let studQuery = supabase
    .from('students')
    .select('id, name, roll_no, batch, parent_phone, created_at')
    .eq('coaching_center_id', userProfile.coaching_center_id)
    .order('created_at', { ascending: false })

  if (standard === '12th') {
    studQuery = studQuery.ilike('batch', '%12%')
  } else {
    studQuery = studQuery.not('batch', 'ilike', '%12%')
  }

  const { data: students, error } = await studQuery

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ students: students ?? [] })
}

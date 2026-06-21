import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const std = req.nextUrl.searchParams.get('std')
  const standard = std === '12th' ? '12th' : '11th'
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userProfile } = await supabase
    .from('users')
    .select('coaching_center_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.coaching_center_id) {
    return NextResponse.json({ tests: [], total: 0 })
  }

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: tests, error, count } = await supabase
    .from('tests')
    .select('*', { count: 'exact' })
    .eq('coaching_center_id', userProfile.coaching_center_id)
    .eq('standard', standard)
    .order('test_date', { ascending: false })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ tests: tests ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE })
}

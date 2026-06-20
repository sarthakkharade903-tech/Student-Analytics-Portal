import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const classParam = searchParams.get('class')
  const standard = classParam === '12' ? '12th' : '11th'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userProfile } = await supabase
    .from('users')
    .select('name, role, coaching_center_id')
    .eq('id', user.id)
    .single()

  const centerId = userProfile?.coaching_center_id

  const [
    { data: coachingCenter },
    { count: studentCount },
    { count: testCount },
    { data: stdStudents },
  ] = await Promise.all([
    centerId
      ? supabase.from('coaching_centers').select('name').eq('id', centerId).single()
      : Promise.resolve({ data: null }),
    centerId
      ? supabase.from('students').select('id', { count: 'exact', head: true }).eq('coaching_center_id', centerId).eq('standard', standard)
      : Promise.resolve({ count: 0 }),
    centerId
      ? supabase.from('tests').select('id', { count: 'exact', head: true }).eq('coaching_center_id', centerId).eq('standard', standard)
      : Promise.resolve({ count: 0 }),
    centerId
      ? supabase.from('students').select('id, batch').eq('coaching_center_id', centerId).eq('standard', standard)
      : Promise.resolve({ data: [] }),
  ])

  let attendanceRate = '--'
  const studentIds = (stdStudents ?? []).map((s: { id: string }) => s.id)
  if (studentIds.length > 0) {
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('is_present')
      .eq('coaching_center_id', centerId)
      .in('student_id', studentIds)

    if (attendanceData && attendanceData.length > 0) {
      const presentCount = attendanceData.filter((a: { is_present: boolean }) => a.is_present).length
      attendanceRate = Math.round((presentCount / attendanceData.length) * 100) + '%'
    }
  }

  // Calculate active batches
  const batches = new Set()
  if (stdStudents) {
    stdStudents.forEach((s: any) => {
      if (s.batch) batches.add(s.batch)
    })
  }
  const activeBatches = batches.size

  return NextResponse.json({
    displayName: userProfile?.name ?? user?.email ?? 'there',
    centerName: coachingCenter?.name ?? 'your institute',
    studentCount: studentCount ?? 0,
    testCount: testCount ?? 0,
    attendanceRate,
    activeBatches,
  })
}

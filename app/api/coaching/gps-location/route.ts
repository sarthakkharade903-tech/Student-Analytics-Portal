import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('coaching_center_id')
      .eq('id', user.id)
      .single()

    if (!profile?.coaching_center_id) {
      return NextResponse.json({ error: 'No coaching center' }, { status: 403 })
    }

    const body = await req.json()
    const lat = typeof body.lat === 'number' ? body.lat : null
    const lon = typeof body.lon === 'number' ? body.lon : null
    const radius = typeof body.radius === 'number' ? Math.max(50, Math.min(500, body.radius)) : 150

    if (lat === null || lon === null) {
      return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('coaching_centers')
      .update({ gps_lat: lat, gps_lon: lon, gps_radius_m: radius })
      .eq('id', profile.coaching_center_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('coaching_center_id')
      .eq('id', user.id)
      .single()

    if (!profile?.coaching_center_id) {
      return NextResponse.json({ error: 'No coaching center' }, { status: 403 })
    }

    const { data: cc } = await supabase
      .from('coaching_centers')
      .select('gps_lat, gps_lon, gps_radius_m')
      .eq('id', profile.coaching_center_id)
      .single()

    return NextResponse.json({
      lat: cc?.gps_lat ?? null,
      lon: cc?.gps_lon ?? null,
      radius: cc?.gps_radius_m ?? 150,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('coaching_center_id')
      .eq('id', user.id)
      .single()

    if (!profile?.coaching_center_id) {
      return NextResponse.json({ error: 'No coaching center' }, { status: 403 })
    }

    const { error } = await supabase
      .from('coaching_centers')
      .update({ gps_lat: null, gps_lon: null })
      .eq('id', profile.coaching_center_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

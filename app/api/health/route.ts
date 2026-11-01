import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Execute a lightweight query to register activity on Supabase and keep it awake
    const { count, error } = await supabase
      .from('coaching_centers')
      .select('id', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json(
        { status: 'error', error: error.message, timestamp: new Date().toISOString() },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        status: 'healthy',
        message: 'StudentIQ database active. Inactivity timer reset.',
        timestamp: new Date().toISOString(),
        institutesCount: count
      },
      { status: 200 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err?.message || 'Unknown error', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}

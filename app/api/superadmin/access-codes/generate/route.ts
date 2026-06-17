import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Function to generate a random 8 character string
function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST() {
  try {
    // Basic auth check
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('super_admin_auth')?.value
    if (!authCookie || authCookie !== process.env.SUPER_ADMIN_SECURITY_CODE) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const newCode = generateRandomCode()

    const { error } = await supabase
      .from('institute_access_codes')
      .insert({
        code: newCode,
        status: 'Unused'
      })

    if (error) throw error

    await supabase.from('audit_logs').insert({
      event_type: 'ACCESS_CODE_GENERATED',
      description: `Access code ${newCode} was generated.`
    })

    return NextResponse.json({ success: true, code: newCode })
  } catch (error) {
    console.error('Generate code error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

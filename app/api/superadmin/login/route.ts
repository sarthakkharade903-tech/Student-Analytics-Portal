import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    const validCode = process.env.SUPER_ADMIN_SECURITY_CODE

    if (!validCode) {
      console.error('SUPER_ADMIN_SECURITY_CODE environment variable is not set')
      return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 })
    }

    if (code === validCode) {
      // Set the auth cookie
      const cookieStore = await cookies()
      cookieStore.set('super_admin_auth', code, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, message: 'Invalid security code' }, { status: 401 })
  } catch (error) {
    console.error('Super admin login error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

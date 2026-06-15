import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { inviteCode } = await req.json()

    const validCode = process.env.ADMIN_INVITE_CODE

    if (!validCode) {
      // If no code is set in env, block all signups as a safety net
      return NextResponse.json({ error: 'Signups are currently disabled.' }, { status: 403 })
    }

    if (!inviteCode || inviteCode.trim() !== validCode.trim()) {
      return NextResponse.json({ error: 'Invalid invite code. Please contact the administrator.' }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}

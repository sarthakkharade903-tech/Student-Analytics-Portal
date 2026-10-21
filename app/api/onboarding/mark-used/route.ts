import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, message: 'Code is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('onboarding_codes')
      .update({ is_used: true })
      .eq('code', code.toUpperCase());

    if (error) {
      return NextResponse.json({ success: false, message: 'Failed to mark code as used.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark-used error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}

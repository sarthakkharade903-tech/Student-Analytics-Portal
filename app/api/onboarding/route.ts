import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { code, services } = await request.json();

    if (!code || !services || services.length === 0) {
      return NextResponse.json({ success: false, message: 'Code and at least one service are required.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('onboarding_codes')
      .insert({
        code,
        services,
        is_used: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error generating code:', error);
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ success: false, message: 'This code already exists.' }, { status: 409 });
      }
      return NextResponse.json({ success: false, message: 'Database error.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}

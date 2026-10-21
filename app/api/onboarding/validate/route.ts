import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { code, service } = await request.json();

    if (!code || !service) {
      return NextResponse.json({ success: false, message: 'Code and service are required.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('onboarding_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, message: 'Invalid security code. Please check and try again.' }, { status: 400 });
    }

    if (data.is_used) {
      return NextResponse.json({ success: false, message: 'This security code has already been used.' }, { status: 400 });
    }

    if (!data.services.includes(service)) {
      return NextResponse.json(
        { success: false, message: `This code is not valid for ${service.replace('_', ' ')}. Please use the correct code for this service.` },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, message: 'Code is valid.' });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}

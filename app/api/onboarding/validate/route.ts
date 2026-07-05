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
      .from('institute_access_codes')
      .select('*, coaching_centers(features)')
      .eq('code', code.trim())
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, message: 'Invalid security code. Please check and try again.' }, { status: 400 });
    }

    if (data.status === 'Used') {
      return NextResponse.json({ success: false, message: 'This security code has already been used.' }, { status: 400 });
    }

    const services = data.coaching_centers?.features?.services;
    const usage = data.coaching_centers?.features?.usage || {};
    
    // If we're checking for a specific service and it's explicitly set to false, reject
    if (service && services && services[service] === false) {
      return NextResponse.json(
        { success: false, message: `This code is not valid for ${service.replace('_', ' ')}. Please use the correct code for this service.` },
        { status: 403 }
      );
    }

    if (service === 'exam_engine' && usage.exam_engine_used) {
      return NextResponse.json({ success: false, message: 'This code has already been used for Exam Engine.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: 'Code is valid.' });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}

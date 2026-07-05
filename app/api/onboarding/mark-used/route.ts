import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, message: 'Code is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch the code to get associated center
    const { data: codeData } = await supabase
      .from('institute_access_codes')
      .select('*, coaching_centers(*)')
      .eq('code', code.trim())
      .single();

    if (!codeData) {
      return NextResponse.json({ success: false, message: 'Invalid code' }, { status: 400 });
    }

    const center = codeData.coaching_centers;
    if (center) {
      const features = center.features || {};
      const usage = features.usage || {};
      const services = features.services || {};

      usage.exam_engine_used = true;

      await supabase.from('coaching_centers').update({
        features: { ...features, usage }
      }).eq('id', center.id);

      const hasCoachingManagement = services.coaching_management;
      const coachingManagementUsed = usage.coaching_management_used;
      const fullyConsumed = (!hasCoachingManagement) || (hasCoachingManagement && coachingManagementUsed);

      if (fullyConsumed) {
        await supabase
          .from('institute_access_codes')
          .update({ status: 'Used' })
          .eq('code', code.trim());
      }
    } else {
      // Legacy code without center
      await supabase
        .from('institute_access_codes')
        .update({ status: 'Used' })
        .eq('code', code.trim());
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark-used error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}

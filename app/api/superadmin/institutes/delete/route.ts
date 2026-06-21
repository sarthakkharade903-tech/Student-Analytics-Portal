import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('super_admin_auth')?.value
    const envSecurityCode = process.env.SUPER_ADMIN_SECURITY_CODE

    if (!authCookie || authCookie !== envSecurityCode) {
      return NextResponse.json({ success: false, message: 'Unauthorized session' }, { status: 401 })
    }

    const { id, security_code } = await request.json()

    if (!id || !security_code) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 })
    }

    if (security_code !== envSecurityCode) {
      return NextResponse.json({ success: false, message: 'Invalid security code. Deletion aborted.' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // 1. Get Coaching Details for audit log
    const { data: center } = await supabase
      .from('coaching_centers')
      .select('name, logo_url')
      .eq('id', id)
      .single()

    if (!center) {
      return NextResponse.json({ success: false, message: 'Institute not found' }, { status: 404 })
    }

    // 2. Fetch all Auth users linked to this institute
    const { data: usersData } = await supabase
      .from('users')
      .select('id')
      .eq('coaching_center_id', id)

    // 3. Delete from Supabase Auth
    if (usersData && usersData.length > 0) {
      for (const u of usersData) {
        await supabase.auth.admin.deleteUser(u.id)
      }
    }

    // 4. Cascade Delete from application tables (manual safety net)
    await supabase.from('attendance').delete().eq('coaching_center_id', id)

    // Delete resources
    await supabase.from('resources').delete().eq('coaching_center_id', id)

    // Delete fee data (order matters: installments → fees → settings → batches)
    const { data: feeRows } = await supabase.from('fees').select('id').eq('coaching_center_id', id)
    if (feeRows && feeRows.length > 0) {
      const feeIds = feeRows.map((f: any) => f.id)
      await supabase.from('fee_installments').delete().in('fee_id', feeIds)
    }
    await supabase.from('fees').delete().eq('coaching_center_id', id)
    await supabase.from('class_fee_settings').delete().eq('coaching_center_id', id)
    await supabase.from('batches').delete().eq('coaching_center_id', id)
    
    // Scores are linked via test_id and student_id, but we can delete tests and students directly
    // Wait, if tests/students are deleted, we should delete scores first.
    // Fetch tests to delete scores
    const { data: tests } = await supabase.from('tests').select('id').eq('coaching_center_id', id)
    if (tests && tests.length > 0) {
      const testIds = tests.map((t: any) => t.id)
      await supabase.from('scores').delete().in('test_id', testIds)
      await supabase.from('tests').delete().eq('coaching_center_id', id)
    }

    await supabase.from('students').delete().eq('coaching_center_id', id)
    await supabase.from('institute_access_codes').delete().eq('coaching_center_id', id)
    await supabase.from('users').delete().eq('coaching_center_id', id)
    
    // 5. Delete the Coaching Center itself
    const { error: deleteError } = await supabase.from('coaching_centers').delete().eq('id', id)

    if (deleteError) {
       console.error("Failed to delete coaching center record:", deleteError)
       return NextResponse.json({ success: false, message: 'Failed to delete institute record' }, { status: 500 })
    }

    // 6. Delete logo from Supabase Storage (academy_logos bucket)
    if (center.logo_url) {
      try {
        // Extract file path from the public URL (everything after /academy_logos/)
        const urlParts = center.logo_url.split('/academy_logos/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split('?')[0] // strip any query params
          await supabase.storage.from('academy_logos').remove([filePath])
        }
      } catch (storageErr) {
        // Non-fatal: log but don't block the delete response
        console.error('Logo storage cleanup failed:', storageErr)
      }
    }

    // 6. Audit Log
    await supabase.from('audit_logs').insert({
      event_type: 'INSTITUTE_DELETED',
      description: `Super Admin permanently deleted coaching institute: ${center.name}`
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Delete institute error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

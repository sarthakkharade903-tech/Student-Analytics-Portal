'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfileAndInstitute(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const ownerName = formData.get('ownerName') as string
  const instituteName = formData.get('instituteName') as string

  if (!ownerName || !instituteName) {
    throw new Error('Name and Institute Name are required')
  }

  // Update User name
  const { data: userProfile, error: userError } = await supabase
    .from('users')
    .update({ name: ownerName })
    .eq('id', user.id)
    .select('coaching_center_id')
    .single()

  if (userError) throw userError

  // Update Coaching Center name
  if (userProfile?.coaching_center_id) {
    const { error: coachingError } = await supabase
      .from('coaching_centers')
      .update({ name: instituteName })
      .eq('id', userProfile.coaching_center_id)

    if (coachingError) throw coachingError
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

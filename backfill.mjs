import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function generateAccessCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function main() {
  console.log('Fetching institutes...')
  const { data: institutes, error: instError } = await supabase.from('coaching_centers').select('id')
  
  if (instError) {
    console.error('Error fetching institutes:', instError)
    return
  }

  const { data: codes, error: codesError } = await supabase.from('institute_access_codes').select('coaching_center_id')
  
  if (codesError) {
    console.error('Error fetching codes:', codesError)
    return
  }

  const institutesWithCodes = new Set(codes.map(c => c.coaching_center_id))

  for (const inst of institutes) {
    if (!institutesWithCodes.has(inst.id)) {
      const code = generateAccessCode()
      console.log(`Generating code ${code} for institute ${inst.id}...`)
      
      const { error: insertError } = await supabase.from('institute_access_codes').insert({
        code,
        status: 'Used', // Mark as Used because they are legacy accounts and already have owners
        coaching_center_id: inst.id
      })

      if (insertError) {
        console.error('Error inserting code:', insertError)
      } else {
        console.log('Success.')
      }
    }
  }

  console.log('Done.')
}

main()

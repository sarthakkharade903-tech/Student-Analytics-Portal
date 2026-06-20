import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cvoihmiwpuitpwujpxzd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2b2lobWl3cHVpdHB3dWpweHpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDgwNTI2MSwiZXhwIjoyMDk2MzgxMjYxfQ.XELap1Q_1AnThqjchHsiqxA1SkOtQ7HLVets4YiXjw0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('Fetching trial accounts...')
  const { data: trials, error: fetchError } = await supabase
    .from('coaching_centers')
    .select('*')
    .eq('plan_type', 'Trial')
    
  if (fetchError) {
    console.error('Fetch error:', fetchError)
    return
  }

  console.log(`Found ${trials?.length || 0} trial accounts.`)

  if (trials) {
    for (const trial of trials) {
      const startDate = new Date(trial.start_date)
      const newEndDate = new Date(startDate)
      newEndDate.setDate(startDate.getDate() + 3)
      
      console.log(`Updating ${trial.name} (${trial.id}) end_date to ${newEndDate.toISOString()}`)
      const { error: updateError } = await supabase
        .from('coaching_centers')
        .update({ end_date: newEndDate.toISOString() })
        .eq('id', trial.id)
        
      if (updateError) {
        console.error(`Update error for ${trial.id}:`, updateError)
      } else {
        console.log(`Successfully updated ${trial.name}`)
      }
    }
  }
}
run()

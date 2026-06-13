import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://cvoihmiwpuitpwujpxzd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2b2lobWl3cHVpdHB3dWpweHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDUyNjEsImV4cCI6MjA5NjM4MTI2MX0.LbaEf_gSknUQHOWcH9UekBEVjBUq36zhr0Qo0F4vXeA'
)

async function migrate() {
  // Test if standard column exists by trying to select it
  const { data: studentTest, error: studentErr } = await supabase
    .from('students')
    .select('standard')
    .limit(1)

  if (studentErr && studentErr.message.includes('standard')) {
    console.log('students.standard column MISSING - please add it via Supabase dashboard SQL editor:')
    console.log("ALTER TABLE students ADD COLUMN standard TEXT NOT NULL DEFAULT '11th';")
  } else {
    console.log('students.standard column EXISTS ✓')
  }

  const { data: testTest, error: testErr } = await supabase
    .from('tests')
    .select('standard')
    .limit(1)

  if (testErr && testErr.message.includes('standard')) {
    console.log('tests.standard column MISSING - please add it via Supabase dashboard SQL editor:')
    console.log("ALTER TABLE tests ADD COLUMN standard TEXT NOT NULL DEFAULT '11th';")
  } else {
    console.log('tests.standard column EXISTS ✓')
  }
}

migrate()

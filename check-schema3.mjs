import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env" })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function run() {
  const { data, error } = await supabase.rpc('get_schema_info')
  if (error) console.log("RPC Error:", error.message)
  
  // Alternative: query information_schema if anon key has permissions (usually doesn't)
}
run()

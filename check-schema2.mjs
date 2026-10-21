import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env" })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function run() {
  const { data, error } = await supabase.from("coaching_centers").select("*").limit(1)
  console.log("Error:", error)
  console.log("Data:", JSON.stringify(data, null, 2))
}
run()

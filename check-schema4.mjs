import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env" })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function run() {
  const { data, error } = await supabase.from("coaching_centers").select("*").limit(1)
  console.log("Coaching center query error:", error)
  console.log("Data keys:", data && data[0] ? Object.keys(data[0]) : "Empty")
}
run()

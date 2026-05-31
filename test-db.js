const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking Supabase connection to:", supabaseUrl);
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("count", { count: "exact", head: true });
    
    if (error) {
      console.error("Error querying profiles table:", error);
    } else {
      console.log("Profiles table exists and is queryable! Count of rows (with anon key):", data);
    }
  } catch (err) {
    console.error("Caught error:", err);
  }
}

run();

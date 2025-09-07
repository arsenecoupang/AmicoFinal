import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dajdwwsnhtxruxrwobcq.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhamR3d3NuaHR4cnV4cndvYmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODA1MTYsImV4cCI6MjA3MTk1NjUxNn0.XwAINWkcD-kolO9bwsR3YeXLKHYRGC6451ALM91b_no";

console.log("DB Config:", {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "MISSING",
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : "MISSING",
  urlLength: supabaseUrl.length,
  keyLength: supabaseAnonKey.length,
  fullUrl: supabaseUrl,
  envCheck: {
    NODE_ENV: process.env.NODE_ENV,
    hasUrl: !!process.env.REACT_APP_SUPABASE_URL,
    hasKey: !!process.env.REACT_APP_SUPABASE_ANON_KEY,
  },
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

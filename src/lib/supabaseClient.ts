import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;
  
  // Use environment variables with fallbacks
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fluzuwaqfkqchzdxtbdn.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsdXp1d2FxZmtxY2h6ZHh0YmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTczNDAsImV4cCI6MjA3Njc5MzM0MH0.T0xQBkbwIOQMxH_ZYqbeRgdlYezyKymNWHKfQIasmS4";
  
  // Log environment status for debugging
  if (typeof window !== 'undefined') {
    console.log('🔧 VIBE Environment Check:');
    console.log('📍 Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('🔑 Supabase Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
    console.log('🌍 Environment:', process.env.NODE_ENV);
  }
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase configuration missing');
    throw new Error("Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  
  cached = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  
  return cached;
}



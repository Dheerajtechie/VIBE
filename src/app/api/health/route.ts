import { getSupabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    const supabase = getSupabase();
    
    // Test Supabase connection
    const { data, error } = await supabase.from("profiles").select("count").limit(1);
    
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      supabase: {
        connected: !error,
        error: error?.message || null
      },
      env_vars: {
        supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabase_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        map_tile_url: !!process.env.NEXT_PUBLIC_MAP_TILE_URL
      }
    };
    
    return Response.json(health, { 
      status: error ? 500 : 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return Response.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

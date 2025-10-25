import { getSupabase } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/onboarding";

  console.log("🔐 Auth callback received:", { code: !!code, next });

  if (code) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data.session) {
        console.log("✅ Magic link authentication successful");
        console.log("👤 User:", data.session.user.email);
        return NextResponse.redirect(`${requestUrl.origin}${next}`);
      } else {
        console.error("❌ Magic link authentication failed:", error);
        return NextResponse.redirect(`${requestUrl.origin}/signin?error=auth_failed&message=${encodeURIComponent(error?.message || 'Authentication failed')}`);
      }
    } catch (err) {
      console.error("❌ Auth callback error:", err);
      return NextResponse.redirect(`${requestUrl.origin}/signin?error=callback_error&message=${encodeURIComponent(err instanceof Error ? err.message : 'Unknown error')}`);
    }
  }

  // If no code, redirect to signin
  console.log("❌ No code provided, redirecting to signin");
  return NextResponse.redirect(`${requestUrl.origin}/signin?error=no_code`);
}

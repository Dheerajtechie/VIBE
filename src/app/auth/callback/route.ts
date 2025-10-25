import { getSupabase } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = getSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      console.log("✅ Magic link authentication successful");
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    } else {
      console.error("❌ Magic link authentication failed:", error);
      return NextResponse.redirect(`${requestUrl.origin}/signin?error=auth_failed`);
    }
  }

  // If no code, redirect to signin
  return NextResponse.redirect(`${requestUrl.origin}/signin`);
}

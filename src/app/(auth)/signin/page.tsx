"use client";

import { getSupabase } from "@/lib/supabaseClient";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendMagicLink() {
    setError(null);
    setLoading(true);
    
    try {
      console.log("📧 Sending magic link to:", email);
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOtp({ 
        email, 
        options: { 
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin + "/onboarding" : undefined 
        } 
      });
      
      if (error) {
        console.error("❌ Magic link error:", error);
        setError(error.message);
      } else {
        console.log("✅ Magic link sent successfully");
        setSent(true);
      }
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      setError("Failed to send magic link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-vibe-purple)" }}>VIBE</h1>
        <p className="text-zinc-600">Feel the moment</p>
      </div>
      <div className="space-y-3 rounded-2xl bg-white p-4 shadow ring-1 ring-black/5 dark:bg-zinc-900">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-xl border px-4 py-3"
        />
        <button 
          className="btn-primary w-full" 
          onClick={sendMagicLink} 
          disabled={!email || loading}
        >
          {loading ? "Sending..." : sent ? "Check your email" : "Send magic link"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <p className="text-xs text-zinc-500">By continuing you agree to our Terms and acknowledge our Privacy Policy.</p>
    </div>
  );
}



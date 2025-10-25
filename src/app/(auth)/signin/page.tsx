"use client";

import { getSupabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for error messages from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const messageParam = urlParams.get('message');
    
    if (errorParam) {
      let errorMessage = 'Authentication failed. Please try again.';
      
      switch (errorParam) {
        case 'auth_failed':
          errorMessage = messageParam || 'Magic link authentication failed.';
          break;
        case 'callback_error':
          errorMessage = messageParam || 'Callback error occurred.';
          break;
        case 'no_code':
          errorMessage = 'No authentication code received.';
          break;
        default:
          errorMessage = messageParam || 'Unknown authentication error.';
      }
      
      setError(errorMessage);
    }
  }, []);

  async function sendMagicLink() {
    setError(null);
    setLoading(true);
    
    try {
      console.log("📧 Sending magic link to:", email);
      console.log("🌍 Current origin:", window.location.origin);
      
      const supabase = getSupabase();
      
      // Test Supabase connection first
      const { data: testData, error: testError } = await supabase.from("profiles").select("count").limit(1);
      if (testError) {
        console.error("❌ Database connection failed:", testError);
        setError("Database connection failed. Please check your setup.");
        setLoading(false);
        return;
      }
      
      console.log("✅ Database connection successful");
      
      const { error } = await supabase.auth.signInWithOtp({ 
        email, 
        options: { 
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`
        } 
      });
      
      if (error) {
        console.error("❌ Magic link error:", error);
        setError(`Magic link failed: ${error.message}`);
      } else {
        console.log("✅ Magic link sent successfully");
        setSent(true);
      }
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      setError(`Failed to send magic link: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    setLoading(true);
    
    try {
      console.log("🔐 Signing in with Google...");
      const supabase = getSupabase();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`
        }
      });
      
      if (error) {
        console.error("❌ Google sign-in error:", error);
        setError(`Google sign-in failed: ${error.message}`);
        setLoading(false);
      }
      // Note: If successful, user will be redirected, so we don't need to handle success case
    } catch (err) {
      console.error("❌ Google sign-in error:", err);
      setError(`Google sign-in failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-vibe-purple)" }}>VIBE</h1>
        <p className="text-zinc-600">Feel the moment</p>
      </div>
      
      {/* Google Sign-in Button */}
      <div className="space-y-3 rounded-2xl bg-white p-4 shadow ring-1 ring-black/5 dark:bg-zinc-900">
        <button 
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={signInWithGoogle}
          disabled={loading}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "Signing in..." : "Continue with Google"}
        </button>
        
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>
      </div>

      {/* Email Magic Link */}
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



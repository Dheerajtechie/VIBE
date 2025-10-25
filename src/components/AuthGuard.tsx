"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "authed" | "guest" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        console.log("🔐 Checking authentication...");
        const supabase = getSupabase();
        const { data, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error("❌ Auth error:", authError);
          setError(authError.message);
          setStatus("error");
          return;
        }
        
        if (data.user) {
          console.log("✅ User authenticated:", data.user.email);
          setStatus("authed");
        } else {
          console.log("❌ No user found, redirecting to signin");
          setStatus("guest");
          window.location.href = "/signin";
        }
      } catch (error) {
        console.error("❌ Auth check failed:", error);
        setError(error instanceof Error ? error.message : "Authentication failed");
        setStatus("error");
      }
    })();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Connection Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (status !== "authed") return null;
  return <>{children}</>;
}



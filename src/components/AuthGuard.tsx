"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "authed" | "guest">("loading");

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getUser();
        setStatus(data.user ? "authed" : "guest");
        if (!data.user) window.location.href = "/signin";
      } catch (error) {
        console.error("Auth check failed:", error);
        setStatus("guest");
        window.location.href = "/signin";
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

  if (status !== "authed") return null;
  return <>{children}</>;
}



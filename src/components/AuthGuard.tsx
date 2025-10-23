"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "authed" | "guest">("loading");

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getUser();
      setStatus(data.user ? "authed" : "guest");
      if (!data.user) window.location.href = "/signin";
    })();
  }, []);

  if (status !== "authed") return null;
  return <>{children}</>;
}



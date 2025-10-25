"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import { VibeStatusSheet } from "@/components/VibeStatusSheet";
import { BottomNav } from "@/components/BottomNav";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      const { data } = await supabase.from("profiles").select("name, status").eq("user_id", user.id).maybeSingle();
      if (data) {
        setName(data.name ?? "");
        setStatus(data.status ?? "");
      }
    })();
  }, []);

  async function save() {
    const supabase = getSupabase();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    await supabase.from("profiles").upsert({ user_id: user.id, name: name.trim(), status });
  }

  async function signOut() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    window.location.href = "/signin";
  }

  return (
    <div className="min-h-dvh pb-20">
      <header className="sticky top-0 z-40 bg-linear-to-b from-white/70 to-transparent p-4 backdrop-blur dark:from-zinc-900/70">
        <h1 className="text-2xl font-semibold">Profile</h1>
      </header>
      <main className="space-y-4 p-4">
        <div className="space-y-2 rounded-2xl bg-white p-4 shadow ring-1 ring-black/5 dark:bg-zinc-900">
          <label className="text-sm text-zinc-600">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
        </div>
        <div className="space-y-2 rounded-2xl bg-white p-4 shadow ring-1 ring-black/5 dark:bg-zinc-900">
          <label className="text-sm text-zinc-600">My Vibe</label>
          <VibeStatusSheet value={status} onChange={setStatus} />
        </div>
        <button className="btn-primary w-full" onClick={save}>Save</button>
        <button className="mt-2 w-full rounded-xl border px-4 py-2" onClick={signOut}>Sign out</button>
      </main>
      <BottomNav />
    </div>
  );
}



"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import { requestLocation } from "@/lib/location";
import { MapView } from "@/components/MapView";
import { DiscoveryCard, type DiscoveryUser } from "@/components/DiscoveryCard";
import { BottomNav } from "@/components/BottomNav";
import Confetti from "./confetti";

export default function DiscoverPage() {
  const [users, setUsers] = useState<DiscoveryUser[]>([]);
  const [center, setCenter] = useState<{ lat: number; lon: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setError(null);
      const { lat, lon } = await requestLocation();
      setCenter({ lat, lon });
      // Upload my location via RPC (server-side casting to geography)
      const supabase = getSupabase();
      const me = (await supabase.auth.getUser()).data.user;
      if (me) {
        await supabase.rpc("update_my_location", { lat, lon });
        await supabase.from("presence").upsert({ user_id: me.id, status: "now" });
      }
      // Fetch nearby via RPC
      const { data, error } = await supabase.rpc("get_nearby_users", { lat, lon, meters: 500 });
      if (error) throw error;
      setUsers((data ?? []).filter((u: any) => u.user_id !== me?.id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const supabase = getSupabase();
    const id = setInterval(async () => {
      const me = (await supabase.auth.getUser()).data.user;
      if (me) await supabase.from("presence").upsert({ user_id: me.id, status: "now" });
      await refresh();
    }, 20000);
    const channel = supabase
      .channel("vibes:me")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "vibes" }, async (payload) => {
        const me = (await supabase.auth.getUser()).data.user;
        if (!me) return;
        // If mutual match happened, open chat
        const { sender_id, receiver_id } = payload.new as any;
        if (sender_id === me.id || receiver_id === me.id) {
          const other = sender_id === me.id ? receiver_id : sender_id;
          const { data: convo } = await supabase.rpc("get_conversation_with", { target_id: other });
          if (convo) {
            setShowConfetti(true);
            setTimeout(() => (window.location.href = `/chat/${convo}`), 800);
          }
        }
      })
      .subscribe();
    return () => {
      clearInterval(id);
      supabase.removeChannel(channel);
    };
  }, []);

  async function sendVibe(targetId: string) {
    const supabase = getSupabase();
    const { error } = await supabase.rpc("send_vibe", { target_id: targetId });
    if (error) alert(error.message);
    setUsers((prev) => prev.map((u) => (u.user_id === targetId ? { ...u, presence: u.presence } : u)));
  }

  return (
    <div className="min-h-dvh pb-20">
      <header className="sticky top-0 z-40 bg-linear-to-b from-white/70 to-transparent p-4 backdrop-blur dark:from-zinc-900/70">
        <h1 className="text-2xl font-semibold">Discover</h1>
        <p className="text-sm text-zinc-500">People within 500m</p>
      </header>
      <main className="space-y-3 p-4">
        {showConfetti && <Confetti show={showConfetti} />}
        <div className="flex items-center justify-between">
          <button className="rounded-xl border px-3 py-2" onClick={() => setShowMap((s) => !s)}>
            {showMap ? "Hide Map" : "Show Map"}
          </button>
          <button className="rounded-xl border px-3 py-2" onClick={refresh}>Refresh</button>
        </div>
        {showMap && center && <MapView center={center} />}
        {loading && <div className="animate-pulse rounded-2xl bg-zinc-200 p-10 dark:bg-zinc-800" />}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {users.map((u) => (
          <DiscoveryCard key={u.user_id} user={u} onVibe={sendVibe} />)
        )}
        {!loading && users.length === 0 && <p className="text-zinc-500">No one nearby yet. Try moving around!</p>}
      </main>
      <BottomNav />
    </div>
  );
}



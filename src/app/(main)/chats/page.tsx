"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import { BottomNav } from "@/components/BottomNav";

type ChatListItem = { id: string; title: string; last_message?: string; unread?: number };

export default function ChatsPage() {
  const [items, setItems] = useState<ChatListItem[]>([]);

  async function load() {
    const supabase = getSupabase();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .select("id, messages:messages(content,created_at)")
      .order("created_at", { ascending: false });
    const mapped = (data ?? []).map((c: any) => ({ id: c.id, title: "Chat", last_message: c.messages?.[0]?.content }));
    setItems(mapped);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-dvh pb-20">
      <header className="sticky top-0 z-40 bg-linear-to-b from-white/70 to-transparent p-4 backdrop-blur dark:from-zinc-900/70">
        <h1 className="text-2xl font-semibold">Chats</h1>
      </header>
      <main className="space-y-2 p-4">
        {items.map((c) => (
          <Link key={c.id} href={`/chat/${c.id}`} className="block rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{c.title}</p>
              <p className="text-sm text-zinc-500">{c.last_message ?? "Start the conversation"}</p>
            </div>
          </Link>
        ))}
        {items.length === 0 && <p className="text-zinc-500">No conversations yet.</p>}
      </main>
      <BottomNav />
    </div>
  );
}



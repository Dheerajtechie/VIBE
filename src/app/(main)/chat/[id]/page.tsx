"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";
import { ChatInput } from "@/components/ChatInput";
import { presenceChannel } from "@/lib/realtime";

type Message = { id: string; sender_id: string; type: "text" | "image"; content: string | null; image_url?: string | null; created_at: string };

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [paused, setPaused] = useState<string>("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("messages")
      .select("id,sender_id,type,content,image_url,created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  useEffect(() => {
    load();
    const supabase = getSupabase();
    const channel = supabase
      .channel(`chat:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` }, (payload) => {
        setMessages((m) => [...m, payload.new as any]);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      })
      .subscribe();
    const presence = presenceChannel(`typing:${id}`, "user");
    presence.on("presence", { event: "sync" }, () => {
      const state = presence.presenceState();
      setTyping(Object.keys(state).length > 0);
    });
    presence.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        const me = (await getSupabase().auth.getUser()).data.user;
        presence.track({ user: me?.id ?? "anon" });
      }
    });
    return () => {
      const s = getSupabase();
      s.removeChannel(channel);
      s.removeChannel(presence);
    };
  }, [id]);

  async function handleSend(payload: { type: "text" | "image"; content?: string; file?: File }) {
    const supabase = getSupabase();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    try {
      if (payload.type === "text") {
        const { error } = await supabase.from("messages").insert({ conversation_id: id, sender_id: user.id, type: "text", content: payload.content });
        if (error) throw error;
      } else if (payload.file) {
        const key = `${id}/${Date.now()}.jpg`;
        const up = await supabase.storage.from("message_images").upload(key, payload.file, { upsert: true, contentType: payload.file.type });
        if (up.error) throw up.error;
        const { data } = supabase.storage.from("message_images").getPublicUrl(key);
        const { error } = await supabase
          .from("messages")
          .insert({ conversation_id: id, sender_id: user.id, type: "image", image_url: data.publicUrl });
        if (error) throw error;
      }
      setPaused("");
    } catch (e: any) {
      console.error("Send message error:", e);
      setPaused(e.message ?? "Failed to send");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 bg-white/80 p-3 backdrop-blur dark:bg-zinc-900/80">
        <h1 className="text-lg font-semibold">Chat</h1>
        {typing && <p className="text-xs text-zinc-500">typing…</p>}
        {paused && <p className="text-xs text-red-600">{paused}</p>}
      </header>
      <main className="flex-1 space-y-2 p-3">
        {messages.map((m) => (
          <div key={m.id} className="max-w-[80%] rounded-2xl bg-white p-3 shadow ring-1 ring-black/5 dark:bg-zinc-900">
            {m.type === "text" ? <p>{m.content}</p> : <img src={m.image_url ?? ""} alt="img" className="rounded-xl" />}
            <p className="mt-1 text-right text-[10px] text-zinc-500">{new Date(m.created_at).toLocaleTimeString()}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </main>
      <ChatInput onSend={handleSend} />
    </div>
  );
}



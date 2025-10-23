"use client";

import { useState, useRef, useEffect } from "react";
import { compressImage } from "@/lib/image";
import { presenceChannel } from "@/lib/realtime";

export function ChatInput({ onSend }: { onSend: (payload: { type: "text" | "image"; content?: string; file?: File }) => void }) {
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const presenceRef = useRef<ReturnType<typeof presenceChannel> | null>(null);

  useEffect(() => {
    // Derive conversation id from location path
    const match = typeof window !== "undefined" ? window.location.pathname.match(/\/chat\/(.+)$/) : null;
    const id = match?.[1];
    if (!id) return;
    setTopic(`typing:${id}`);
    const ch = presenceChannel(`typing:${id}`, "user");
    presenceRef.current = ch;
    ch.subscribe();
    return () => {
      if (presenceRef.current) {
        // @ts-ignore
        ch.untrack();
      }
    };
  }, []);

  async function sendText() {
    const t = text.trim();
    if (!t) return;
    onSend({ type: "text", content: t });
    setText("");
    if (presenceRef.current) {
      // @ts-ignore
      presenceRef.current.untrack();
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const compressed = await compressImage(f);
    onSend({ type: "image", file: compressed });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="flex items-end gap-2 p-3">
      <button className="rounded-xl border px-3 py-2" onClick={() => fileRef.current?.click()} aria-label="Attach photo">
        📎
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
      <textarea
        rows={1}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (presenceRef.current) {
            presenceRef.current.track({ user: "typing" });
          }
        }}
        placeholder="Type a message"
        className="flex-1 resize-none rounded-2xl border bg-white p-3 outline-none placeholder:text-zinc-400 dark:bg-zinc-900"
      />
      <button className="btn-primary" onClick={sendText}>
        Send
      </button>
    </div>
  );
}



"use client";

import { useState } from "react";

const STATUSES = [
  { emoji: "😊", text: "Open to chat" },
  { emoji: "☕", text: "Coffee time" },
  { emoji: "📚", text: "Study buddy" },
  { emoji: "🚶", text: "Taking a walk" },
  { emoji: "💼", text: "Work break" },
  { emoji: "🎵", text: "Music lover" },
];

export function VibeStatusSheet({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [custom, setCustom] = useState("");
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {STATUSES.map((s) => (
          <button key={s.text} className="rounded-xl border px-3 py-2 text-left" onClick={() => onChange(`${s.emoji} ${s.text}`)}>
            {s.emoji} {s.text}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Custom status"
          className="flex-1 rounded-xl border px-3 py-2"
        />
        <button className="btn-primary" onClick={() => custom.trim() && onChange(custom.trim())}>
          Set
        </button>
      </div>
      {value && <p className="text-sm text-zinc-500">Current: {value}</p>}
    </div>
  );
}



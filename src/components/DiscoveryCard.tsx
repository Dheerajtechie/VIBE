"use client";

import { metersToLabel } from "@/lib/distance";

export type DiscoveryUser = {
  user_id: string;
  name: string;
  avatar_url?: string | null;
  approx_distance_m: number;
  presence: "now" | "5min" | "away" | string;
};

export function DiscoveryCard({ user, onVibe }: { user: DiscoveryUser; onVibe: (userId: string) => void }) {
  const presenceClass =
    user.presence === "now" ? "online-now" : user.presence === "5min" ? "online-5m" : "online-away";
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow ring-1 ring-black/5 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <img
          src={user.avatar_url ?? "/vercel.svg"}
          alt={user.name}
          className="h-16 w-16 rounded-full object-cover ring-2 ring-white"
        />
        <div>
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold">{user.name}</p>
            <span className={`online-dot ${presenceClass}`} />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{metersToLabel(user.approx_distance_m)}</p>
        </div>
      </div>
      <button className="btn-primary" onClick={() => onVibe(user.user_id)}>
        Send Vibe
      </button>
    </div>
  );
}



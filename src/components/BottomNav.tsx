"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const tabs = [
  { href: "/discover", label: "Discover", icon: "🧭" },
  { href: "/chats", label: "Chats", icon: "💬" },
  { href: "/profile", label: "Profile", icon: "🙂" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-3 left-1/2 z-50 w-[94%] -translate-x-1/2 rounded-2xl bg-white/90 px-3 py-2 shadow-lg ring-1 ring-black/5 backdrop-blur dark:bg-zinc-900/80">
      <ul className="grid grid-cols-3">
        {tabs.map((t) => (
          <li key={t.href} className="flex items-center justify-center">
            <Link
              href={t.href}
              className={clsx(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-xs",
                pathname?.startsWith(t.href)
                  ? "text-[--color-vibe-purple]"
                  : "text-zinc-600 dark:text-zinc-300",
              )}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              <span>{t.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}



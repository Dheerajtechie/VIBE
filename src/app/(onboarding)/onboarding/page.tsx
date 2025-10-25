"use client";

import { getSupabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const supabase = getSupabase();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("❌ Auth check failed:", error);
          setError("Authentication failed. Please try again.");
          setAuthLoading(false);
          return;
        }
        
        if (!user) {
          console.log("❌ No user found, redirecting to signin");
          window.location.href = "/signin";
          return;
        }
        
        console.log("✅ User authenticated:", user.email);
        setAuthLoading(false);
      } catch (err) {
        console.error("❌ Auth check error:", err);
        setError("Authentication error. Please try again.");
        setAuthLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  async function handleContinue() {
    setError(null);
    if (name.trim().length < 3 || name.trim().length > 20) {
      setError("Name must be 3-20 characters");
      return;
    }
    setLoading(true);
    const supabase = getSupabase();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setError("Not signed in");
      setLoading(false);
      return;
    }
    let avatarUrl: string | undefined;
    if (avatar) {
      const path = `${user.id}/${Date.now()}.jpg`;
      await supabase.storage.from("avatars").upload(path, avatar, { upsert: true, contentType: avatar.type });
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      avatarUrl = data.publicUrl;
    }
    await supabase.from("profiles").upsert({ user_id: user.id, name: name.trim(), avatar_url: avatarUrl });
    window.location.href = "/discover";
  }

  if (authLoading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Welcome to VIBE</h1>
      <div className="space-y-3 rounded-2xl bg-white p-4 shadow ring-1 ring-black/5 dark:bg-zinc-900">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-xl border px-4 py-3"
        />
        <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] ?? null)} />
        <button className="btn-primary w-full" onClick={handleContinue} disabled={loading}>
          Continue
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <p className="text-xs text-zinc-500">Add a photo so people nearby recognize you.</p>
    </div>
  );
}



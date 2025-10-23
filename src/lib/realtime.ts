import { getSupabase } from "./supabaseClient";

export function subscribeToTable<T>(table: string, filter: string, onInsert: (row: T) => void, onUpdate?: (row: T) => void) {
  const supabase = getSupabase();
  const channel = supabase.channel(`${table}:${filter}`);
  channel
    .on("postgres_changes", { event: "INSERT", schema: "public", table, filter }, (payload) => onInsert(payload.new as T))
    .on("postgres_changes", { event: "UPDATE", schema: "public", table, filter }, (payload) => onUpdate?.(payload.new as T))
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function presenceChannel(topic: string, key: string) {
  const supabase = getSupabase();
  return supabase.channel(topic, { config: { presence: { key } } });
}



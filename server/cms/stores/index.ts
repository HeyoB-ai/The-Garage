/**
 * Store factory — env-gated. If SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are
 * set, commands are persisted to Supabase; otherwise an in-memory store is used
 * (no durable history, but the flow still works since it is client-authoritative).
 *
 * A module-level singleton avoids recreating the client on every request.
 */
import type { CommandStore } from "./types";
import { MemoryStore } from "./memory";
import { SupabaseStore } from "./supabase";

let cached: CommandStore | null = null;

export function getStore(): CommandStore {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  cached = url && key ? new SupabaseStore(url, key) : new MemoryStore();
  return cached;
}

export type { CommandStore } from "./types";

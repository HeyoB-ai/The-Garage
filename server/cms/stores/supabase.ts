/**
 * Supabase-backed command store.
 *
 * Persists each command to `ai_commands` (typed columns for querying + a `data`
 * jsonb holding the full ApiCommand) and mirrors its step log to `command_logs`
 * (idempotent: replaced on each save). See supabase/migrations for the schema.
 *
 * Uses the SERVICE ROLE key — server-side only, never exposed to the browser.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ApiCommand } from "../../../src/lib/cms/contract";
import type { CommandStore, ListOptions } from "./types";

export class SupabaseStore implements CommandStore {
  readonly name = "supabase";
  private db: SupabaseClient;

  constructor(url: string, serviceKey: string) {
    this.db = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }

  async save(command: ApiCommand, customerId: string | null = null): Promise<ApiCommand> {
    const row = {
      id: command.id,
      customer_id: customerId,
      input_text: command.inputText,
      transcript_source: command.transcriptSource,
      intent: command.intent,
      status: command.status,
      requires_approval: command.requiresApproval,
      branch_name: command.branchName,
      preview_url: command.previewUrl,
      created_at: command.createdAt,
      approved_at: command.approvedAt,
      deployed_at: command.deployedAt,
      data: command,
    };
    const { error } = await this.db.from("ai_commands").upsert(row, { onConflict: "id" });
    if (error) throw new Error(`Supabase save failed: ${error.message}`);

    // Mirror the step log (idempotent replace).
    await this.db.from("command_logs").delete().eq("command_id", command.id);
    if (command.logs.length > 0) {
      const logs = command.logs.map((l) => ({
        command_id: command.id,
        step: l.step,
        message: l.message,
        created_at: l.at,
      }));
      await this.db.from("command_logs").insert(logs);
    }
    return command;
  }

  async get(id: string): Promise<ApiCommand | undefined> {
    const { data, error } = await this.db
      .from("ai_commands")
      .select("data")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Supabase get failed: ${error.message}`);
    return (data?.data as ApiCommand) ?? undefined;
  }

  async list(opts: ListOptions = {}): Promise<ApiCommand[]> {
    let query = this.db
      .from("ai_commands")
      .select("data")
      .order("created_at", { ascending: false })
      .limit(opts.limit ?? 50);
    if (opts.customerId) query = query.eq("customer_id", opts.customerId);

    const { data, error } = await query;
    if (error) throw new Error(`Supabase list failed: ${error.message}`);
    return (data ?? []).map((r) => r.data as ApiCommand);
  }
}

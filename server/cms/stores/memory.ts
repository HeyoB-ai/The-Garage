/**
 * In-memory command store. Default when no database is configured. On
 * serverless this is per-invocation (ephemeral) — fine, because the command
 * flow is client-authoritative; persistence is only needed for durable history.
 */
import type { ApiCommand } from "../../../src/lib/cms/contract";
import type { CommandStore, ListOptions } from "./types";

const commands = new Map<string, ApiCommand>();

export class MemoryStore implements CommandStore {
  readonly name = "memory";

  async save(command: ApiCommand): Promise<ApiCommand> {
    commands.set(command.id, command);
    return command;
  }

  async get(id: string): Promise<ApiCommand | undefined> {
    return commands.get(id);
  }

  async list(opts: ListOptions = {}): Promise<ApiCommand[]> {
    const all = Array.from(commands.values()).sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    );
    return opts.limit ? all.slice(0, opts.limit) : all;
  }
}

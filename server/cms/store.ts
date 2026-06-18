/**
 * In-memory command store.
 *
 * Step 1 keeps commands in process memory so the API is fully functional
 * without external services. SWAP TARGET: replace this module with a Supabase
 * implementation of the same interface (see DATABASE_SCHEMA.md → ai_commands /
 * command_logs). The router only depends on the four methods below.
 */
import type { ApiCommand } from "../../src/lib/cms/contract";

const commands = new Map<string, ApiCommand>();

export interface CommandStore {
  save(command: ApiCommand): ApiCommand;
  get(id: string): ApiCommand | undefined;
  list(): ApiCommand[];
}

export const store: CommandStore = {
  save(command) {
    commands.set(command.id, command);
    return command;
  },
  get(id) {
    return commands.get(id);
  },
  list() {
    return Array.from(commands.values()).sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    );
  },
};

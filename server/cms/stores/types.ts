/**
 * Persistence seam for CMS commands. Async so it works for both the in-memory
 * store and an external database (Supabase). The factory in ./index picks an
 * implementation based on environment variables.
 */
import type { ApiCommand } from "../../../src/lib/cms/contract";

export interface ListOptions {
  customerId?: string;
  limit?: number;
}

export interface CommandStore {
  readonly name: string;
  save(command: ApiCommand, customerId?: string | null): Promise<ApiCommand>;
  get(id: string): Promise<ApiCommand | undefined>;
  list(opts?: ListOptions): Promise<ApiCommand[]>;
}

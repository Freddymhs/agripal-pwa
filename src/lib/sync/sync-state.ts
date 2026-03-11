/**
 * In-memory cache for sync_habilitado flag using window as shared storage.
 *
 * Module-level variables are NOT reliable across Next.js code-split chunks —
 * dynamic imports can create separate module instances with separate scopes.
 * Using window guarantees a single shared reference across all chunks.
 *
 * Dexie hooks fire inside a transaction that only includes the write table.
 * Reading sync_meta from within that transaction zone throws
 * "Table not part of transaction". This synchronous flag avoids that.
 */

const WIN_KEY = "__agriplan_sync_habilitado__" as const;

type AgriPlanWindow = Window & { [WIN_KEY]?: boolean };

export function getSyncHabilitado(): boolean {
  if (typeof window === "undefined") return false;
  return (window as AgriPlanWindow)[WIN_KEY] === true;
}

export function setSyncHabilitadoFlag(value: boolean): void {
  if (typeof window === "undefined") return;
  (window as AgriPlanWindow)[WIN_KEY] = value;
}

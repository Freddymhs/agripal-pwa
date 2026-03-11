import { db } from "@/lib/db";
import { setSyncHabilitadoFlag } from "@/lib/sync/sync-state";

const SYNC_HABILITADO_KEY = "sync_habilitado";

export const syncMetaDAL = {
  isSyncHabilitado: async (): Promise<boolean> => {
    const meta = await db.sync_meta.get(SYNC_HABILITADO_KEY);
    const value = meta?.value === "true";
    // Keep in-memory flag in sync so hooks can check synchronously
    setSyncHabilitadoFlag(value);
    return value;
  },

  setSyncHabilitado: async (habilitado: boolean): Promise<void> => {
    // Update in-memory flag immediately so hooks see it before the DB write completes
    setSyncHabilitadoFlag(habilitado);
    await db.sync_meta.put({
      key: SYNC_HABILITADO_KEY,
      value: String(habilitado),
    });
  },
};

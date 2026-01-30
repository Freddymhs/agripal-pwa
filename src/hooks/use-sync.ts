"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ejecutarSync, setAdapter } from "@/lib/sync/engine";
import {
  contarPendientes,
  obtenerConflictos,
  resolverConflicto as resolverConflictoQueue,
} from "@/lib/sync/queue";
import { mockAdapter } from "@/lib/sync/adapters";
import type { SyncItem, UUID } from "@/types";

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  conflicts: SyncItem[];
  lastSyncAt: Date | null;
  error: string | null;
}

export function useSync() {
  const [state, setState] = useState<SyncState>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    conflicts: [],
    lastSyncAt: null,
    error: null,
  });

  const isMountedRef = useRef(true);
  const isSyncingRef = useRef(false);

  const updateCounts = useCallback(async () => {
    if (!isMountedRef.current) return;
    try {
      const [pendingCount, conflicts] = await Promise.all([
        contarPendientes(),
        obtenerConflictos(),
      ]);
      setState((prev) => ({ ...prev, pendingCount, conflicts }));
    } catch (error) {
      console.error("Error updating counts:", error);
    }
  }, []);

  const doSync = useCallback(async () => {
    if (!isMountedRef.current || isSyncingRef.current || !state.isOnline)
      return;

    isSyncingRef.current = true;
    setState((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      await ejecutarSync();

      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncAt: new Date(),
        }));
        await updateCounts();
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          error: error instanceof Error ? error.message : "Error de sync",
        }));
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [state.isOnline, updateCounts]);

  const resolveConflict = useCallback(
    async (id: UUID, decision: "local" | "servidor") => {
      await resolverConflictoQueue(id, decision);
      await updateCounts();
      if (decision === "local") {
        doSync();
      }
    },
    [updateCounts, doSync],
  );

  useEffect(() => {
    isMountedRef.current = true;
    setAdapter(mockAdapter);

    const timers: ReturnType<typeof setTimeout>[] = [];

    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      timers.push(setTimeout(() => doSync(), 1000));
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    updateCounts();

    if (navigator.onLine) {
      timers.push(setTimeout(() => doSync(), 2000));

      timers.push(
        setInterval(() => {
          if (navigator.onLine && !isSyncingRef.current) {
            doSync();
          }
          updateCounts();
        }, 30000),
      );
    }

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      timers.forEach((t) => clearTimeout(t));
    };
  }, [doSync, updateCounts]);

  return {
    ...state,
    sync: doSync,
    resolveConflict,
    refreshCounts: updateCounts,
  };
}

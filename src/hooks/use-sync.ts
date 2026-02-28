"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { logger } from "@/lib/logger";
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

const SYNC_INTERVAL_MS = 30_000;
const RECONNECT_DELAY_MS = 1_000;
const INITIAL_SYNC_DELAY_MS = 2_000;
const ONLINE_DEBOUNCE_MS = 2_000;

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
  const isOnlineRef = useRef(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  const updateCounts = useCallback(async () => {
    if (!isMountedRef.current) return;
    try {
      const [pendingCount, conflicts] = await Promise.all([
        contarPendientes(),
        obtenerConflictos(),
      ]);
      setState((prev) => ({ ...prev, pendingCount, conflicts }));
    } catch (error) {
      logger.error("Error updating counts", { error });
    }
  }, []);

  const doSyncRef = useRef<(() => Promise<void>) | undefined>(undefined);

  const doSync = useCallback(async () => {
    if (!isMountedRef.current || isSyncingRef.current || !isOnlineRef.current)
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
      logger.error("Error durante sincronización", { error });
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
  }, [updateCounts]);

  doSyncRef.current = doSync;

  const resolveConflict = useCallback(
    async (id: UUID, decision: "local" | "servidor") => {
      try {
        await resolverConflictoQueue(id, decision);
        await updateCounts();
        if (decision === "local") {
          doSyncRef.current?.();
        }
      } catch (error) {
        logger.error("Error resolving conflict", { error });
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Error al resolver conflicto",
        }));
      }
    },
    [updateCounts],
  );

  useEffect(() => {
    isMountedRef.current = true;
    setAdapter(mockAdapter);

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let onlineDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      isOnlineRef.current = true;

      if (onlineDebounceTimer) clearTimeout(onlineDebounceTimer);
      onlineDebounceTimer = setTimeout(() => {
        setState((prev) => ({ ...prev, isOnline: true }));
        timeouts.push(
          setTimeout(() => doSyncRef.current?.(), RECONNECT_DELAY_MS),
        );
      }, ONLINE_DEBOUNCE_MS);
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
      if (onlineDebounceTimer) {
        clearTimeout(onlineDebounceTimer);
        onlineDebounceTimer = null;
      }
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    updateCounts();

    if (navigator.onLine) {
      timeouts.push(
        setTimeout(() => doSyncRef.current?.(), INITIAL_SYNC_DELAY_MS),
      );
    }

    intervalId = setInterval(() => {
      if (isOnlineRef.current && !isSyncingRef.current) {
        doSyncRef.current?.();
      }
      updateCounts();
    }, SYNC_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      timeouts.forEach((t) => clearTimeout(t));
      if (onlineDebounceTimer) clearTimeout(onlineDebounceTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [updateCounts]);

  return {
    ...state,
    sync: doSync,
    resolveConflict,
    refreshCounts: updateCounts,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { authDAL } from "@/lib/dal/auth";

const RECOVERY_ERROR_MESSAGE =
  "El enlace de recuperación es inválido o expiró. Solicita uno nuevo.";

export interface UsePasswordRecovery {
  loading: boolean;
  ready: boolean;
  error: string;
  updatePassword: (password: string) => Promise<{ error?: string }>;
}

export function usePasswordRecovery(): UsePasswordRecovery {
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const setSafeState = (next: {
      loading?: boolean;
      ready?: boolean;
      error?: string;
    }) => {
      if (!active) return;
      if (typeof next.loading === "boolean") setLoading(next.loading);
      if (typeof next.ready === "boolean") setReady(next.ready);
      if (typeof next.error === "string") setError(next.error);
    };

    const {
      data: { subscription },
    } = authDAL.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session?.user) {
        setSafeState({ ready: true, loading: false, error: "" });
      }
    });

    const init = async () => {
      setSafeState({ loading: true, error: "" });

      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const errorParam = url.searchParams.get("error");
        if (errorParam) {
          setSafeState({
            loading: false,
            error: RECOVERY_ERROR_MESSAGE,
          });
          return;
        }
        if (code) {
          const { error: exchangeError } =
            await authDAL.exchangeCodeForSession(code);
          if (exchangeError) {
            setSafeState({ loading: false, error: exchangeError.message });
            return;
          }
        }

        const { data, error: sessionError } = await authDAL.getSession();
        if (sessionError) {
          setSafeState({ loading: false, error: sessionError.message });
          return;
        }

        if (data.session?.user) {
          setSafeState({ ready: true, loading: false, error: "" });
          return;
        }

        const hash = window.location.hash ?? "";
        const hasRecoveryParams =
          code ||
          hash.includes("access_token") ||
          hash.includes("refresh_token") ||
          hash.includes("type=recovery");

        if (!hasRecoveryParams) {
          setSafeState({ loading: false, error: RECOVERY_ERROR_MESSAGE });
          return;
        }

        setSafeState({ loading: false });
      } catch {
        setSafeState({ loading: false, error: RECOVERY_ERROR_MESSAGE });
      }
    };

    init();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error: updateError } = await authDAL.updatePassword(password);
    if (updateError) return { error: updateError.message };
    return {};
  }, []);

  return { loading, ready, error, updatePassword };
}

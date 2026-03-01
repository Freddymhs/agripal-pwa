"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { COOKIE_KEYS, STORAGE_KEYS } from "@/lib/constants/storage";

function getAuthSnapshot() {
  const inCookie = document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${COOKIE_KEYS.TOKEN}=`));
  const inStorage = !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  return inCookie || inStorage;
}

function getServerSnapshot() {
  return false;
}

const NOOP_SUBSCRIBE = () => () => {};

export function LandingAccessButton() {
  const router = useRouter();
  const authed = useSyncExternalStore(
    NOOP_SUBSCRIBE,
    getAuthSnapshot,
    getServerSnapshot,
  );

  const handlePrimary = useCallback(() => {
    if (getAuthSnapshot()) {
      router.push(ROUTES.HOME);
    } else {
      router.push(ROUTES.AUTH_LOGIN);
    }
  }, [router]);

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handlePrimary}
        className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-lg transition-opacity hover:opacity-90 self-start"
        style={{ background: "#2d6a4f", color: "#fff" }}
      >
        {authed ? "Ver planner →" : "Probar gratis →"}
      </button>
      <p className="text-sm" style={{ color: "#7fb38a" }}>
        {authed
          ? "Ya tienes sesión: te llevamos directo al planner."
          : "Si ya tienes sesión, te llevamos directo al planner."}
      </p>
    </div>
  );
}

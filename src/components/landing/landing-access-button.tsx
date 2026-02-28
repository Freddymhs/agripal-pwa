"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { COOKIE_KEYS, STORAGE_KEYS } from "@/lib/constants/storage";

function hasAuthToken() {
  if (typeof document === "undefined") return false;
  const inCookie = document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${COOKIE_KEYS.TOKEN}=`));
  const inStorage = !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  return inCookie || inStorage;
}

export function LandingAccessButton() {
  const router = useRouter();
  const [authed] = useState(() => hasAuthToken());

  const handlePrimary = useCallback(() => {
    if (hasAuthToken()) {
      router.push(ROUTES.HOME);
    } else {
      router.push(ROUTES.AUTH_LOGIN);
    }
  }, [router]);

  return (
    <div className="mt-8 flex flex-col gap-2">
      <button
        onClick={handlePrimary}
        className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-green-600 text-white font-semibold shadow-md hover:bg-green-700 transition-colors"
      >
        {authed ? "Ver planner" : "Ingresar / Registrarse"}
      </button>
      <p className="text-sm text-gray-600">
        {authed
          ? "Ya tienes sesión: te llevamos directo al planner."
          : "Si ya tienes sesión, te llevamos directo. Si no, verás el login/registro."}
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/constants/routes";

export function LandingAccessButton() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handlePrimary = useCallback(() => {
    if (authed) {
      router.push(ROUTES.HOME);
    } else {
      router.push(ROUTES.AUTH_LOGIN);
    }
  }, [authed, router]);

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

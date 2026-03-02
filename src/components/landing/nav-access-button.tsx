"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/constants/routes";

export function NavAccessButton() {
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

  const handle = useCallback(() => {
    router.push(authed ? ROUTES.HOME : ROUTES.AUTH_REGISTRO);
  }, [authed, router]);

  return (
    <button
      onClick={handle}
      className="text-sm font-semibold rounded-lg px-4 py-2 min-h-[44px] transition-opacity hover:opacity-90 shrink-0"
      style={{ background: "#2d6a4f", color: "#fff" }}
    >
      {authed ? "Ver planner →" : "Probar gratis"}
    </button>
  );
}

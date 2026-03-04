"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/constants/routes";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}${ROUTES.AUTH_NUEVA_PASSWORD}`
        : ROUTES.AUTH_NUEVA_PASSWORD;

    const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );

    setLoading(false);

    if (supabaseError) {
      setError(supabaseError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600">AgriPlan</h1>
          <p className="text-gray-500 mt-2">
            Planificación agrícola inteligente
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-bold text-center">
            Recuperar contraseña
          </h2>

          {sent ? (
            <div className="space-y-4">
              <div className="bg-green-50 text-green-700 p-4 rounded text-sm text-center">
                Revisa tu correo — te enviamos un enlace para restablecer tu
                contraseña.
              </div>
              <div className="text-center">
                <Link
                  href={ROUTES.AUTH_LOGIN}
                  className="text-sm text-green-600 hover:underline"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                Ingresa tu email y te enviaremos un enlace para restablecer tu
                contraseña.
              </p>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                  autoComplete="email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-medium text-white ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {loading ? "Enviando..." : "Enviar enlace"}
              </button>

              <div className="text-center">
                <Link
                  href={ROUTES.AUTH_LOGIN}
                  className="text-sm text-green-600 hover:underline"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

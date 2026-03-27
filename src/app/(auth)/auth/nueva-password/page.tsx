"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { usePasswordRecovery } from "@/hooks/use-password-recovery";

const MIN_PASSWORD_LENGTH = 6;

export default function NuevaPasswordPage() {
  const router = useRouter();
  const {
    loading: recoveryLoading,
    ready: recoveryReady,
    error: recoveryError,
    updatePassword,
  } = usePasswordRecovery();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!recoveryReady) {
      setFormError(
        "Estamos validando tu enlace de recuperación. Espera unos segundos.",
      );
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setFormError(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    const { error: updateError } = await updatePassword(newPassword);

    setLoading(false);

    if (updateError) {
      setFormError(updateError);
    } else {
      router.push(
        `${ROUTES.AUTH_LOGIN}?mensaje=Contraseña actualizada correctamente`,
      );
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

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-lg shadow space-y-4"
        >
          <h2 className="text-xl font-bold text-center">
            Establecer nueva contraseña
          </h2>

          {recoveryLoading && (
            <div className="bg-gray-50 text-gray-600 p-3 rounded text-sm">
              Validando enlace de recuperación...
            </div>
          )}

          {(formError || recoveryError) && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              {formError || recoveryError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-base"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Mínimo {MIN_PASSWORD_LENGTH} caracteres
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-base"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || recoveryLoading || !recoveryReady}
            className={`w-full py-3 rounded-lg font-medium text-white ${
              loading || recoveryLoading || !recoveryReady
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {loading ? "Guardando..." : "Guardar nueva contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "@/components/layout";
import { useAuthContext } from "@/components/providers/auth-provider";
import { syncMetaDAL } from "@/lib/dal/sync-meta";
import {
  ejecutarCargaInicial,
  type UploadProgress,
} from "@/lib/sync/initial-upload";
import {
  limpiarErroresPermanentes,
  contarErroresPermanentes,
} from "@/lib/sync/queue";
import { logger } from "@/lib/logger";

type SyncStatus = "idle" | "uploading" | "success" | "error";

export default function ConfiguracionPage() {
  const { isAuthenticated } = useAuthContext();
  const [syncHabilitado, setSyncHabilitado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [erroresPermanentes, setErroresPermanentes] = useState(0);
  const [limpiando, setLimpiando] = useState(false);

  useEffect(() => {
    syncMetaDAL.isSyncHabilitado().then((habilitado) => {
      setSyncHabilitado(habilitado);
      setLoading(false);
    });
    contarErroresPermanentes().then(setErroresPermanentes);
  }, []);

  const activarSync = useCallback(async () => {
    setConfirmando(false);
    setStatus("uploading");
    setErrorMsg(null);

    try {
      await ejecutarCargaInicial((p) => setProgress(p));
      setSyncHabilitado(true);
      setStatus("success");
    } catch (err) {
      logger.error("Error activando sync", { err });
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
      setStatus("error");
    }
  }, []);

  const limpiarErrores = useCallback(async () => {
    setLimpiando(true);
    try {
      await limpiarErroresPermanentes();
      setErroresPermanentes(0);
    } catch (err) {
      logger.error("Error limpiando cola de sync", { err });
    } finally {
      setLimpiando(false);
    }
  }, []);

  const desactivarSync = useCallback(async () => {
    await syncMetaDAL.setSyncHabilitado(false);
    setSyncHabilitado(false);
    setStatus("idle");
    setProgress(null);
  }, []);

  return (
    <PageLayout headerColor="green">
      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <h1 className="text-xl font-bold text-gray-900">
          Configuraci&oacute;n
        </h1>

        {/* Sección: Respaldo en la nube */}
        <section className="bg-white rounded-lg border shadow-sm p-5 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">
              Respaldo en la nube
            </h2>
            <p className="text-sm text-gray-500">
              Sincroniza tus datos con Supabase para acceder desde otros
              dispositivos. Tus datos siempre se guardan localmente primero.
            </p>
          </div>

          {!isAuthenticated && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                Debes iniciar sesi&oacute;n para activar la
                sincronizaci&oacute;n.
              </p>
            </div>
          )}

          {isAuthenticated && !loading && (
            <>
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium text-gray-900">
                    Sincronizaci&oacute;n
                  </p>
                  <p className="text-xs text-gray-500">
                    {syncHabilitado
                      ? "Tus datos se respaldan autom\u00e1ticamente"
                      : "Solo almacenamiento local"}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={syncHabilitado}
                  disabled={status === "uploading"}
                  onClick={() => {
                    if (syncHabilitado) {
                      desactivarSync();
                    } else {
                      setConfirmando(true);
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-50 ${
                    syncHabilitado ? "bg-green-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      syncHabilitado ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Modal de confirmación */}
              {confirmando && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-blue-900">
                    Al activar, tus datos se guardar&aacute;n en la nube. Puedes
                    desactivarlo en cualquier momento.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={activarSync}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Activar sincronizaci&oacute;n
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmando(false)}
                      className="px-4 py-2 bg-white border text-sm rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Progreso de carga */}
              {status === "uploading" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-blue-900">
                    Activando sincronizaci&oacute;n...
                  </p>
                  {progress && (
                    <>
                      <p className="text-xs text-blue-700">
                        {progress.tabla}: {progress.done}/{progress.total}{" "}
                        registros
                      </p>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Éxito */}
              {status === "success" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    Sincronizaci&oacute;n activada. Tus datos se respaldan
                    autom&aacute;ticamente.
                  </p>
                </div>
              )}

              {/* Error */}
              {status === "error" && errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-red-800">{errorMsg}</p>
                  <button
                    type="button"
                    onClick={activarSync}
                    className="text-sm text-red-700 underline hover:text-red-900"
                  >
                    Reintentar
                  </button>
                </div>
              )}
            </>
          )}

          {loading && (
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          )}
        </section>

        {/* Sección: Mantenimiento de sync */}
        {isAuthenticated && erroresPermanentes > 0 && (
          <section className="bg-white rounded-lg border border-red-200 shadow-sm p-5 space-y-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">
                Mantenimiento
              </h2>
              <p className="text-sm text-gray-500">
                Hay {erroresPermanentes} elemento
                {erroresPermanentes !== 1 ? "s" : ""} que no pudieron
                sincronizarse despu&eacute;s de varios intentos.
              </p>
            </div>
            <button
              type="button"
              onClick={limpiarErrores}
              disabled={limpiando}
              className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {limpiando
                ? "Limpiando..."
                : `Limpiar ${erroresPermanentes} error${erroresPermanentes !== 1 ? "es" : ""} de sincronizaci\u00f3n`}
            </button>
          </section>
        )}

        {/* Sección: Privacidad */}
        <section className="bg-white rounded-lg border shadow-sm p-5 space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Privacidad</h2>
          <p className="text-sm text-gray-500">
            AgriPlan funciona 100% offline. La sincronizaci&oacute;n es opcional
            y tus datos nunca se comparten con terceros. Si desactivas la
            sincronizaci&oacute;n, tus datos permanecen solo en este
            dispositivo.
          </p>
        </section>
      </main>
    </PageLayout>
  );
}

"use client";

import { useProjectContext } from "@/contexts/project-context";
import { PageLayout } from "@/components/layout/page-layout";
import { AlertasList } from "@/components/alertas/alertas-list";

export default function AlertasPage() {
  const { terrenoActual, loading, alertasHook } = useProjectContext();

  const {
    alertas,
    alertasCriticas,
    loading: alertasLoading,
    resolverAlerta,
    ignorarAlerta,
  } = alertasHook;

  if (loading || alertasLoading || !terrenoActual) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Cargando alertas...</div>
      </div>
    );
  }

  return (
    <PageLayout headerColor="green" title="Alertas">
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-gray-600 mb-6">
          {alertas.length} alertas activas
          {alertasCriticas > 0 && (
            <span className="ml-2 text-red-600 font-medium">
              ({alertasCriticas} críticas)
            </span>
          )}
        </p>

        <AlertasList
          alertas={alertas}
          onResolver={resolverAlerta}
          onIgnorar={ignorarAlerta}
        />
      </div>
    </PageLayout>
  );
}

"use client";

import { PageLayout } from "@/components/layout";
import { useAuthContext } from "@/components/providers/auth-provider";

export default function ConfiguracionPage() {
  const { isAuthenticated } = useAuthContext();

  return (
    <PageLayout headerColor="green">
      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <h1 className="text-xl font-bold text-gray-900">
          Configuraci&oacute;n
        </h1>

        <section className="bg-white rounded-lg border shadow-sm p-5 space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Almacenamiento
          </h2>
          <p className="text-sm text-gray-500">
            {isAuthenticated
              ? "Tus datos se guardan en la nube autom\u00e1ticamente y est\u00e1n disponibles en cualquier dispositivo donde inicies sesi\u00f3n."
              : "Inicia sesi\u00f3n para guardar y acceder a tus datos."}
          </p>
        </section>

        <section className="bg-white rounded-lg border shadow-sm p-5 space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Privacidad</h2>
          <p className="text-sm text-gray-500">
            Tus datos nunca se comparten con terceros. Solo t&uacute; puedes
            acceder a ellos con tu cuenta.
          </p>
        </section>
      </main>
    </PageLayout>
  );
}

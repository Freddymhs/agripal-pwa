import { PageLayout } from "@/components/layout";
import { GuiaIndice } from "@/components/guia/guia-indice";
import {
  GuiaPasoProyecto,
  GuiaPasoCatalogo,
  GuiaPasoAgua,
} from "@/components/guia/guia-pasos-configuracion";
import {
  GuiaPasoSuelo,
  GuiaPasoClima,
} from "@/components/guia/guia-pasos-ambiente";
import {
  GuiaPasoMapa,
  GuiaPasoPlanificador,
  GuiaPasoEconomia,
} from "@/components/guia/guia-pasos-uso";
import {
  GuiaPasoAlertas,
  GuiaPasoOffline,
} from "@/components/guia/guia-pasos-monitoreo";
import { GuiaResumen } from "@/components/guia/guia-resumen";

export default function GuiaPage() {
  return (
    <PageLayout headerColor="green">
      <main className="max-w-4xl mx-auto p-4 space-y-8 text-base">
        <GuiaIndice />
        <GuiaPasoProyecto />
        <GuiaPasoCatalogo />
        <GuiaPasoAgua />
        <GuiaPasoSuelo />
        <GuiaPasoClima />
        <GuiaPasoMapa />
        <GuiaPasoPlanificador />
        <GuiaPasoEconomia />
        <GuiaPasoAlertas />
        <GuiaPasoOffline />
        <GuiaResumen />
      </main>
    </PageLayout>
  );
}

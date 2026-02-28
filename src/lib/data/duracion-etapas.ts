import type { EtapaCrecimiento } from "@/types";

export const DURACION_ETAPAS: Record<
  string,
  Record<EtapaCrecimiento, number>
> = {
  tomate: {
    plántula: 30,
    joven: 45,
    adulta: 90,
    madura: 75,
  },
  mango: {
    plántula: 180,
    joven: 365,
    adulta: 730,
    madura: 365,
  },
  zanahoria: {
    plántula: 20,
    joven: 30,
    adulta: 45,
    madura: 25,
  },
  papa: {
    plántula: 20,
    joven: 35,
    adulta: 50,
    madura: 25,
  },
  cebolla: {
    plántula: 25,
    joven: 45,
    adulta: 60,
    madura: 30,
  },
  ajo: {
    plántula: 30,
    joven: 60,
    adulta: 90,
    madura: 30,
  },
  lechuga: {
    plántula: 15,
    joven: 25,
    adulta: 25,
    madura: 15,
  },
  acelga: {
    plántula: 20,
    joven: 30,
    adulta: 60,
    madura: 30,
  },
  pimiento: {
    plántula: 30,
    joven: 45,
    adulta: 90,
    madura: 45,
  },
  ají: {
    plántula: 30,
    joven: 45,
    adulta: 90,
    madura: 45,
  },
  zapallo: {
    plántula: 15,
    joven: 30,
    adulta: 60,
    madura: 30,
  },
  melón: {
    plántula: 15,
    joven: 25,
    adulta: 45,
    madura: 20,
  },
  sandía: {
    plántula: 15,
    joven: 25,
    adulta: 50,
    madura: 20,
  },
  olivo: {
    plántula: 365,
    joven: 730,
    adulta: 1825,
    madura: 3650,
  },
  vid: {
    plántula: 180,
    joven: 365,
    adulta: 730,
    madura: 1460,
  },
  uva: {
    plántula: 180,
    joven: 365,
    adulta: 730,
    madura: 1460,
  },
  limon: {
    plántula: 365,
    joven: 730,
    adulta: 1095,
    madura: 2920,
  },
  limonero: {
    plántula: 365,
    joven: 730,
    adulta: 1095,
    madura: 2920,
  },
  naranjo: {
    plántula: 365,
    joven: 730,
    adulta: 1095,
    madura: 2920,
  },
  palto: {
    plántula: 365,
    joven: 730,
    adulta: 1095,
    madura: 2190,
  },
  guayabo: {
    plántula: 180,
    joven: 365,
    adulta: 730,
    madura: 1460,
  },
  maíz: {
    plántula: 15,
    joven: 30,
    adulta: 45,
    madura: 30,
  },
  poroto: {
    plántula: 15,
    joven: 25,
    adulta: 40,
    madura: 20,
  },
  quinoa: {
    plántula: 20,
    joven: 40,
    adulta: 60,
    madura: 30,
  },
  alfalfa: {
    plántula: 30,
    joven: 60,
    adulta: 730,
    madura: 365,
  },
  oregano: {
    plántula: 30,
    joven: 45,
    adulta: 365,
    madura: 365,
  },
  orégano: {
    plántula: 30,
    joven: 45,
    adulta: 365,
    madura: 365,
  },
  tuna: {
    plántula: 180,
    joven: 365,
    adulta: 730,
    madura: 3650,
  },
  higuera: {
    plántula: 365,
    joven: 730,
    adulta: 730,
    madura: 1825,
  },
  pitahaya: {
    plántula: 180,
    joven: 365,
    adulta: 730,
    madura: 1460,
  },
  guayaba: {
    plántula: 180,
    joven: 365,
    adulta: 730,
    madura: 1460,
  },
  datil: {
    plántula: 365,
    joven: 730,
    adulta: 1460,
    madura: 3650,
  },
  maracuya: {
    plántula: 60,
    joven: 90,
    adulta: 180,
    madura: 365,
  },
  mandarina: {
    plántula: 365,
    joven: 730,
    adulta: 1095,
    madura: 2920,
  },
  arandano: {
    plántula: 60,
    joven: 90,
    adulta: 180,
    madura: 365,
  },
  lucuma: {
    plántula: 365,
    joven: 730,
    adulta: 1460,
    madura: 2920,
  },
  zapote: {
    plántula: 365,
    joven: 730,
    adulta: 1095,
    madura: 2920,
  },
};

const DURACION_DEFAULT: Record<EtapaCrecimiento, number> = {
  plántula: 30,
  joven: 45,
  adulta: 90,
  madura: 60,
};

function getDuracionEtapas(
  tipoCultivo: string,
): Record<EtapaCrecimiento, number> {
  const nombreNormalizado = tipoCultivo.toLowerCase().trim();

  for (const [cultivo, duraciones] of Object.entries(DURACION_ETAPAS)) {
    if (
      nombreNormalizado.includes(cultivo) ||
      cultivo.includes(nombreNormalizado)
    ) {
      return duraciones;
    }
  }

  return DURACION_DEFAULT;
}

export function calcularEtapaActual(
  tipoCultivo: string,
  fechaPlantacion: Date,
): EtapaCrecimiento {
  const diasDesde = Math.floor(
    (Date.now() - fechaPlantacion.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diasDesde < 0) return "plántula";

  const duraciones = getDuracionEtapas(tipoCultivo);

  let acumulado = 0;
  const etapas: EtapaCrecimiento[] = ["plántula", "joven", "adulta", "madura"];

  for (const etapa of etapas) {
    acumulado += duraciones[etapa];
    if (diasDesde < acumulado) {
      return etapa;
    }
  }

  return "madura";
}

export function getDiasRestantesEtapa(
  tipoCultivo: string,
  etapaActual: EtapaCrecimiento,
  fechaPlantacion: Date,
): number {
  const diasDesde = Math.floor(
    (Date.now() - fechaPlantacion.getTime()) / (1000 * 60 * 60 * 24),
  );

  const duraciones = getDuracionEtapas(tipoCultivo);
  const etapas: EtapaCrecimiento[] = ["plántula", "joven", "adulta", "madura"];

  let acumulado = 0;
  for (const etapa of etapas) {
    acumulado += duraciones[etapa];
    if (etapa === etapaActual) {
      return Math.max(0, acumulado - diasDesde);
    }
  }

  return 0;
}

export function getDiasTotalesCultivo(tipoCultivo: string): number {
  const duraciones = getDuracionEtapas(tipoCultivo);
  return Object.values(duraciones).reduce((sum, dias) => sum + dias, 0);
}

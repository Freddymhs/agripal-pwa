import type { EtapaCrecimiento } from "@/types";

export const KC_POR_CULTIVO: Record<
  string,
  Record<EtapaCrecimiento, number>
> = {
  tomate: {
    plántula: 0.45,
    joven: 0.75,
    adulta: 1.15,
    madura: 0.85,
  },
  mango: {
    plántula: 0.5,
    joven: 0.8,
    adulta: 1.1,
    madura: 0.9,
  },
  zanahoria: {
    plántula: 0.4,
    joven: 0.7,
    adulta: 1.0,
    madura: 0.8,
  },
  papa: {
    plántula: 0.45,
    joven: 0.75,
    adulta: 1.1,
    madura: 0.75,
  },
  cebolla: {
    plántula: 0.45,
    joven: 0.7,
    adulta: 1.05,
    madura: 0.8,
  },
  ajo: {
    plántula: 0.4,
    joven: 0.7,
    adulta: 1.0,
    madura: 0.7,
  },
  lechuga: {
    plántula: 0.45,
    joven: 0.8,
    adulta: 1.0,
    madura: 0.9,
  },
  acelga: {
    plántula: 0.4,
    joven: 0.75,
    adulta: 1.0,
    madura: 0.85,
  },
  pimiento: {
    plántula: 0.45,
    joven: 0.75,
    adulta: 1.1,
    madura: 0.85,
  },
  ají: {
    plántula: 0.45,
    joven: 0.75,
    adulta: 1.1,
    madura: 0.85,
  },
  zapallo: {
    plántula: 0.4,
    joven: 0.7,
    adulta: 1.0,
    madura: 0.8,
  },
  melón: {
    plántula: 0.45,
    joven: 0.75,
    adulta: 1.05,
    madura: 0.75,
  },
  sandía: {
    plántula: 0.45,
    joven: 0.75,
    adulta: 1.05,
    madura: 0.7,
  },
  olivo: {
    plántula: 0.5,
    joven: 0.65,
    adulta: 0.75,
    madura: 0.65,
  },
  vid: {
    plántula: 0.4,
    joven: 0.6,
    adulta: 0.8,
    madura: 0.5,
  },
  uva: {
    plántula: 0.4,
    joven: 0.6,
    adulta: 0.8,
    madura: 0.5,
  },
  limon: {
    plántula: 0.5,
    joven: 0.7,
    adulta: 0.85,
    madura: 0.8,
  },
  limonero: {
    plántula: 0.5,
    joven: 0.7,
    adulta: 0.85,
    madura: 0.8,
  },
  naranjo: {
    plántula: 0.5,
    joven: 0.7,
    adulta: 0.85,
    madura: 0.8,
  },
  palto: {
    plántula: 0.5,
    joven: 0.75,
    adulta: 0.95,
    madura: 0.85,
  },
  guayabo: {
    plántula: 0.5,
    joven: 0.8,
    adulta: 1.0,
    madura: 0.85,
  },
  maíz: {
    plántula: 0.4,
    joven: 0.8,
    adulta: 1.15,
    madura: 0.7,
  },
  poroto: {
    plántula: 0.35,
    joven: 0.7,
    adulta: 1.1,
    madura: 0.35,
  },
  quinoa: {
    plántula: 0.4,
    joven: 0.7,
    adulta: 1.0,
    madura: 0.4,
  },
  alfalfa: {
    plántula: 0.4,
    joven: 0.8,
    adulta: 1.2,
    madura: 1.15,
  },
  oregano: {
    plántula: 0.35,
    joven: 0.6,
    adulta: 0.9,
    madura: 0.8,
  },
  orégano: {
    plántula: 0.35,
    joven: 0.6,
    adulta: 0.9,
    madura: 0.8,
  },
  tuna: {
    plántula: 0.4,
    joven: 0.6,
    adulta: 0.75,
    madura: 0.65,
  },
  higuera: {
    plántula: 0.5,
    joven: 0.7,
    adulta: 0.85,
    madura: 0.75,
  },
  pitahaya: {
    plántula: 0.45,
    joven: 0.65,
    adulta: 0.9,
    madura: 0.7,
  },
  guayaba: {
    plántula: 0.5,
    joven: 0.8,
    adulta: 1.0,
    madura: 0.85,
  },
  datil: {
    plántula: 0.5,
    joven: 0.75,
    adulta: 1.0,
    madura: 0.9,
  },
  maracuya: {
    plántula: 0.45,
    joven: 0.7,
    adulta: 0.95,
    madura: 0.8,
  },
  mandarina: {
    plántula: 0.5,
    joven: 0.7,
    adulta: 0.85,
    madura: 0.8,
  },
  arandano: {
    plántula: 0.5,
    joven: 0.75,
    adulta: 0.95,
    madura: 0.85,
  },
  lucuma: {
    plántula: 0.5,
    joven: 0.7,
    adulta: 0.85,
    madura: 0.75,
  },
  zapote: {
    plántula: 0.5,
    joven: 0.7,
    adulta: 0.85,
    madura: 0.75,
  },
};

const KC_DEFAULT: Record<EtapaCrecimiento, number> = {
  plántula: 0.45,
  joven: 0.75,
  adulta: 1.0,
  madura: 0.85,
};

function quitarAcentos(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function getKc(tipoCultivo: string, etapa: EtapaCrecimiento): number {
  const nombreNormalizado = quitarAcentos(tipoCultivo.toLowerCase().trim());

  for (const [cultivo, kcs] of Object.entries(KC_POR_CULTIVO)) {
    const cultivoNormalizado = quitarAcentos(cultivo);
    if (
      nombreNormalizado.includes(cultivoNormalizado) ||
      cultivoNormalizado.includes(nombreNormalizado)
    ) {
      return kcs[etapa] ?? KC_DEFAULT[etapa];
    }
  }

  return KC_DEFAULT[etapa];
}

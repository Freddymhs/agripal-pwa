export const PIXELS_POR_METRO = 10;
export const MIN_SCALE = 0.01;
export const MAX_SCALE = 20;
export const BG_COLOR = 0xf0f8f0;

export const COLORES_ESTADO_PLANTA_HEX: Record<string, number> = {
  plantada: 0x84cc16,
  creciendo: 0x22c55e,
  produciendo: 0xf59e0b,
  muerta: 0x6b7280,
};

export const COLORES_ZONA_HEX: Record<string, number> = {
  cultivo: 0x22c55e,
  bodega: 0xa16207,
  casa: 0x3b82f6,
  camino: 0x6b7280,
  decoracion: 0xa855f7,
  estanque: 0x06b6d4,
  otro: 0x374151,
};

export const COLOR_SELECCION = 0x3b82f6;
export const COLOR_SNAP = 0xf97316;
export const COLOR_PREVIEW_VALIDA = 0x22c55e;
export const COLOR_PREVIEW_INVALIDA = 0xef4444;
export const COLOR_BORDE_TERRENO = 0x94a3b8;
export const COLOR_HOVER = 0xfbbf24;

const PALETA_CULTIVOS: number[] = [
  0xdc2626, // rojo (granado, tomate)
  0xf97316, // naranja (papaya, naranjo)
  0x7c3aed, // violeta (higuera, uva)
  0xec4899, // rosa (pitahaya, guayaba)
  0x16a34a, // verde (aloe, lechuga)
  0x0891b2, // cyan (arándano)
  0xca8a04, // amarillo oscuro (tuna, maíz)
  0x9333ea, // púrpura (berenjena)
  0x059669, // esmeralda (palta)
  0xe11d48, // rosa fuerte (cereza, frutilla)
  0x2563eb, // azul (lavanda)
  0xd97706, // ámbar (mango, durazno)
];

export function asignarColorCultivo(index: number): number {
  return PALETA_CULTIVOS[index % PALETA_CULTIVOS.length];
}

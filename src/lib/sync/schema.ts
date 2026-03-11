import type { SyncEntidad } from "@/types";

/** Mapeo SyncEntidad → nombre de tabla en Supabase */
export const TABLA_POR_ENTIDAD: Record<SyncEntidad, string> = {
  proyecto: "proyectos",
  terreno: "terrenos",
  zona: "zonas",
  planta: "plantas",
  entrada_agua: "entradas_agua",
  cosecha: "cosechas",
  alerta: "alertas",
  catalogo_cultivo: "catalogo_cultivos",
  insumo_usuario: "insumos_usuario",
};

/** Mapeo inverso: nombre tabla Supabase → SyncEntidad */
export const ENTIDAD_POR_TABLA: Record<string, SyncEntidad> =
  Object.fromEntries(
    Object.entries(TABLA_POR_ENTIDAD).map(([k, v]) => [v, k as SyncEntidad]),
  ) as Record<string, SyncEntidad>;

/** Columnas explícitas por tabla — todo lo demás va a `datos` JSONB */
export const COLUMNAS_EXPLICITAS: Record<string, string[]> = {
  proyectos: ["id", "usuario_id", "nombre", "descripcion"],
  terrenos: ["id", "proyecto_id", "nombre"],
  zonas: ["id", "terreno_id", "nombre", "tipo"],
  plantas: ["id", "zona_id", "tipo_cultivo_id", "estado"],
  entradas_agua: ["id", "terreno_id", "fecha"],
  cosechas: ["id", "zona_id", "tipo_cultivo_id", "fecha"],
  alertas: ["id", "terreno_id", "tipo", "estado", "severidad"],
  catalogo_cultivos: ["id", "proyecto_id", "nombre", "tier"],
  insumos_usuario: ["id", "terreno_id", "nombre", "tipo"],
};

/** Campos de control que no se envían a Supabase (los maneja el servidor) */
export const CAMPOS_CONTROL = new Set([
  "lastModified",
  "created_at",
  "updated_at",
]);

/** Serializa un record de IndexedDB → columnas + datos JSONB para Supabase */
export function serializarParaSupabase(
  tabla: string,
  record: Record<string, unknown>,
): Record<string, unknown> {
  const columnas = COLUMNAS_EXPLICITAS[tabla] ?? [];
  const payload: Record<string, unknown> = {};
  const datos: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (CAMPOS_CONTROL.has(key)) continue;
    if (columnas.includes(key)) {
      payload[key] = value;
    } else {
      datos[key] = value;
    }
  }

  payload.datos = datos;
  return payload;
}

/** Reconstruye un record de IndexedDB desde Supabase (columnas + datos JSONB → plano) */
export function deserializarDesdeSupabase(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const { datos, ...columnas } = row;
  const datosObj = (datos ?? {}) as Record<string, unknown>;
  return {
    ...columnas,
    ...datosObj,
    lastModified: columnas.updated_at,
  };
}

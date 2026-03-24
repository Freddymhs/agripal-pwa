/** Columnas explícitas por tabla — todo lo demás va a `datos` JSONB */
export const COLUMNAS_EXPLICITAS: Record<string, string[]> = {
  proyectos: ["id", "usuario_id", "nombre", "descripcion", "clima_actual_id"],
  terrenos: ["id", "proyecto_id", "nombre", "ancho_m", "alto_m"],
  zonas: [
    "id",
    "terreno_id",
    "nombre",
    "tipo",
    "x",
    "y",
    "ancho",
    "alto",
    "area_m2",
  ],
  plantas: [
    "id",
    "zona_id",
    "tipo_cultivo_id",
    "estado",
    "etapa_actual",
    "x",
    "y",
  ],
  entradas_agua: ["id", "terreno_id", "fecha"],
  cosechas: ["id", "zona_id", "tipo_cultivo_id", "fecha"],
  alertas: ["id", "terreno_id", "proyecto_id", "tipo", "estado", "severidad"],
  catalogo_cultivos: [
    "id",
    "proyecto_id",
    "nombre",
    "tier",
    "kc_plantula",
    "kc_joven",
    "kc_adulta",
    "kc_madura",
    "cultivo_base_id",
  ],
  insumos_usuario: ["id", "terreno_id", "nombre", "tipo"],
  // Tablas base globales / por proyecto
  insumos_catalogo: ["id", "terreno_id", "nombre", "tipo"],
  enmiendas_proyecto: ["id", "proyecto_id", "nombre", "tipo"],
  tecnicas_proyecto: ["id", "proyecto_id", "nombre", "categoria"],
  fuentes_agua_proyecto: ["id", "proyecto_id", "nombre", "tipo"],
  sesiones_riego: [
    "id",
    "zona_id",
    "terreno_id",
    "fecha",
    "hora_inicio",
    "duracion_horas",
    "caudal_lh",
    "consumo_litros",
    "notas",
    "created_at",
    "updated_at",
  ],
  precios_actual: [
    "id",
    "cultivo_id",
    "region",
    "nombre",
    "nombre_odepa",
    "precio_min_clp",
    "precio_max_clp",
    "precio_actual_clp",
    "tendencia",
    "actualizado_en",
    "fuente",
    "factor_precio_feria",
    "factor_precio_retail",
  ],
  mercado_detalle: [
    "id",
    "precio_mayorista_id",
    "demanda_local",
    "competencia_local",
    "mercado_exportacion",
    "notas",
    "actualizado_en",
  ],
  variedades_base: ["id", "cultivo_id", "nombre"],
  precios_actual_config: ["id", "precio_id", "updated_by", "origen"],
  catalogo_cultivos_config: ["id", "cultivo_id", "tipo", "origen"],
};

/** Campos de control que no se envían a Supabase (los maneja el servidor) */
const CAMPOS_CONTROL = new Set(["lastModified", "created_at", "updated_at"]);

/** Serializa un record local → columnas + datos JSONB para Supabase */
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

/** Reconstruye un record plano desde row de Supabase (columnas + datos JSONB → plano) */
export function deserializarDesdeSupabase<T = Record<string, unknown>>(
  row: Record<string, unknown>,
): T {
  const { datos, ...columnas } = row;
  const datosObj = (datos ?? {}) as Record<string, unknown>;
  return {
    ...columnas,
    ...datosObj,
    lastModified: columnas.updated_at,
  } as T;
}

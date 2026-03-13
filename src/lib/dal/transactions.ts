import { supabase } from "@/lib/supabase/client";
import { serializarParaSupabase } from "@/lib/supabase/schema";
import type {
  Proyecto,
  CatalogoCultivo,
  EntradaAgua,
  Terreno,
  Zona,
  Planta,
  Alerta,
} from "@/types";
import { ESTADO_PLANTA } from "@/lib/constants/entities";
import { zonasDAL } from "./zonas";
import { plantasDAL } from "./plantas";
import { terrenosDAL } from "./terrenos";
import { proyectosDAL } from "./proyectos";
import { alertasDAL } from "./alertas";
import { aguaDAL } from "./agua";

export const transaccionesDAL = {
  /** FK ON DELETE CASCADE en Postgres maneja la eliminación de hijos */
  eliminarZonaCascade: async (zonaId: string): Promise<void> => {
    await zonasDAL.delete(zonaId);
  },

  eliminarTerrenoCascade: async (terrenoId: string): Promise<void> => {
    await terrenosDAL.delete(terrenoId);
  },

  eliminarProyectoCascade: async (proyectoId: string): Promise<void> => {
    await proyectosDAL.delete(proyectoId);
  },

  crearProyectoConCatalogo: async (
    proyecto: Proyecto,
    cultivos: CatalogoCultivo[],
  ): Promise<void> => {
    await proyectosDAL.add(proyecto);
    if (cultivos.length > 0) {
      const payloads = cultivos.map((c) =>
        serializarParaSupabase(
          "catalogo_cultivos",
          c as unknown as Record<string, unknown>,
        ),
      );
      const { error } = await supabase
        .from("catalogo_cultivos")
        .insert(payloads);
      if (error) throw error;
    }
  },

  seedCatalogo: async (cultivos: CatalogoCultivo[]): Promise<void> => {
    if (cultivos.length === 0) return;
    const payloads = cultivos.map((c) =>
      serializarParaSupabase(
        "catalogo_cultivos",
        c as unknown as Record<string, unknown>,
      ),
    );
    const { error } = await supabase.from("catalogo_cultivos").insert(payloads);
    if (error) throw error;
  },

  transferirAgua: async (
    origenId: string,
    origenUpdate: Partial<Zona>,
    destinoId: string,
    destinoUpdate: Partial<Zona>,
  ): Promise<void> => {
    await zonasDAL.update(origenId, origenUpdate);
    await zonasDAL.update(destinoId, destinoUpdate);
  },

  registrarEntradaAgua: async (
    entrada: EntradaAgua,
    estanqueId: string,
    estanqueUpdate: Partial<Zona>,
    terrenoId: string,
    terrenoUpdate: Partial<Terreno>,
  ): Promise<void> => {
    await aguaDAL.addEntrada(entrada);
    await zonasDAL.update(estanqueId, estanqueUpdate);
    await terrenosDAL.update(terrenoId, terrenoUpdate);
  },

  aplicarDescuentosAgua: async (
    descuentos: Array<{ estanqueId: string; update: Partial<Zona> }>,
    terrenoId: string,
    terrenoUpdate: Partial<Terreno>,
  ): Promise<void> => {
    for (const d of descuentos) {
      await zonasDAL.update(d.estanqueId, d.update);
    }
    await terrenosDAL.update(terrenoId, terrenoUpdate);
  },

  actualizarEtapasLote: async (
    actualizaciones: Array<{ id: string; cambios: Partial<Planta> }>,
  ): Promise<void> => {
    for (const a of actualizaciones) {
      await plantasDAL.update(a.id, a.cambios);
    }
  },

  cambiarEstadoPlantasLote: async (
    ids: string[],
    cambios: Partial<Planta>,
  ): Promise<void> => {
    for (const id of ids) {
      await plantasDAL.update(id, cambios);
    }
  },

  sincronizarAlertas: async (
    resolver: Array<{ id: string; cambios: Partial<Alerta> }>,
    nuevas: Alerta[],
  ): Promise<void> => {
    for (const r of resolver) {
      await alertasDAL.update(r.id, r.cambios);
    }
    if (nuevas.length > 0) {
      const payloads = nuevas.map((a) =>
        serializarParaSupabase(
          "alertas",
          a as unknown as Record<string, unknown>,
        ),
      );
      const { error } = await supabase.from("alertas").insert(payloads);
      if (error) throw error;
    }
  },

  eliminarPlantasMuertas: async (zonaId: string): Promise<void> => {
    const { error } = await supabase
      .from("plantas")
      .delete()
      .eq("zona_id", zonaId)
      .eq("estado", ESTADO_PLANTA.MUERTA);
    if (error) throw error;
  },
};

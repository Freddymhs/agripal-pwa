import { supabase } from "@/lib/supabase/client";
import {
  deserializarDesdeSupabase,
  serializarParaSupabase,
} from "@/lib/supabase/schema";
import { logger } from "@/lib/logger";
import type { FuenteAgua, UUID } from "@/types";
import type { Enmienda } from "@/lib/data/enmiendas-suelo";
import type { TecnicaMejora } from "@/lib/data/tecnicas-mejora";
import type { VariedadCultivo } from "@/lib/data/variedades";
import type { DatosMercado } from "@/lib/data/mercado";
import type { DatosClimaticos } from "@/lib/data/clima";

export interface InsumoCatalogo {
  id: string;
  terreno_id: string;
  nombre: string;
  tipo: string;
  descripcion?: string;
  created_at: string;
  updated_at: string;
}

export interface ClimaBase {
  id: string;
  region: string;
  datos: DatosClimaticos;
}

export const baseDataDAL = {
  async getInsumosByTerrenoId(terrenoId: UUID): Promise<InsumoCatalogo[]> {
    try {
      const { data, error } = await supabase
        .from("insumos_catalogo")
        .select("*")
        .eq("terreno_id", terrenoId);
      if (error) throw error;
      return (data ?? []).map((row) =>
        deserializarDesdeSupabase<InsumoCatalogo>(row),
      );
    } catch (error) {
      logger.error("Error en getInsumosByTerrenoId", { error });
      throw error;
    }
  },

  async getEnmiendasByProyectoId(proyectoId: UUID): Promise<Enmienda[]> {
    try {
      const { data, error } = await supabase
        .from("enmiendas_proyecto")
        .select("*")
        .eq("proyecto_id", proyectoId);
      if (error) throw error;
      return (data ?? []).map((row) =>
        deserializarDesdeSupabase<Enmienda>(row),
      );
    } catch (error) {
      logger.error("Error en getEnmiendasByProyectoId", { error });
      throw error;
    }
  },

  async getTecnicasByProyectoId(proyectoId: UUID): Promise<TecnicaMejora[]> {
    try {
      const { data, error } = await supabase
        .from("tecnicas_proyecto")
        .select("*")
        .eq("proyecto_id", proyectoId);
      if (error) throw error;
      return (data ?? []).map((row) =>
        deserializarDesdeSupabase<TecnicaMejora>(row),
      );
    } catch (error) {
      logger.error("Error en getTecnicasByProyectoId", { error });
      throw error;
    }
  },

  async getClimasDisponibles(): Promise<ClimaBase[]> {
    try {
      const { data, error } = await supabase.from("clima_base").select("*");
      if (error) throw error;
      return (data ?? []).map((row) =>
        deserializarDesdeSupabase<ClimaBase>(row),
      );
    } catch (error) {
      logger.error("Error en getClimasDisponibles", { error });
      throw error;
    }
  },

  async getFuentesAguaByProyectoId(proyectoId: UUID): Promise<FuenteAgua[]> {
    try {
      const { data, error } = await supabase
        .from("fuentes_agua_proyecto")
        .select("*")
        .eq("proyecto_id", proyectoId);
      if (error) throw error;
      return (data ?? []).map((row) =>
        deserializarDesdeSupabase<FuenteAgua>(row),
      );
    } catch (error) {
      logger.error("Error en getFuentesAguaByProyectoId", { error });
      throw error;
    }
  },

  async getPreciosGlobales(): Promise<DatosMercado[]> {
    try {
      const { data, error } = await supabase.from("precios_base").select("*");
      if (error) throw error;
      return (data ?? []).map((row) =>
        deserializarDesdeSupabase<DatosMercado>(row),
      );
    } catch (error) {
      logger.error("Error en getPreciosGlobales", { error });
      throw error;
    }
  },

  async getVariedadesGlobales(): Promise<VariedadCultivo[]> {
    try {
      const { data, error } = await supabase
        .from("variedades_base")
        .select("*");
      if (error) throw error;
      return (data ?? []).map((row) =>
        deserializarDesdeSupabase<VariedadCultivo>(row),
      );
    } catch (error) {
      logger.error("Error en getVariedadesGlobales", { error });
      throw error;
    }
  },

  async setClimaActivo(proyectoId: UUID, climaBaseId: UUID): Promise<void> {
    try {
      const { error } = await supabase
        .from("proyectos")
        .update({ clima_base_id: climaBaseId })
        .eq("id", proyectoId);
      if (error) throw error;
      logger.info("Clima activo actualizado", { proyectoId, climaBaseId });
    } catch (error) {
      logger.error("Error en setClimaActivo", { error });
      throw error;
    }
  },

  async createFuenteAgua(
    proyectoId: UUID,
    fuente: Omit<FuenteAgua, "id">,
  ): Promise<FuenteAgua> {
    try {
      const { nombre, tipo, ...resto } = fuente;
      const payload = serializarParaSupabase("fuentes_agua_proyecto", {
        proyecto_id: proyectoId,
        nombre,
        tipo,
        ...resto,
      });

      const { data, error } = await supabase
        .from("fuentes_agua_proyecto")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;

      logger.info("Fuente de agua creada", { proyectoId, nombre });
      return deserializarDesdeSupabase<FuenteAgua>(data);
    } catch (error) {
      logger.error("Error en createFuenteAgua", { error });
      throw error;
    }
  },

  async deleteFuenteAgua(fuenteId: UUID, proyectoId: UUID): Promise<void> {
    try {
      const { error } = await supabase
        .from("fuentes_agua_proyecto")
        .delete()
        .eq("id", fuenteId)
        .eq("proyecto_id", proyectoId);
      if (error) throw error;

      logger.info("Fuente de agua eliminada", { fuenteId, proyectoId });
    } catch (error) {
      logger.error("Error en deleteFuenteAgua", { error });
      throw error;
    }
  },
};

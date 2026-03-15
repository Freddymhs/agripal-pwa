import { supabase } from "@/lib/supabase/client";
import { deserializarDesdeSupabase } from "@/lib/supabase/schema";
import { logger } from "@/lib/logger";
import type { FuenteAgua, UUID } from "@/types";
import type { Enmienda } from "@/lib/data/enmiendas-suelo";
import type { TecnicaMejora } from "@/lib/data/tecnicas-mejora";
import type { VariedadCultivo } from "@/lib/data/variedades";
import type { DatosMercado } from "@/lib/data/mercado";
import type { DatosClimaticos } from "@/lib/data/clima-arica";

export interface InsumoCatalogo {
  id: string;
  proyecto_id: string;
  nombre: string;
  tipo: string;
  descripcion?: string;
  created_at: string;
  updated_at: string;
}

export interface ClimaProyectoRow {
  id: string;
  proyecto_id: string;
  region: string;
  datos: DatosClimaticos;
}

export const baseDataDAL = {
  async getInsumosByProyectoId(proyectoId: UUID): Promise<InsumoCatalogo[]> {
    try {
      const { data, error } = await supabase
        .from("insumos_catalogo")
        .select("*")
        .eq("proyecto_id", proyectoId);
      if (error) throw error;
      return (data ?? []).map((row) =>
        deserializarDesdeSupabase<InsumoCatalogo>(row),
      );
    } catch (error) {
      logger.error("Error en getInsumosByProyectoId", { error });
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

  async getClimaByProyectoId(proyectoId: UUID): Promise<ClimaProyectoRow[]> {
    try {
      const { data, error } = await supabase
        .from("clima_proyecto")
        .select("*")
        .eq("proyecto_id", proyectoId);
      if (error) throw error;
      return (data ?? []).map((row) =>
        deserializarDesdeSupabase<ClimaProyectoRow>(row),
      );
    } catch (error) {
      logger.error("Error en getClimaByProyectoId", { error });
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
};

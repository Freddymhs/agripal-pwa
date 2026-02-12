"use client";

import { useCallback } from "react";
import { plantasDAL, transaccionesDAL } from "@/lib/dal";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import {
  validarNuevaPlanta,
  validarGridPlantas,
  generarGridPlantas,
  validarEstadoPlanta,
  validarEtapaPlanta,
  validarPosicionParaMover,
} from "@/lib/validations/planta";
import type {
  Planta,
  Zona,
  CatalogoCultivo,
  EstadoPlanta,
  EtapaCrecimiento,
  UUID,
} from "@/types";

interface UsePlantas {
  crearPlanta: (data: {
    zona: Zona;
    tipoCultivoId: UUID;
    x: number;
    y: number;
    plantasExistentes: Planta[];
    cultivo: CatalogoCultivo;
  }) => Promise<{ planta?: Planta; error?: string; advertencia?: string }>;

  crearPlantasGrid: (data: {
    zona: Zona;
    tipoCultivoId: UUID;
    espaciado: number;
    plantasExistentes: Planta[];
    cultivo: CatalogoCultivo;
  }) => Promise<{ plantas: Planta[]; errores: number }>;

  moverPlanta: (
    id: UUID,
    nuevaPosicion: { x: number; y: number },
    zona: Zona,
    plantasExistentes: Planta[],
    cultivo?: CatalogoCultivo,
  ) => Promise<{ error?: string }>;

  cambiarEstado: (id: UUID, estado: EstadoPlanta) => Promise<{ error?: string }>;

  cambiarEtapa: (id: UUID, etapa: EtapaCrecimiento) => Promise<{ error?: string }>;

  eliminarPlanta: (id: UUID) => Promise<void>;

  eliminarPlantasMuertas: (zonaId: UUID) => Promise<number>;
}

export function usePlantas(onRefetch: () => void): UsePlantas {
  const crearPlanta = useCallback(
    async (data: {
      zona: Zona;
      tipoCultivoId: UUID;
      x: number;
      y: number;
      plantasExistentes: Planta[];
      cultivo: CatalogoCultivo;
    }) => {
      const validacion = validarNuevaPlanta(
        { x: data.x, y: data.y },
        data.zona,
        data.plantasExistentes,
        data.cultivo,
      );

      if (!validacion.valida) {
        return { error: validacion.error };
      }

      const nuevaPlanta: Planta = {
        id: generateUUID(),
        zona_id: data.zona.id,
        tipo_cultivo_id: data.tipoCultivoId,
        x: data.x,
        y: data.y,
        estado: "plantada",
        etapa_actual: "plántula",
        fecha_plantacion: getCurrentTimestamp(),
        notas: "",
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp(),
      };

      try {
        await plantasDAL.add(nuevaPlanta);
      } catch (err) {
        console.error("Error creando planta:", err);
        throw err;
      }
      onRefetch();

      return {
        planta: nuevaPlanta,
        advertencia: validacion.advertencia,
      };
    },
    [onRefetch],
  );

  const crearPlantasGrid = useCallback(
    async (data: {
      zona: Zona;
      tipoCultivoId: UUID;
      espaciado: number;
      plantasExistentes: Planta[];
      cultivo: CatalogoCultivo;
    }) => {
      const posiciones = generarGridPlantas(
        data.zona,
        data.espaciado,
        data.cultivo,
      );
      const { validas, invalidas } = validarGridPlantas(
        posiciones,
        data.zona,
        data.plantasExistentes,
        data.cultivo,
      );

      const plantas: Planta[] = [];
      const timestamp = getCurrentTimestamp();

      for (const pos of validas) {
        const planta: Planta = {
          id: generateUUID(),
          zona_id: data.zona.id,
          tipo_cultivo_id: data.tipoCultivoId,
          x: pos.x,
          y: pos.y,
          estado: "plantada",
          etapa_actual: "plántula",
          fecha_plantacion: timestamp,
          notas: "",
          created_at: timestamp,
          updated_at: timestamp,
        };
        plantas.push(planta);
      }

      try {
        await plantasDAL.bulkAdd(plantas);
      } catch (err) {
        console.error("Error creando plantas en grid:", err);
        throw err;
      }
      onRefetch();

      return {
        plantas,
        errores: invalidas.length,
      };
    },
    [onRefetch],
  );

  const moverPlanta = useCallback(
    async (
      id: UUID,
      nuevaPosicion: { x: number; y: number },
      zona: Zona,
      plantasExistentes: Planta[],
      cultivo?: CatalogoCultivo,
    ) => {
      const validacion = validarPosicionParaMover(
        nuevaPosicion,
        zona,
        plantasExistentes,
        cultivo,
      );

      if (!validacion.valida) {
        return { error: validacion.error };
      }

      try {
        await plantasDAL.update(id, {
          x: nuevaPosicion.x,
          y: nuevaPosicion.y,
          updated_at: getCurrentTimestamp(),
        });
      } catch (err) {
        console.error("Error moviendo planta:", err);
        throw err;
      }
      onRefetch();
      return {};
    },
    [onRefetch],
  );

  const cambiarEstado = useCallback(
    async (id: UUID, estado: EstadoPlanta) => {
      if (!validarEstadoPlanta(estado)) {
        return { error: `Estado inválido: "${estado}". Debe ser uno de: plantada, creciendo, produciendo, muerta` };
      }

      try {
        await plantasDAL.update(id, {
          estado,
          updated_at: getCurrentTimestamp(),
        });
      } catch (err) {
        console.error("Error cambiando estado de planta:", err);
        throw err;
      }
      onRefetch();
      return {};
    },
    [onRefetch],
  );

  const cambiarEtapa = useCallback(
    async (id: UUID, etapa: EtapaCrecimiento) => {
      if (!validarEtapaPlanta(etapa)) {
        return { error: `Etapa inválida: "${etapa}". Debe ser una de: plántula, joven, adulta, madura` };
      }

      try {
        await plantasDAL.update(id, {
          etapa_actual: etapa,
          fecha_cambio_etapa: getCurrentTimestamp(),
          updated_at: getCurrentTimestamp(),
        });
      } catch (err) {
        console.error("Error cambiando etapa de planta:", err);
        throw err;
      }
      onRefetch();
      return {};
    },
    [onRefetch],
  );

  const eliminarPlanta = useCallback(
    async (id: UUID) => {
      try {
        await plantasDAL.delete(id);
      } catch (err) {
        console.error("Error eliminando planta:", err);
        throw err;
      }
      onRefetch();
    },
    [onRefetch],
  );

  const eliminarPlantasMuertas = useCallback(
    async (zonaId: UUID) => {
      try {
        await transaccionesDAL.eliminarPlantasMuertas(zonaId);
        onRefetch();
        return 0;
      } catch (err) {
        console.error("Error eliminando plantas muertas:", err);
        throw err;
      }
    },
    [onRefetch],
  );

  return {
    crearPlanta,
    crearPlantasGrid,
    moverPlanta,
    cambiarEstado,
    cambiarEtapa,
    eliminarPlanta,
    eliminarPlantasMuertas,
  };
}

"use client";

import { useCallback } from "react";
import { plantasDAL } from "@/lib/dal";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import {
  validarNuevaPlanta,
  validarGridPlantas,
  generarGridPlantas,
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
  ) => Promise<{ error?: string }>;

  cambiarEstado: (id: UUID, estado: EstadoPlanta) => Promise<void>;

  cambiarEtapa: (id: UUID, etapa: EtapaCrecimiento) => Promise<void>;

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
    async (id: UUID, nuevaPosicion: { x: number; y: number }) => {
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
    },
    [onRefetch],
  );

  const cambiarEtapa = useCallback(
    async (id: UUID, etapa: EtapaCrecimiento) => {
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
        const muertas = await plantasDAL.getByZonaIdFiltered(
          zonaId,
          (p) => p.estado === "muerta",
        );
        await plantasDAL.bulkDelete(muertas.map((p) => p.id));
        onRefetch();
        return muertas.length;
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

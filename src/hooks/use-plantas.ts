"use client";

import { useCallback } from "react";
import { plantasDAL, transaccionesDAL } from "@/lib/dal";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import { ESTADO_PLANTA, ETAPA } from "@/lib/constants/entities";
import {
  validarNuevaPlanta,
  validarGridPlantas,
  generarGridPlantas,
  validarEstadoPlanta,
  validarEtapaPlanta,
  validarPosicionParaMover,
} from "@/lib/validations/planta";
import { ejecutarMutacion } from "@/lib/helpers/dal-mutation";
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

  cambiarEstado: (
    id: UUID,
    estado: EstadoPlanta,
  ) => Promise<{ error?: string }>;

  cambiarEtapa: (
    id: UUID,
    etapa: EtapaCrecimiento,
  ) => Promise<{ error?: string }>;

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
        estado: ESTADO_PLANTA.PLANTADA,
        etapa_actual: ETAPA.PLANTULA,
        fecha_plantacion: getCurrentTimestamp(),
        notas: "",
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp(),
      };

      await ejecutarMutacion(
        () => plantasDAL.add(nuevaPlanta),
        "creando planta",
        onRefetch,
      );

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

      const timestamp = getCurrentTimestamp();

      const plantas: Planta[] = validas.map((pos) => ({
        id: generateUUID(),
        zona_id: data.zona.id,
        tipo_cultivo_id: data.tipoCultivoId,
        x: pos.x,
        y: pos.y,
        estado: ESTADO_PLANTA.PLANTADA,
        etapa_actual: ETAPA.PLANTULA,
        fecha_plantacion: timestamp,
        notas: "",
        created_at: timestamp,
        updated_at: timestamp,
      }));

      await ejecutarMutacion(
        () => plantasDAL.bulkAdd(plantas),
        "creando plantas en grid",
        onRefetch,
      );

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

      await ejecutarMutacion(
        () =>
          plantasDAL.update(id, {
            x: nuevaPosicion.x,
            y: nuevaPosicion.y,
            updated_at: getCurrentTimestamp(),
          }),
        "moviendo planta",
        onRefetch,
      );

      return {};
    },
    [onRefetch],
  );

  const cambiarEstado = useCallback(
    async (id: UUID, estado: EstadoPlanta) => {
      if (!validarEstadoPlanta(estado)) {
        return {
          error: `Estado invalido: "${estado}". Debe ser uno de: plantada, creciendo, produciendo, muerta`,
        };
      }

      await ejecutarMutacion(
        () =>
          plantasDAL.update(id, {
            estado,
            updated_at: getCurrentTimestamp(),
          }),
        "cambiando estado de planta",
        onRefetch,
      );

      return {};
    },
    [onRefetch],
  );

  const cambiarEtapa = useCallback(
    async (id: UUID, etapa: EtapaCrecimiento) => {
      if (!validarEtapaPlanta(etapa)) {
        return {
          error: `Etapa invalida: "${etapa}". Debe ser una de: plantula, joven, adulta, madura`,
        };
      }

      await ejecutarMutacion(
        () =>
          plantasDAL.update(id, {
            etapa_actual: etapa,
            fecha_cambio_etapa: getCurrentTimestamp(),
            updated_at: getCurrentTimestamp(),
          }),
        "cambiando etapa de planta",
        onRefetch,
      );

      return {};
    },
    [onRefetch],
  );

  const eliminarPlanta = useCallback(
    async (id: UUID) => {
      await ejecutarMutacion(
        () => plantasDAL.delete(id),
        "eliminando planta",
        onRefetch,
      );
    },
    [onRefetch],
  );

  const eliminarPlantasMuertas = useCallback(
    async (zonaId: UUID) => {
      await ejecutarMutacion(
        () => transaccionesDAL.eliminarPlantasMuertas(zonaId),
        "eliminando plantas muertas",
        onRefetch,
      );
      return 0;
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

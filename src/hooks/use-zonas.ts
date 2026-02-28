"use client";

import { useCallback } from "react";
import { zonasDAL, transaccionesDAL } from "@/lib/dal";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import {
  validarNuevaZona,
  validarRedimensionarZona,
  validarMoverZona,
} from "@/lib/validations/zona";
import { ejecutarMutacion } from "@/lib/helpers/dal-mutation";
import type {
  Zona,
  Terreno,
  Planta,
  TipoZona,
  UUID,
  EstanqueConfig,
} from "@/types";
import { COLORES_ZONA } from "@/lib/constants/entities";

interface UseZonas {
  crearZona: (data: {
    nombre: string;
    tipo: TipoZona;
    x: number;
    y: number;
    ancho: number;
    alto: number;
    estanque_config?: EstanqueConfig;
  }) => Promise<{ zona?: Zona; error?: string }>;

  actualizarZona: (
    id: UUID,
    cambios: Partial<Zona>,
  ) => Promise<{ error?: string }>;

  redimensionarZona: (
    id: UUID,
    nuevoTamaño: { ancho: number; alto: number },
  ) => Promise<{ error?: string }>;

  moverZona: (
    id: UUID,
    nuevaPosicion: { x: number; y: number },
  ) => Promise<{ error?: string }>;

  eliminarZona: (id: UUID) => Promise<{ error?: string }>;
}

export function useZonas(
  terrenoId: UUID,
  terreno: Terreno,
  zonas: Zona[],
  plantas: Planta[],
  onRefetch: () => void,
): UseZonas {
  const crearZona = useCallback(
    async (data: {
      nombre: string;
      tipo: TipoZona;
      x: number;
      y: number;
      ancho: number;
      alto: number;
      estanque_config?: EstanqueConfig;
    }) => {
      const validacion = validarNuevaZona(data, zonas, terreno);
      if (!validacion.valida) {
        return { error: validacion.error };
      }

      const nuevaZona: Zona = {
        id: generateUUID(),
        terreno_id: terrenoId,
        nombre: data.nombre,
        tipo: data.tipo,
        estado: "vacia",
        x: data.x,
        y: data.y,
        ancho: data.ancho,
        alto: data.alto,
        area_m2: data.ancho * data.alto,
        color: COLORES_ZONA[data.tipo],
        estanque_config: data.estanque_config,
        notas: "",
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp(),
      };

      await ejecutarMutacion(
        () => zonasDAL.add(nuevaZona),
        "creando zona",
        onRefetch,
      );

      return { zona: nuevaZona };
    },
    [terrenoId, terreno, zonas, onRefetch],
  );

  const actualizarZona = useCallback(
    async (id: UUID, cambios: Partial<Zona>) => {
      if (cambios.tipo && !cambios.color) {
        cambios.color = COLORES_ZONA[cambios.tipo];
      }

      await ejecutarMutacion(
        () =>
          zonasDAL.update(id, {
            ...cambios,
            updated_at: getCurrentTimestamp(),
          }),
        "actualizando zona",
        onRefetch,
      );

      return {};
    },
    [onRefetch],
  );

  const redimensionarZona = useCallback(
    async (id: UUID, nuevoTamaño: { ancho: number; alto: number }) => {
      const zona = zonas.find((z) => z.id === id);
      if (!zona) {
        return { error: "Zona no encontrada" };
      }

      const plantasZona = plantas.filter((p) => p.zona_id === id);
      const validacion = validarRedimensionarZona(
        zona,
        nuevoTamaño,
        plantasZona,
        zonas,
        terreno,
      );

      if (!validacion.valida) {
        return { error: validacion.error };
      }

      await ejecutarMutacion(
        () =>
          zonasDAL.update(id, {
            ancho: nuevoTamaño.ancho,
            alto: nuevoTamaño.alto,
            area_m2: nuevoTamaño.ancho * nuevoTamaño.alto,
            updated_at: getCurrentTimestamp(),
          }),
        "redimensionando zona",
        onRefetch,
      );

      return {};
    },
    [zonas, plantas, terreno, onRefetch],
  );

  const moverZona = useCallback(
    async (id: UUID, nuevaPosicion: { x: number; y: number }) => {
      const zona = zonas.find((z) => z.id === id);
      if (!zona) {
        return { error: "Zona no encontrada" };
      }

      const validacion = validarMoverZona(zona, nuevaPosicion, zonas, terreno);
      if (!validacion.valida) {
        return { error: validacion.error };
      }

      await ejecutarMutacion(
        () =>
          zonasDAL.update(id, {
            x: nuevaPosicion.x,
            y: nuevaPosicion.y,
            updated_at: getCurrentTimestamp(),
          }),
        "moviendo zona",
        onRefetch,
      );

      return {};
    },
    [zonas, terreno, onRefetch],
  );

  const eliminarZona = useCallback(
    async (id: UUID) => {
      await ejecutarMutacion(
        () => transaccionesDAL.eliminarZonaCascade(id),
        "eliminando zona",
        onRefetch,
      );

      return {};
    },
    [onRefetch],
  );

  return {
    crearZona,
    actualizarZona,
    redimensionarZona,
    moverZona,
    eliminarZona,
  };
}

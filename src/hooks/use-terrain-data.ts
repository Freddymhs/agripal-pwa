"use client";

import { useState, useEffect, useCallback } from "react";
import { terrenosDAL, zonasDAL, catalogoDAL, plantasDAL } from "@/lib/dal";
import type { Terreno, Zona, Planta, CatalogoCultivo } from "@/types";

interface UseTerrainDataOptions {
  skipPlants?: boolean;
  staleTime?: number;
}

interface UseTerrainDataResult {
  terreno: Terreno | null;
  zonas: Zona[];
  plantas: Planta[];
  catalogoCultivos: CatalogoCultivo[];
  estanques: Zona[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTerrainData(
  options?: UseTerrainDataOptions,
): UseTerrainDataResult {
  const skipPlants = options?.skipPlants ?? false;

  const [terreno, setTerreno] = useState<Terreno | null>(null);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [catalogoCultivos, setCatalogoCultivos] = useState<CatalogoCultivo[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const terrenos = await terrenosDAL.getAll();
      if (terrenos.length === 0) {
        setTerreno(null);
        setZonas([]);
        setPlantas([]);
        setCatalogoCultivos([]);
        return;
      }

      const t = terrenos[0];
      setTerreno(t);

      const [z, c] = await Promise.all([
        zonasDAL.getByTerrenoId(t.id),
        catalogoDAL.getByProyectoId(t.proyecto_id),
      ]);
      setZonas(z);
      setCatalogoCultivos(c);

      if (!skipPlants) {
        const zonaIds = z.map((zona) => zona.id);
        const p =
          zonaIds.length > 0 ? await plantasDAL.getByZonaIds(zonaIds) : [];
        setPlantas(p);
      }
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("Error cargando datos del terreno");
      setError(error);
      setTerreno(null);
      setZonas([]);
      setPlantas([]);
      setCatalogoCultivos([]);
    } finally {
      setLoading(false);
    }
  }, [skipPlants]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const estanques = zonas.filter((z) => z.tipo === "estanque");

  return {
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
    estanques,
    loading,
    error,
    refetch,
  };
}

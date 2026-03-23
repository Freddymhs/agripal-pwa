"use client";

import { useState, useCallback, useMemo } from "react";
import { logger } from "@/lib/logger";
import { ESTADO_PLANTA, TIPO_ZONA } from "@/lib/constants/entities";
import { SEMANAS_POR_MES } from "@/lib/constants/conversiones";
import { filtrarEstanques } from "@/lib/utils/helpers-cultivo";
import {
  calcularROI,
  obtenerCostoAguaPromedio,
  type ProyeccionROI,
} from "@/lib/utils/roi";
import {
  calcularConsumoZona,
  type OpcionesConsumoAgua,
} from "@/lib/utils/agua";
import { calcularMetricasEconomicas } from "@/lib/utils/economia-avanzada";
import { generarProyeccionAnual } from "@/lib/utils/agua-proyeccion-anual";
import { generarReporteFinanciero } from "@/lib/utils/reporte-financiero";
import { generarReporteAgua } from "@/lib/utils/reporte-agua";
import { generarReporteProduccion } from "@/lib/utils/reporte-produccion";
import type {
  Terreno,
  Zona,
  Planta,
  CatalogoCultivo,
  Cosecha,
  FuenteAgua,
  SueloTerreno,
} from "@/types";

// ─── Tipos ──────────────────────────────────────────────────────────

type TipoReporte = "financiero" | "agua" | "produccion";

interface UseReportes {
  generando: TipoReporte | null;
  generarFinanciero: () => void;
  generarAgua: () => void;
  generarProduccion: () => void;
  tieneData: { financiero: boolean; agua: boolean; produccion: boolean };
}

interface UseReportesParams {
  terreno: Terreno | null;
  zonas: Zona[];
  plantas: Planta[];
  catalogoCultivos: CatalogoCultivo[];
  cosechas: Cosecha[];
  fuentesAgua: FuenteAgua[];
  suelo?: SueloTerreno | null;
  opcionesConsumoAgua?: OpcionesConsumoAgua;
}

// ─── Helpers internos ───────────────────────────────────────────────

function calcularROIsPorZona(
  terreno: Terreno,
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  fuentesAgua: FuenteAgua[],
  suelo?: SueloTerreno | null,
  opcionesConsumoAgua?: OpcionesConsumoAgua,
): Array<{
  zona: Zona;
  cultivo: CatalogoCultivo;
  numPlantas: number;
  roi: ProyeccionROI;
  consumoSemanal: number;
}> {
  const estanques = filtrarEstanques(zonas);
  const costoAguaM3 = obtenerCostoAguaPromedio(estanques, terreno);
  const zonasConCultivo = zonas.filter((z) => z.tipo === TIPO_ZONA.CULTIVO);
  const resultados: Array<{
    zona: Zona;
    cultivo: CatalogoCultivo;
    numPlantas: number;
    roi: ProyeccionROI;
    consumoSemanal: number;
  }> = [];

  for (const zona of zonasConCultivo) {
    const plantasZona = plantas.filter(
      (p) => p.zona_id === zona.id && p.estado !== ESTADO_PLANTA.MUERTA,
    );
    if (plantasZona.length === 0) continue;

    const cultivosPorTipo = plantasZona.reduce(
      (acc, p) => {
        acc[p.tipo_cultivo_id] = (acc[p.tipo_cultivo_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    for (const [cultivoId, count] of Object.entries(cultivosPorTipo)) {
      const cultivo = catalogoCultivos.find((c) => c.id === cultivoId);
      if (!cultivo) continue;

      const plantasCultivo = plantasZona.filter(
        (p) => p.tipo_cultivo_id === cultivoId,
      );
      const consumoSemanal = calcularConsumoZona(
        zona,
        plantasCultivo,
        catalogoCultivos,
        undefined,
        opcionesConsumoAgua,
      );
      const roi = calcularROI(
        cultivo,
        zona,
        count,
        costoAguaM3,
        consumoSemanal,
        suelo ?? null,
      );
      resultados.push({
        zona,
        cultivo,
        numPlantas: count,
        roi,
        consumoSemanal,
      });
    }
  }

  return resultados;
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useReportes(params: UseReportesParams): UseReportes {
  const {
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
    cosechas,
    fuentesAgua,
    suelo,
    opcionesConsumoAgua,
  } = params;
  const [generando, setGenerando] = useState<TipoReporte | null>(null);

  const tieneData = useMemo(
    () => ({
      financiero:
        plantas.filter((p) => p.estado !== ESTADO_PLANTA.MUERTA).length > 0,
      agua: zonas.some(
        (z) => z.tipo === TIPO_ZONA.ESTANQUE && z.estanque_config,
      ),
      produccion: cosechas.length > 0,
    }),
    [plantas, zonas, cosechas],
  );

  const generarFinanciero = useCallback(() => {
    if (!terreno || generando) return;
    setGenerando("financiero");

    try {
      const roisData = calcularROIsPorZona(
        terreno,
        zonas,
        plantas,
        catalogoCultivos,
        fuentesAgua,
        suelo,
        opcionesConsumoAgua,
      );

      const zonasReporte = roisData.map((r) => ({
        nombre: r.zona.nombre,
        cultivo: r.cultivo.nombre,
        numPlantas: r.numPlantas,
        costoUnitario:
          r.numPlantas > 0 ? r.roi.costo_plantas / r.numPlantas : 0,
        subtotal: r.roi.costo_plantas,
        costoAguaAnual: r.roi.costo_agua_anual,
      }));

      const metricas = roisData.map((r) => ({
        zona: r.zona.nombre,
        metricas: calcularMetricasEconomicas(r.roi, r.cultivo, r.roi.kg_año3),
      }));

      generarReporteFinanciero({
        terreno: {
          nombre: terreno.nombre,
          area_m2: terreno.area_m2,
          ubicacion: terreno.ubicacion?.region ?? "Arica",
        },
        zonas: zonasReporte,
        rois: roisData.map((r) => r.roi),
        metricas,
      });

      logger.info("Reporte financiero generado");
    } catch (err) {
      logger.error("Error generando reporte financiero", {
        error: err instanceof Error ? { message: err.message } : { err },
      });
    } finally {
      setGenerando(null);
    }
  }, [
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
    fuentesAgua,
    suelo,
    opcionesConsumoAgua,
    generando,
  ]);

  const generarAgua = useCallback(() => {
    if (!terreno || generando) return;
    setGenerando("agua");

    try {
      const zonasConCultivo = zonas.filter((z) => z.tipo === TIPO_ZONA.CULTIVO);
      const estanques = filtrarEstanques(zonas);

      const consumoPorZona = zonasConCultivo
        .map((zona) => {
          const plantasZona = plantas.filter(
            (p) => p.zona_id === zona.id && p.estado !== ESTADO_PLANTA.MUERTA,
          );
          if (plantasZona.length === 0) return null;

          const cultivoId = plantasZona[0].tipo_cultivo_id;
          const cultivo = catalogoCultivos.find((c) => c.id === cultivoId);
          const consumoSemanal = calcularConsumoZona(
            zona,
            plantasZona,
            catalogoCultivos,
            undefined,
            opcionesConsumoAgua,
          );

          return {
            zona: zona.nombre,
            cultivo: cultivo?.nombre ?? "Desconocido",
            plantas: plantasZona.length,
            m3Semana: consumoSemanal,
            m3Mes: consumoSemanal * SEMANAS_POR_MES,
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);

      const estanquesReporte = estanques.map((e) => {
        const cfg = e.estanque_config!;
        const pctLleno =
          cfg.capacidad_m3 > 0
            ? Math.round((cfg.nivel_actual_m3 / cfg.capacidad_m3) * 100)
            : 0;
        return {
          nombre: e.nombre,
          capacidadM3: cfg.capacidad_m3,
          nivelActualM3: cfg.nivel_actual_m3,
          pctLleno,
        };
      });

      const costoM3 = obtenerCostoAguaPromedio(estanques, terreno);

      const proyeccion = generarProyeccionAnual(
        terreno,
        zonas,
        plantas,
        catalogoCultivos,
      );

      generarReporteAgua({
        terreno: {
          nombre: terreno.nombre,
          fuenteAgua: terreno.agua_fuente ?? "No especificada",
        },
        consumoPorZona,
        estanques: estanquesReporte,
        costoM3,
        proyeccion,
      });

      logger.info("Reporte de agua generado");
    } catch (err) {
      logger.error("Error generando reporte de agua", {
        error: err instanceof Error ? { message: err.message } : { err },
      });
    } finally {
      setGenerando(null);
    }
  }, [
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
    opcionesConsumoAgua,
    generando,
  ]);

  const generarProduccionPdf = useCallback(() => {
    if (!terreno || generando) return;
    setGenerando("produccion");

    try {
      const roisData = calcularROIsPorZona(
        terreno,
        zonas,
        plantas,
        catalogoCultivos,
        fuentesAgua,
        suelo,
        opcionesConsumoAgua,
      );

      // Produccion real por zona
      const produccionPorZona = roisData.map((r) => {
        const cosechasZona = cosechas.filter(
          (c) => c.zona_id === r.zona.id && c.tipo_cultivo_id === r.cultivo.id,
        );
        const kgReal = cosechasZona.reduce((s, c) => s + c.cantidad_kg, 0);
        const kgProyectado = r.roi.kg_año3;
        const ingresoReal = cosechasZona
          .filter((c) => c.vendido && c.precio_venta_clp)
          .reduce((s, c) => s + (c.precio_venta_clp ?? 0) * c.cantidad_kg, 0);
        const areaM2 = r.zona.area_m2 || r.zona.ancho * r.zona.alto;

        return {
          zona: r.zona.nombre,
          cultivo: r.cultivo.nombre,
          kgReal,
          kgProyectado,
          pctLogrado:
            kgProyectado > 0 ? Math.round((kgReal / kgProyectado) * 100) : 0,
          kgPorM2: areaM2 > 0 ? kgReal / areaM2 : 0,
          ingresoReal,
          ingresoProyectado: r.roi.ingreso_año3,
        };
      });

      // Resumen mensual
      const porMes = new Map<
        string,
        { kg: number; clp: number; count: number }
      >();
      for (const c of cosechas) {
        const fecha = new Date(c.fecha);
        const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
        const entry = porMes.get(key) ?? { kg: 0, clp: 0, count: 0 };
        entry.kg += c.cantidad_kg;
        if (c.vendido && c.precio_venta_clp) {
          entry.clp += c.precio_venta_clp * c.cantidad_kg;
        }
        entry.count += 1;
        porMes.set(key, entry);
      }

      const resumenMensual = Array.from(porMes.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, data]) => ({
          mes,
          totalKg: data.kg,
          totalCLP: data.clp,
          registros: data.count,
        }));

      // Distribucion por calidad
      const calidades = ["A", "B", "C"] as const;
      const totalKgGlobal = cosechas.reduce((s, c) => s + c.cantidad_kg, 0);
      const distribucionCalidad = calidades.map((cal) => {
        const filtered = cosechas.filter((c) => c.calidad === cal);
        const kg = filtered.reduce((s, c) => s + c.cantidad_kg, 0);
        return {
          calidad: cal,
          cantidad: filtered.length,
          kg,
          porcentaje: totalKgGlobal > 0 ? (kg / totalKgGlobal) * 100 : 0,
        };
      });

      generarReporteProduccion({
        terreno: { nombre: terreno.nombre },
        produccionPorZona,
        resumenMensual,
        distribucionCalidad,
        cosechas,
        rois: roisData.map((r) => r.roi),
      });

      logger.info("Reporte de produccion generado");
    } catch (err) {
      logger.error("Error generando reporte de produccion", {
        error: err instanceof Error ? { message: err.message } : { err },
      });
    } finally {
      setGenerando(null);
    }
  }, [
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
    cosechas,
    fuentesAgua,
    suelo,
    opcionesConsumoAgua,
    generando,
  ]);

  return {
    generando,
    generarFinanciero,
    generarAgua,
    generarProduccion: generarProduccionPdf,
    tieneData,
  };
}

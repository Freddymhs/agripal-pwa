import type { Terreno, Zona, Planta, CatalogoCultivo } from "@/types";
import type { Temporada } from "@/types";
import { calcularConsumoTerreno, calcularStockEstanques } from "./agua";
import { obtenerCostoAguaPromedio } from "./roi";
import { getDiasTotalesCultivo } from "@/lib/data/duracion-etapas";
import { addMonths, addDays, format, getMonth } from "date-fns";
import { es } from "date-fns/locale";

export interface ProyeccionMensual {
  mes: number;
  mesNombre: string;
  nivelInicio: number;
  consumo: number;
  recargas: number;
  nivelFin: number;
  diasDeficit: number;
  temporada: Temporada;
}

export interface EventoFuturo {
  fecha: Date;
  tipo: "recarga" | "replanta" | "lavado" | "cosecha";
  titulo: string;
  descripcion: string;
}

export interface ProyeccionAnual {
  meses: ProyeccionMensual[];
  eventos: EventoFuturo[];
  resumen: {
    consumoTotalAnual: number;
    recargasTotales: number;
    costosAgua: number;
    mesesDeficit: number;
    fechaPrimerDeficit: Date | null;
  };
}

function getTemporadaPorMes(mes: number): Temporada {
  if (mes >= 11 || mes <= 1) return "verano";
  if (mes >= 2 && mes <= 4) return "otoño";
  if (mes >= 5 && mes <= 7) return "invierno";
  return "primavera";
}

export function generarProyeccionAnual(
  terreno: Terreno,
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
): ProyeccionAnual {
  const hoy = new Date();
  const meses: ProyeccionMensual[] = [];
  const eventos: EventoFuturo[] = [];

  const estanques = zonas.filter(
    (z) => z.tipo === "estanque" && z.estanque_config,
  );
  const { aguaTotal } = calcularStockEstanques(estanques);
  let nivelActual = estanques.length > 0 ? aguaTotal : terreno.agua_actual_m3;
  let consumoTotalAnual = 0;
  let recargasTotales = 0;
  let mesesDeficit = 0;
  let fechaPrimerDeficit: Date | null = null;

  for (let i = 0; i < 12; i++) {
    const fechaMes = addMonths(hoy, i);
    const mesNum = getMonth(fechaMes);
    const temporada = getTemporadaPorMes(mesNum);
    // const factorTemporada = FACTORES_TEMPORADA[temporada] // No se usa aún

    const consumoSemanal =
      calcularConsumoTerreno(zonas, plantas, catalogoCultivos, temporada) || 0;
    const consumoMensual = (isNaN(consumoSemanal) ? 0 : consumoSemanal) * 4.33;

    let recargasMes = 0;
    for (const est of estanques) {
      const recarga = est.estanque_config?.recarga;
      if (recarga) {
        const freq = recarga.frecuencia_dias ?? 30;
        if (freq <= 0) continue;
        if (recarga.cantidad_litros <= 0) continue;
        const diasEnMes = 30;
        const recargasPorMes = Math.floor(diasEnMes / freq);
        recargasMes += recargasPorMes * (recarga.cantidad_litros / 1000);
      }
    }

    const nivelInicio = nivelActual;
    const nivelFin = Math.max(0, nivelInicio + recargasMes - consumoMensual);
    const diasDeficit =
      nivelFin <= 0 && consumoMensual > 0
        ? Math.ceil(
            Math.max(0, consumoMensual - nivelInicio - recargasMes) /
              (consumoMensual / 30),
          )
        : 0;

    if (diasDeficit > 0 && !fechaPrimerDeficit) {
      fechaPrimerDeficit = fechaMes;
      mesesDeficit++;
    } else if (diasDeficit > 0) {
      mesesDeficit++;
    }

    meses.push({
      mes: i,
      mesNombre: format(fechaMes, "MMMM yyyy", { locale: es }),
      nivelInicio,
      consumo: consumoMensual,
      recargas: recargasMes,
      nivelFin,
      diasDeficit,
      temporada,
    });

    nivelActual = nivelFin;
    consumoTotalAnual += consumoMensual;
    recargasTotales += recargasMes;
  }

  for (const est of estanques) {
    const recarga = est.estanque_config?.recarga;
    if (!recarga) continue;

    let fechaRecarga = recarga.proxima_recarga
      ? new Date(recarga.proxima_recarga)
      : addDays(hoy, recarga.frecuencia_dias);

    const finProyeccion = addMonths(hoy, 12);
    while (fechaRecarga < finProyeccion) {
      eventos.push({
        fecha: new Date(fechaRecarga),
        tipo: "recarga",
        titulo: `Recarga ${est.nombre}`,
        descripcion: `${recarga.cantidad_litros.toLocaleString()} L`,
      });
      fechaRecarga = addDays(fechaRecarga, recarga.frecuencia_dias);
    }
  }

  for (const planta of plantas) {
    if (planta.estado === "muerta" || !planta.fecha_plantacion) continue;

    const cultivo = catalogoCultivos.find(
      (c) => c.id === planta.tipo_cultivo_id,
    );
    if (!cultivo) continue;

    const fechaPlantacion = new Date(planta.fecha_plantacion);
    const cicloTotal = getDiasTotalesCultivo(cultivo.nombre);
    const fechaReplanta = addDays(fechaPlantacion, cicloTotal);
    const finProyeccion = addMonths(hoy, 12);

    if (fechaReplanta > hoy && fechaReplanta < finProyeccion) {
      eventos.push({
        fecha: fechaReplanta,
        tipo: "replanta",
        titulo: `Replante ${cultivo.nombre}`,
        descripcion: `Ciclo de ${cicloTotal} días completado`,
      });
    }

    if (!cultivo.tiempo_produccion_meses) continue;
    const tiempoProduccionDias = cultivo.tiempo_produccion_meses * 30;
    const fechaCosecha = addDays(fechaPlantacion, tiempoProduccionDias);

    if (fechaCosecha > hoy && fechaCosecha < finProyeccion) {
      eventos.push({
        fecha: fechaCosecha,
        tipo: "cosecha",
        titulo: `Cosecha ${cultivo.nombre}`,
        descripcion: `Después de ${cultivo.tiempo_produccion_meses} meses`,
      });
    }
  }

  for (const est of estanques) {
    if (!est.estanque_config?.recarga?.ultima_recarga) continue;
    const ultimaRecarga = new Date(est.estanque_config.recarga.ultima_recarga);
    let fechaLavado = addDays(ultimaRecarga, 30);
    const finProyeccion = addMonths(hoy, 12);

    while (fechaLavado < finProyeccion) {
      if (fechaLavado > hoy) {
        eventos.push({
          fecha: fechaLavado,
          tipo: "lavado",
          titulo: `Lavado salino ${est.nombre}`,
          descripcion: "Riego extra 20% para lixiviar sales",
        });
      }
      fechaLavado = addDays(fechaLavado, 30);
    }
  }

  eventos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  const costoAguaM3 = obtenerCostoAguaPromedio(estanques, terreno) || 0;
  const costosAgua = consumoTotalAnual * costoAguaM3;

  return {
    meses,
    eventos,
    resumen: {
      consumoTotalAnual,
      recargasTotales,
      costosAgua,
      mesesDeficit,
      fechaPrimerDeficit,
    },
  };
}

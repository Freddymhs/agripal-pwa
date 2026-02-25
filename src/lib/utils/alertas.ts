import type { Alerta, Terreno, Zona, Planta, CatalogoCultivo } from "@/types";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import {
  calcularConsumoTerreno,
  calcularStockEstanques,
  calcularDiasRestantes,
} from "@/lib/utils/agua";
import { getDiasTotalesCultivo } from "@/lib/data/duracion-etapas";
import { alertasDAL, transaccionesDAL } from "@/lib/dal";
import { differenceInDays } from "date-fns";
import { ESPACIADO_MINIMO_M, DIAS_ALERTA_AGUA_CRITICA, DIAS_LAVADO_SALINO, PORCENTAJE_CICLO_REPLANTA } from "@/lib/constants/conversiones";
import { ESTADO_PLANTA, ETAPA, TIPO_ZONA, TIPO_RIEGO, SEVERIDAD_ALERTA, ESTADO_ALERTA } from "@/lib/constants/entities";
import { distancia } from "@/lib/utils/math";
import { filtrarEstanques } from "@/lib/utils/helpers-cultivo";

function generarAlertas(
  terreno: Terreno,
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
): Omit<Alerta, "id" | "created_at" | "updated_at">[] {
  const alertas: Omit<Alerta, "id" | "created_at" | "updated_at">[] = [];

  const estanques = filtrarEstanques(zonas);
  const { aguaTotal } = calcularStockEstanques(estanques);
  const aguaActual = estanques.length > 0 ? aguaTotal : terreno.agua_actual_m3;

  const consumoSemanal = calcularConsumoTerreno(
    zonas,
    plantas,
    catalogoCultivos,
  );
  const diasRestantes = calcularDiasRestantes(aguaActual, consumoSemanal);
  if (isNaN(diasRestantes)) return alertas;

  if (aguaActual < consumoSemanal) {
    alertas.push({
      terreno_id: terreno.id,
      tipo: "deficit_agua",
      severidad: SEVERIDAD_ALERTA.CRITICAL,
      estado: ESTADO_ALERTA.ACTIVA,
      titulo: "Déficit de agua",
      descripcion: `El agua disponible (${aguaActual.toFixed(1)} m³) es menor al consumo semanal (${consumoSemanal.toFixed(1)} m³).`,
      sugerencia: "Registra una entrada de agua o reduce el número de plantas.",
    });
  }

  if (
    diasRestantes !== Infinity &&
    diasRestantes <= DIAS_ALERTA_AGUA_CRITICA &&
    diasRestantes > 0
  ) {
    const proximaRecarga = estanques
      .map((e) => e.estanque_config?.recarga?.proxima_recarga)
      .filter((r): r is string => !!r)
      .sort()[0];
    let sugerencia = `Tienes agua para ${Math.floor(diasRestantes)} días. Adelanta la recarga de agua.`;

    if (proximaRecarga) {
      const diasHastaRecarga = differenceInDays(
        new Date(proximaRecarga),
        new Date(),
      );
      if (diasHastaRecarga > diasRestantes) {
        sugerencia = `Agua para ${Math.floor(diasRestantes)} días pero recarga en ${diasHastaRecarga} días. ¡Adelanta ${Math.ceil(diasHastaRecarga - diasRestantes)} días!`;
      }
    }

    alertas.push({
      terreno_id: terreno.id,
      tipo: "agua_critica",
      severidad: SEVERIDAD_ALERTA.CRITICAL,
      estado: ESTADO_ALERTA.ACTIVA,
      titulo: `⚠️ Agua crítica: solo ${Math.floor(diasRestantes)} días`,
      descripcion: `El agua actual alcanza solo para ${Math.floor(diasRestantes)} días con el consumo actual.`,
      sugerencia,
    });
  }

  for (const est of estanques) {
    if (!est.estanque_config?.fuente_id) {
      alertas.push({
        terreno_id: terreno.id,
        zona_id: est.id,
        tipo: "estanque_sin_fuente",
        severidad: SEVERIDAD_ALERTA.WARNING,
        estado: ESTADO_ALERTA.ACTIVA,
        titulo: `⚠️ Fuente de agua no configurada`,
        descripcion: `El estanque "${est.nombre}" no tiene fuente de agua asignada. Los cálculos de calidad y costo son aproximados.`,
        sugerencia:
          "Asigna una fuente (Lluta, Azapa, aljibe, etc.) para tener riesgos y costos reales.",
      });
    }
  }

  for (const zona of zonas) {
    const plantasZona = plantas.filter((p) => p.zona_id === zona.id);

    if (
      zona.tipo === TIPO_ZONA.CULTIVO &&
      !zona.configuracion_riego &&
      plantasZona.length > 0
    ) {
      alertas.push({
        terreno_id: terreno.id,
        zona_id: zona.id,
        tipo: "zona_sin_riego",
        severidad: SEVERIDAD_ALERTA.WARNING,
        estado: ESTADO_ALERTA.ACTIVA,
        titulo: `⚠️ Sistema de riego no configurado en "${zona.nombre}"`,
        descripcion:
          "El consumo se calcula solo con datos del cultivo y clima, no con tu instalación real.",
        sugerencia:
          "Configura caudal (L/h) y horas de riego para comparar riego recomendado vs real.",
      });
    }

    if (zona.tipo === TIPO_ZONA.CULTIVO && plantasZona.length === 0) {
      alertas.push({
        terreno_id: terreno.id,
        zona_id: zona.id,
        tipo: "zona_sin_cultivo",
        severidad: SEVERIDAD_ALERTA.INFO,
        estado: ESTADO_ALERTA.ACTIVA,
        titulo: `Zona "${zona.nombre}" sin cultivos`,
        descripcion: "Esta zona de cultivo no tiene plantas.",
        sugerencia: "Agrega plantas o cambia el tipo de zona.",
      });
    }

    for (let i = 0; i < plantasZona.length; i++) {
      if (plantasZona[i].x == null || plantasZona[i].y == null) continue;
      for (let j = i + 1; j < plantasZona.length; j++) {
        if (plantasZona[j].x == null || plantasZona[j].y == null) continue;
        const dist = distancia(plantasZona[i], plantasZona[j]);
        if (dist < ESPACIADO_MINIMO_M) {
          alertas.push({
            terreno_id: terreno.id,
            zona_id: zona.id,
            planta_id: plantasZona[i].id,
            tipo: "espaciado_incorrecto",
            severidad: SEVERIDAD_ALERTA.WARNING,
            estado: ESTADO_ALERTA.ACTIVA,
            titulo: "Plantas muy cercanas",
            descripcion: `Dos plantas están a ${dist.toFixed(2)}m de distancia (mínimo: ${ESPACIADO_MINIMO_M}m).`,
            sugerencia: "Mueve una de las plantas o elimínala.",
          });
          break;
        }
      }
    }

    const plantasMuertas = plantasZona.filter((p) => p.estado === ESTADO_PLANTA.MUERTA);
    if (plantasMuertas.length > 0) {
      alertas.push({
        terreno_id: terreno.id,
        zona_id: zona.id,
        tipo: "planta_muerta",
        severidad: SEVERIDAD_ALERTA.WARNING,
        estado: ESTADO_ALERTA.ACTIVA,
        titulo: `${plantasMuertas.length} planta(s) muerta(s) en "${zona.nombre}"`,
        descripcion: "Hay plantas muertas que deberían ser removidas.",
        sugerencia: "Elimina las plantas muertas y considera reemplazarlas.",
      });
    }

    const plantasProduciendo = plantasZona.filter(
      (p) => p.estado === ESTADO_PLANTA.PRODUCIENDO,
    );
    if (plantasProduciendo.length > 0) {
      alertas.push({
        terreno_id: terreno.id,
        zona_id: zona.id,
        tipo: "cosecha_pendiente",
        severidad: SEVERIDAD_ALERTA.INFO,
        estado: ESTADO_ALERTA.ACTIVA,
        titulo: `${plantasProduciendo.length} planta(s) listas para cosechar`,
        descripcion: `Hay plantas produciendo en "${zona.nombre}".`,
        sugerencia: "Registra la cosecha cuando recojas los frutos.",
      });
    }

    if (
      zona.tipo === TIPO_ZONA.CULTIVO &&
      zona.configuracion_riego?.tipo === TIPO_RIEGO.CONTINUO
    ) {
      const texturaSuelo = terreno.suelo?.fisico?.textura;
      if (texturaSuelo === "arcillosa" || texturaSuelo === "franco-arcillosa") {
        alertas.push({
          terreno_id: terreno.id,
          zona_id: zona.id,
          tipo: "riesgo_encharcamiento",
          severidad: SEVERIDAD_ALERTA.WARNING,
          estado: ESTADO_ALERTA.ACTIVA,
          titulo: `⚠️ Riesgo encharcamiento en "${zona.nombre}"`,
          descripcion: `Suelo ${texturaSuelo} + riego continuo 24/7 puede causar pudrición de raíces.`,
          sugerencia:
            "Cambia a riego programado (6-8h/día) para evitar encharcamiento.",
        });
      }
    }

    for (const planta of plantasZona) {
      if (planta.estado === ESTADO_PLANTA.MUERTA || !planta.fecha_plantacion) continue;

      const cultivo = catalogoCultivos.find(
        (c) => c.id === planta.tipo_cultivo_id,
      );
      if (!cultivo) continue;

      const diasDesde = differenceInDays(
        new Date(),
        new Date(planta.fecha_plantacion),
      );
      const cicloTotal = getDiasTotalesCultivo(cultivo.nombre);

      if (diasDesde >= cicloTotal * PORCENTAJE_CICLO_REPLANTA && planta.etapa_actual === ETAPA.MADURA) {
        alertas.push({
          terreno_id: terreno.id,
          zona_id: zona.id,
          planta_id: planta.id,
          tipo: "replanta_pendiente",
          severidad: SEVERIDAD_ALERTA.INFO,
          estado: ESTADO_ALERTA.ACTIVA,
          titulo: `🔔 ${cultivo.nombre} lista para replante`,
          descripcion: `Plantada hace ${diasDesde} días (ciclo: ${cicloTotal} días).`,
          sugerencia:
            "Considera replantar en los próximos 14 días para mantener producción.",
        });
      }
    }
  }

  for (const est of estanques) {
    const ultimaRecarga = est.estanque_config?.recarga?.ultima_recarga;
    if (!ultimaRecarga) continue;
    const diasDesdeRecarga = differenceInDays(
      new Date(),
      new Date(ultimaRecarga),
    );
    if (diasDesdeRecarga >= DIAS_LAVADO_SALINO) {
      alertas.push({
        terreno_id: terreno.id,
        zona_id: est.id,
        tipo: "lavado_salino",
        severidad: SEVERIDAD_ALERTA.INFO,
        estado: ESTADO_ALERTA.ACTIVA,
        titulo: `🧼 Lavado salino pendiente - ${est.nombre}`,
        descripcion: `Han pasado ${diasDesdeRecarga} días desde la última recarga en "${est.nombre}".`,
        sugerencia: "Aplica riego extra (20%) para lixiviar sales acumuladas.",
      });
    }
  }

  return alertas;
}

export async function sincronizarAlertas(
  terreno: Terreno,
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
): Promise<Alerta[]> {
  const timestamp = getCurrentTimestamp();

  const alertasExistentes = await alertasDAL.getActiveByTerrenoId(terreno.id);

  const nuevasAlertas = generarAlertas(
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
  );

  const resolver: Array<{ id: string; cambios: Partial<Alerta> }> = [];
  for (const existente of alertasExistentes) {
    const sigueSiendo = nuevasAlertas.some(
      (n) =>
        n.tipo === existente.tipo &&
        n.zona_id === existente.zona_id &&
        n.planta_id === existente.planta_id &&
        (n.zona_id !== undefined || n.planta_id !== undefined),
    );

    if (!sigueSiendo) {
      resolver.push({
        id: existente.id,
        cambios: {
          estado: ESTADO_ALERTA.RESUELTA,
          fecha_resolucion: timestamp,
          como_se_resolvio: "Automático",
          updated_at: timestamp,
        },
      });
    }
  }

  const nuevas: Alerta[] = [];
  for (const nueva of nuevasAlertas) {
    const yaExiste = alertasExistentes.some(
      (e) =>
        e.tipo === nueva.tipo &&
        e.zona_id === nueva.zona_id &&
        e.planta_id === nueva.planta_id,
    );

    if (!yaExiste) {
      nuevas.push({
        ...nueva,
        id: generateUUID(),
        created_at: timestamp,
        updated_at: timestamp,
      });
    }
  }

  if (resolver.length > 0 || nuevas.length > 0) {
    await transaccionesDAL.sincronizarAlertas(resolver, nuevas);
  }

  return alertasDAL.getActiveByTerrenoId(terreno.id);
}

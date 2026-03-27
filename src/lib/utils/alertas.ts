import type {
  Alerta,
  Terreno,
  Zona,
  Planta,
  CatalogoCultivo,
  NutricionEtapa,
  AlelopatiaCultivo,
  VeceriaCultivo,
  IncompatibilidadQuimica,
  SueloTerreno,
  ProveedorAgua,
  SesionRiego,
} from "@/types";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import {
  calcularConsumoTerreno,
  calcularConsumoZona,
  calcularStockEstanques,
  calcularDiasRestantes,
  type OpcionesConsumoAgua,
} from "@/lib/utils/agua";
import { getDiasTotalesCultivo } from "@/lib/data/calculos-etapas";
import { alertasDAL, transaccionesDAL } from "@/lib/dal";
import { differenceInDays } from "date-fns";
import {
  ESPACIADO_MINIMO_M,
  DIAS_LAVADO_SALINO,
  PORCENTAJE_CICLO_REPLANTA,
  MAX_PLANTAS_OVERLAP_CHECK,
} from "@/lib/constants/conversiones";
import {
  DIAS_AGUA_UMBRAL_CRITICO,
  PRECIO_KG_TECHO_CLP,
} from "@/lib/constants/umbrales";
import {
  ESTADO_PLANTA,
  ETAPA,
  TIPO_ZONA,
  TIPO_RIEGO,
  esRiegoManual,
  SEVERIDAD_ALERTA,
  ESTADO_ALERTA,
  TEXTURA_SUELO,
} from "@/lib/constants/entities";
import { distancia } from "@/lib/utils/math";
import {
  filtrarEstanques,
  calcularPrecioKgPromedio,
} from "@/lib/utils/helpers-cultivo";
import { obtenerCostoAguaPromedio } from "@/lib/utils/roi";
import { KC_POR_CULTIVO } from "@/lib/data/coeficientes-kc";

const DIAS_SIN_RIEGO_UMBRAL = 7;

function quitarAcentosAlerta(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Verifica si un cultivo tiene Kc explícito (BD o archivo), no default genérico */
function tieneKcExplicito(cultivo: CatalogoCultivo): boolean {
  // Tiene kc en BD
  if (
    cultivo.kc_plantula != null ||
    cultivo.kc_joven != null ||
    cultivo.kc_adulta != null ||
    cultivo.kc_madura != null
  )
    return true;
  // Tiene kc en archivo por nombre
  const nombreNorm = quitarAcentosAlerta(cultivo.nombre.toLowerCase().trim());
  for (const key of Object.keys(KC_POR_CULTIVO)) {
    const keyNorm = quitarAcentosAlerta(key);
    if (nombreNorm.includes(keyNorm) || keyNorm.includes(nombreNorm))
      return true;
  }
  return false;
}

function generarAlertas(
  terreno: Terreno,
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  suelo?: SueloTerreno | null,
  climaBaseId?: string | null,
  proveedoresAgua?: ProveedorAgua[],
  proyectoId?: string,
  sesionesRecientes?: SesionRiego[],
  opcionesConsumoAgua?: OpcionesConsumoAgua,
): Omit<Alerta, "id" | "created_at" | "updated_at">[] {
  const alertas: Omit<Alerta, "id" | "created_at" | "updated_at">[] = [];

  const estanques = filtrarEstanques(zonas);
  const { aguaTotal } = calcularStockEstanques(estanques);
  const aguaActual = estanques.length > 0 ? aguaTotal : terreno.agua_actual_m3;

  const consumoSemanal = calcularConsumoTerreno(
    zonas,
    plantas,
    catalogoCultivos,
    undefined,
    opcionesConsumoAgua,
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
    diasRestantes <= DIAS_AGUA_UMBRAL_CRITICO &&
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

  // Alertas de agua_critica per-estanque (solo cuando hay zonas asignadas a estanques específicos)
  for (const est of estanques) {
    const zonasAsignadas = zonas.filter(
      (z) => z.tipo === TIPO_ZONA.CULTIVO && z.estanque_id === est.id,
    );
    if (zonasAsignadas.length === 0) continue;

    const nivelEst = est.estanque_config?.nivel_actual_m3 ?? 0;
    const consumoSemanalEst = zonasAsignadas.reduce(
      (sum, z) =>
        sum +
        calcularConsumoZona(
          z,
          plantas,
          catalogoCultivos,
          undefined,
          opcionesConsumoAgua,
        ),
      0,
    );
    if (consumoSemanalEst <= 0) continue;

    const diasEst = calcularDiasRestantes(nivelEst, consumoSemanalEst);
    if (
      diasEst !== Infinity &&
      diasEst <= DIAS_AGUA_UMBRAL_CRITICO &&
      diasEst > 0
    ) {
      alertas.push({
        terreno_id: terreno.id,
        zona_id: est.id,
        tipo: "agua_critica",
        severidad: SEVERIDAD_ALERTA.CRITICAL,
        estado: ESTADO_ALERTA.ACTIVA,
        titulo: `⚠️ ${est.nombre}: solo ${Math.floor(diasEst)} días de agua`,
        descripcion: `El estanque "${est.nombre}" tiene ${nivelEst.toFixed(1)} m³ para ${zonasAsignadas.length} zona(s) asignada(s). Consumo estimado: ${consumoSemanalEst.toFixed(2)} m³/sem.`,
        sugerencia: "Recarga este estanque o reduce el consumo de sus zonas.",
      });
    }
  }

  const tienZonasCultivo = zonas.some((z) => z.tipo === TIPO_ZONA.CULTIVO);

  // Clima no configurado — ET0 usará valor hardcodeado de Arica pampa (4.2 mm/día)
  if (tienZonasCultivo && !climaBaseId) {
    alertas.push({
      ...(proyectoId
        ? { proyecto_id: proyectoId }
        : { terreno_id: terreno.id }),
      tipo: "clima_no_configurado",
      severidad: SEVERIDAD_ALERTA.WARNING,
      estado: ESTADO_ALERTA.ACTIVA,
      titulo: "⚠️ Clima de la región no configurado",
      descripcion:
        "Los cálculos de agua usan ET0 estimado de Arica pampa (4.2 mm/día). Tu terreno puede tener condiciones distintas.",
      sugerencia:
        "Selecciona la zona climática más cercana en Avanzado > Clima de tu región para cálculos precisos.",
    });
  }

  // Suelo estimado (default Azapa) — el usuario nunca hizo análisis real
  if (
    tienZonasCultivo &&
    (!suelo || suelo?.quimico?.analisis_realizado === false)
  ) {
    alertas.push({
      ...(proyectoId
        ? { proyecto_id: proyectoId }
        : { terreno_id: terreno.id }),
      tipo: "suelo_sin_analisis",
      severidad: SEVERIDAD_ALERTA.WARNING,
      estado: ESTADO_ALERTA.ACTIVA,
      titulo: "⚠️ Datos de suelo estimados",
      descripcion:
        "Se están usando datos de suelo por defecto para pampa de Azapa (pH 8.2, salinidad 5 dS/m, boro 4 mg/L). La compatibilidad de cultivos puede no reflejar tu terreno real.",
      sugerencia:
        "Realiza un análisis de suelo con laboratorio y actualiza los datos en Avanzado > Tipo de suelo.",
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

  // Sin proveedores de agua registrados — el usuario no puede trackear costos de entrada
  if (
    estanques.length > 0 &&
    (!proveedoresAgua || proveedoresAgua.length === 0)
  ) {
    alertas.push({
      ...(proyectoId
        ? { proyecto_id: proyectoId }
        : { terreno_id: terreno.id }),
      tipo: "sin_proveedor_agua",
      severidad: SEVERIDAD_ALERTA.WARNING,
      estado: ESTADO_ALERTA.ACTIVA,
      titulo: "⚠️ Sin proveedores de agua configurados",
      descripcion:
        "No hay proveedores de agua registrados. El costo de las entradas de agua no se calcula automáticamente.",
      sugerencia:
        "Agrega al menos un proveedor (camión cisterna, pozo, río) en Agua > Configuración para un seguimiento completo.",
    });
  }

  // Zonas de cultivo con plantas pero sin estanque asignado
  if (estanques.length > 0) {
    const zonasSinEstanque = zonas.filter(
      (z) =>
        z.tipo === TIPO_ZONA.CULTIVO &&
        !z.estanque_id &&
        plantas.some((p) => p.zona_id === z.id),
    );
    for (const zona of zonasSinEstanque) {
      alertas.push({
        terreno_id: terreno.id,
        zona_id: zona.id,
        tipo: "zona_sin_estanque",
        severidad: SEVERIDAD_ALERTA.WARNING,
        estado: ESTADO_ALERTA.ACTIVA,
        titulo: `⚠️ "${zona.nombre}" sin estanque de riego`,
        descripcion:
          "Esta zona no tiene estanque asignado. No consume agua del sistema y los cálculos de agua, economía y reportes pueden ser imprecisos.",
        sugerencia: "Asigna un estanque desde el panel de la zona en el mapa.",
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
        severidad: SEVERIDAD_ALERTA.CRITICAL,
        estado: ESTADO_ALERTA.ACTIVA,
        titulo: `🚨 Sin sistema de riego en "${zona.nombre}" — consumo estimado sin validar`,
        descripcion:
          "No hay caudal ni horas de riego configurados. El sistema descuenta agua usando una estimación teórica (Kc × ET0), que puede estar muy alejada de tu consumo real. Sin este dato, no puedes confiar en los días restantes ni en el balance de agua.",
        sugerencia:
          'Entra al mapa, selecciona esta zona y configura "Sistema de Riego" (caudal L/h + horas/día). Es el dato más importante para que el sistema sea preciso.',
      });
    }

    if (
      zona.tipo === TIPO_ZONA.CULTIVO &&
      esRiegoManual(zona.configuracion_riego?.tipo) &&
      plantasZona.length > 0 &&
      sesionesRecientes
    ) {
      const ultimaSesion = sesionesRecientes.find((s) => s.zona_id === zona.id);
      const referencia = ultimaSesion?.fecha ?? zona.created_at;
      const diasSinRegar = differenceInDays(new Date(), new Date(referencia));
      if (diasSinRegar > DIAS_SIN_RIEGO_UMBRAL) {
        alertas.push({
          terreno_id: terreno.id,
          zona_id: zona.id,
          tipo: "sin_sesiones_recientes",
          severidad: SEVERIDAD_ALERTA.WARNING,
          estado: ESTADO_ALERTA.ACTIVA,
          titulo: `⚠️ ${zona.nombre} — ${diasSinRegar} días sin registrar riego`,
          descripcion:
            "Con riego manual el estanque no descuenta agua automáticamente.",
          sugerencia: "Si regaste, registra la sesión desde el mapa.",
        });
      }
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

    // Chequeo O(n²): se omite en zonas grandes porque bloquea el hilo principal.
    // Zonas plantadas con grid automático nunca generan solapamientos.
    if (plantasZona.length <= MAX_PLANTAS_OVERLAP_CHECK) {
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
    }

    const plantasMuertas = plantasZona.filter(
      (p) => p.estado === ESTADO_PLANTA.MUERTA,
    );
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
      const texturaSuelo = suelo?.fisico?.textura;
      if (
        texturaSuelo === TEXTURA_SUELO.ARCILLOSA ||
        texturaSuelo === TEXTURA_SUELO.FRANCO_ARCILLOSA
      ) {
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

    // Agrupar por cultivo_id: una alerta por (zona + cultivo), no por planta
    const replantePorCultivo = new Map<
      string,
      {
        cultivo: (typeof catalogoCultivos)[0];
        count: number;
        diasDesde: number;
        cicloTotal: number;
      }
    >();
    for (const planta of plantasZona) {
      if (planta.estado === ESTADO_PLANTA.MUERTA || !planta.fecha_plantacion)
        continue;

      const cultivo = catalogoCultivos.find(
        (c) => c.id === planta.tipo_cultivo_id,
      );
      if (!cultivo) continue;

      const diasDesde = differenceInDays(
        new Date(),
        new Date(planta.fecha_plantacion),
      );
      const cicloTotal = getDiasTotalesCultivo(cultivo.nombre);

      if (
        diasDesde >= cicloTotal * PORCENTAJE_CICLO_REPLANTA &&
        planta.etapa_actual === ETAPA.MADURA
      ) {
        const existing = replantePorCultivo.get(cultivo.id);
        if (existing) {
          existing.count += 1;
        } else {
          replantePorCultivo.set(cultivo.id, {
            cultivo,
            count: 1,
            diasDesde,
            cicloTotal,
          });
        }
      }
    }

    for (const {
      cultivo,
      count,
      diasDesde,
      cicloTotal,
    } of replantePorCultivo.values()) {
      alertas.push({
        terreno_id: terreno.id,
        zona_id: zona.id,
        tipo: "replanta_pendiente",
        severidad: SEVERIDAD_ALERTA.INFO,
        estado: ESTADO_ALERTA.ACTIVA,
        titulo: `🔔 ${cultivo.nombre} lista para replante`,
        descripcion: `${count} planta${count !== 1 ? "s" : ""} listas (ciclo: ${cicloTotal} días, ${diasDesde} días plantadas).`,
        sugerencia:
          "Considera replantar en los próximos 14 días para mantener producción.",
      });
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

  // --- Alertas FASE_20: datos agronómicos enriquecidos ---

  // fertilizacion_etapa: una alerta por (zona + cultivo + etapa), no por planta individual
  for (const zona of zonas) {
    const plantasZona = plantas.filter(
      (p) =>
        p.zona_id === zona.id &&
        p.estado !== ESTADO_PLANTA.MUERTA &&
        !!p.etapa_actual,
    );

    // Deduplicar por cultivo+etapa dentro de la zona
    const combinacionesVistas = new Set<string>();
    for (const planta of plantasZona) {
      const clave = `${planta.tipo_cultivo_id}__${planta.etapa_actual}`;
      if (combinacionesVistas.has(clave)) continue;

      const cultivo = catalogoCultivos.find(
        (c) => c.id === planta.tipo_cultivo_id,
      );
      if (!cultivo) continue;

      const nutricionPorEtapa = (
        cultivo as CatalogoCultivo & { nutricion_por_etapa?: NutricionEtapa[] }
      ).nutricion_por_etapa;
      if (!nutricionPorEtapa) continue;

      const nutricionEtapa = nutricionPorEtapa.find(
        (n) => n.etapa === planta.etapa_actual,
      );
      if (!nutricionEtapa) continue;

      combinacionesVistas.add(clave);
      alertas.push({
        terreno_id: terreno.id,
        zona_id: zona.id,
        // Sin planta_id: la alerta aplica a toda la zona para ese cultivo/etapa
        tipo: "fertilizacion_etapa",
        severidad: SEVERIDAD_ALERTA.INFO,
        estado: ESTADO_ALERTA.ACTIVA,
        titulo: `Fertilización recomendada — ${cultivo.nombre} en etapa ${planta.etapa_actual}`,
        descripcion: `N: ${nutricionEtapa.nitrogeno_kg_ha} kg/ha · P: ${nutricionEtapa.fosforo_kg_ha} kg/ha · K: ${nutricionEtapa.potasio_kg_ha} kg/ha. Aplicar cada ${nutricionEtapa.frecuencia_dias} días.`,
        sugerencia:
          nutricionEtapa.timing ??
          "Fraccionar aplicaciones para evitar quema radicular.",
      });
    }
  }

  // deficiencia_micronutrientes: si el pH del suelo supera 7.5, solo con análisis real
  const phSuelo = suelo?.fisico?.ph;
  const PH_LIMITE_MICRONUTRIENTES = 7.5;
  if (
    phSuelo !== undefined &&
    phSuelo > PH_LIMITE_MICRONUTRIENTES &&
    suelo?.quimico?.analisis_realizado === true
  ) {
    alertas.push({
      ...(proyectoId
        ? { proyecto_id: proyectoId }
        : { terreno_id: terreno.id }),
      tipo: "deficiencia_micronutrientes",
      severidad: SEVERIDAD_ALERTA.WARNING,
      estado: ESTADO_ALERTA.ACTIVA,
      titulo: `⚠️ pH alto (${phSuelo}) — riesgo de deficiencia de micronutrientes`,
      descripcion: `Con pH > ${PH_LIMITE_MICRONUTRIENTES}, el Fe, Zn y Mn se insolubilizan y no están disponibles para las plantas. Síntomas: clorosis interveinal en hojas jóvenes.`,
      sugerencia:
        "Aplicar quelatos Fe-EDTA, Zn-EDTA y/o Mn-EDTA (foliar o drench). Considera incorporar azufre agrícola para bajar pH gradualmente.",
    });
  }

  // alelopatia_riesgo: cuando cultivos incompatibles están plantados juntos
  for (const zona of zonas) {
    const plantasZona = plantas.filter((p) => p.zona_id === zona.id);
    for (let i = 0; i < plantasZona.length; i++) {
      const plantaA = plantasZona[i];
      const cultivoA = catalogoCultivos.find(
        (c) => c.id === plantaA.tipo_cultivo_id,
      );
      if (!cultivoA) continue;

      const alelopatia = (
        cultivoA as CatalogoCultivo & { alelopatia?: AlelopatiaCultivo }
      ).alelopatia;
      if (!alelopatia?.negativa?.length) continue;

      for (let j = i + 1; j < plantasZona.length; j++) {
        const plantaB = plantasZona[j];
        const cultivoB = catalogoCultivos.find(
          (c) => c.id === plantaB.tipo_cultivo_id,
        );
        if (!cultivoB) continue;

        const sinAcentos = (s: string) =>
          s
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
        const nombreBNorm = sinAcentos(cultivoB.nombre);
        const esIncompatible = alelopatia.negativa.some((nombre) =>
          nombreBNorm.includes(sinAcentos(nombre)),
        );

        if (!esIncompatible) continue;

        alertas.push({
          terreno_id: terreno.id,
          zona_id: zona.id,
          planta_id: plantaA.id,
          tipo: "alelopatia_riesgo",
          severidad: SEVERIDAD_ALERTA.WARNING,
          estado: ESTADO_ALERTA.ACTIVA,
          titulo: `⚠️ Alelopatía: ${cultivoA.nombre} incompatible con ${cultivoB.nombre}`,
          descripcion: `${cultivoA.nombre} libera compuestos que inhiben el crecimiento de ${cultivoB.nombre}. Distancia mínima recomendada: ${alelopatia.distancia_minima_m}m.`,
          sugerencia: `Separa estas plantas al menos ${alelopatia.distancia_minima_m}m o ubícalas en zonas distintas.`,
        });
        break;
      }
    }
  }

  // veceria_riesgo: informativa para cultivos susceptibles en etapa madura con producción alta
  for (const zona of zonas) {
    const plantasZona = plantas.filter((p) => p.zona_id === zona.id);
    for (const planta of plantasZona) {
      if (planta.etapa_actual !== ETAPA.MADURA) continue;
      const cultivo = catalogoCultivos.find(
        (c) => c.id === planta.tipo_cultivo_id,
      );
      if (!cultivo) continue;

      const veceria = (
        cultivo as CatalogoCultivo & { veceria?: VeceriaCultivo }
      ).veceria;
      if (!veceria || veceria.susceptibilidad === "baja") continue;

      alertas.push({
        terreno_id: terreno.id,
        zona_id: zona.id,
        planta_id: planta.id,
        tipo: "veceria_riesgo",
        severidad: SEVERIDAD_ALERTA.INFO,
        estado: ESTADO_ALERTA.ACTIVA,
        titulo: `Vecería — ${cultivo.nombre} susceptible a alternancia productiva`,
        descripcion: `${cultivo.nombre} tiene susceptibilidad ${veceria.susceptibilidad} a vecería. Los árboles alternan años de alta y baja producción.`,
        sugerencia: veceria.manejo,
      });
    }
  }

  // ── INTEGRIDAD DE DATOS ────────────────────────────────────────────
  // Alertas que detectan datos faltantes que hacen que los cálculos
  // produzcan resultados silenciosamente incorrectos.

  // Costo de agua efectivo = 0 → ROI sobreestima rentabilidad
  const costoAguaM3 =
    estanques.length > 0 ? obtenerCostoAguaPromedio(estanques, terreno) : 0;
  const tieneZonasConPlantas = zonas.some(
    (z) =>
      z.tipo === TIPO_ZONA.CULTIVO &&
      plantas.some(
        (p) => p.zona_id === z.id && p.estado !== ESTADO_PLANTA.MUERTA,
      ),
  );
  if (tieneZonasConPlantas && costoAguaM3 === 0 && estanques.length > 0) {
    alertas.push({
      terreno_id: terreno.id,
      tipo: "costo_agua_cero",
      severidad: SEVERIDAD_ALERTA.CRITICAL,
      estado: ESTADO_ALERTA.ACTIVA,
      titulo: "Costo de agua = $0 — la economía muestra resultados incorrectos",
      descripcion:
        "Ningún estanque tiene un proveedor con precio por m³ configurado. El sistema calcula el costo del agua como $0, lo que hace que el ROI y los costos de operación sean artificialmente positivos.",
      sugerencia:
        "Ve a Agua > Configurar recarga de cada estanque y asigna un proveedor con precio por m³. Si el agua es gratuita, ingresa $1/m³ como referencia.",
    });
  }

  // Proveedor asignado a estanque pero sin precio → agua parece gratis
  const proveedoresTerreno = terreno.agua_avanzada?.proveedores ?? [];
  for (const est of estanques) {
    const provId = est.estanque_config?.proveedor_id;
    if (!provId) continue;
    const prov = proveedoresTerreno.find((p) => p.id === provId);
    if (prov && !prov.precio_m3_clp) {
      alertas.push({
        terreno_id: terreno.id,
        zona_id: est.id,
        tipo: "proveedor_sin_precio",
        severidad: SEVERIDAD_ALERTA.WARNING,
        estado: ESTADO_ALERTA.ACTIVA,
        titulo: `Proveedor "${prov.nombre}" sin precio por m³`,
        descripcion: `El estanque "${est.nombre}" tiene asignado el proveedor "${prov.nombre}" pero no tiene precio por m³. El costo del agua se calcula como $0.`,
        sugerencia:
          "Ve a Agua > Proveedores y edita el precio por m³ que te cobra. Pregúntale a tu proveedor cuánto cuesta el metro cúbico.",
      });
    }
  }

  // Cultivo sin datos de producción → ROI muestra $0 de ingreso
  const cultivosEnUso = new Set(
    plantas
      .filter((p) => p.estado !== ESTADO_PLANTA.MUERTA)
      .map((p) => p.tipo_cultivo_id),
  );
  for (const cultivoId of cultivosEnUso) {
    const cultivo = catalogoCultivos.find((c) => c.id === cultivoId);
    if (!cultivo) continue;

    const prod = cultivo.produccion;
    const sinProduccion =
      !prod ||
      ((prod.produccion_kg_ha_año2 ?? 0) === 0 &&
        (prod.produccion_kg_ha_año3 ?? 0) === 0 &&
        (prod.produccion_kg_ha_año4 ?? 0) === 0);
    if (sinProduccion) {
      alertas.push({
        terreno_id: terreno.id,
        tipo: "cultivo_sin_produccion",
        severidad: SEVERIDAD_ALERTA.CRITICAL,
        estado: ESTADO_ALERTA.ACTIVA,
        titulo: `"${cultivo.nombre}" sin datos de producción — economía no puede calcular ingresos`,
        descripcion: `El cultivo ${cultivo.nombre} no tiene kg/ha definidos para los años 2-4. El sistema muestra $0 de ingreso y ROI de -100%.`,
        sugerencia: `Edita "${cultivo.nombre}" en el catálogo y agrega producción estimada (kg/ha/año) para años 2, 3 y 4.`,
      });
    }

    // Cultivo sin precio de venta → ingreso = 0
    const precioKg = calcularPrecioKgPromedio(cultivo);
    if (precioKg === 0) {
      alertas.push({
        terreno_id: terreno.id,
        tipo: "cultivo_sin_precio",
        severidad: SEVERIDAD_ALERTA.CRITICAL,
        estado: ESTADO_ALERTA.ACTIVA,
        titulo: `"${cultivo.nombre}" sin precio de venta — economía muestra $0 de ingreso`,
        descripcion: `El cultivo ${cultivo.nombre} no tiene precio mínimo ni máximo (CLP/kg). Sin precio, toda la producción tiene valor $0.`,
        sugerencia: `Edita "${cultivo.nombre}" en el catálogo y agrega precio_kg_min y precio_kg_max en CLP.`,
      });
    }

    // Cultivo sin Kc explícito → consumo de agua usa coeficiente genérico (puede errar 30-50%)
    if (!tieneKcExplicito(cultivo)) {
      alertas.push({
        terreno_id: terreno.id,
        tipo: "cultivo_sin_kc",
        severidad: SEVERIDAD_ALERTA.WARNING,
        estado: ESTADO_ALERTA.ACTIVA,
        titulo: `"${cultivo.nombre}" usa coeficiente de agua genérico (Kc) — consumo puede ser impreciso`,
        descripcion: `El cultivo ${cultivo.nombre} no tiene coeficiente Kc calibrado. Usa un valor genérico (adulta = 1.0) que puede sobreestimar o subestimar el consumo de agua entre 30-50%.`,
        sugerencia: `Contacta un técnico agrícola para obtener el Kc correcto de ${cultivo.nombre}, o busca en la ficha técnica FAO 56. Puedes editarlo en el catálogo de cultivos.`,
      });
    }

    // Precio anómalo → posible bug de conversión ODEPA (caja/saco → kg)
    if (precioKg > PRECIO_KG_TECHO_CLP) {
      alertas.push({
        terreno_id: terreno.id,
        tipo: "precio_anomalo",
        severidad: SEVERIDAD_ALERTA.CRITICAL,
        estado: ESTADO_ALERTA.ACTIVA,
        titulo: `"${cultivo.nombre}" tiene precio anómalo ($${Math.round(precioKg).toLocaleString("es-CL")}/kg)`,
        descripcion: `El precio promedio de ${cultivo.nombre} ($${Math.round(precioKg).toLocaleString("es-CL")}/kg) supera el máximo razonable ($${PRECIO_KG_TECHO_CLP.toLocaleString("es-CL")}/kg). Puede ser un error de conversión de datos ODEPA.`,
        sugerencia: `Verifica el precio en el catálogo. Si es incorrecto, edita precio_kg_min y precio_kg_max con valores reales de mercado.`,
      });
    }
  }

  return alertas;
}

export function generarAlertasIncompatibilidadQuimica(
  insumosSeleccionados: string[],
  incompatibilidades: IncompatibilidadQuimica[],
): IncompatibilidadQuimica[] {
  if (insumosSeleccionados.length < 2) return [];

  return incompatibilidades.filter(
    (inc) =>
      insumosSeleccionados.includes(inc.insumo_a) &&
      insumosSeleccionados.includes(inc.insumo_b),
  );
}

export async function sincronizarAlertas(
  terreno: Terreno,
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  suelo?: SueloTerreno | null,
  climaBaseId?: string | null,
  isCurrent?: () => boolean,
  proveedoresAgua?: ProveedorAgua[],
  proyectoId?: string,
  sesionesRecientes?: SesionRiego[],
  opcionesConsumoAgua?: OpcionesConsumoAgua,
): Promise<Alerta[]> {
  const timestamp = getCurrentTimestamp();

  const alertasExistentes = await alertasDAL.getActiveByTerrenoId(
    terreno.id,
    proyectoId,
  );

  // Si llegó una nueva sincronización mientras esperábamos, abortar sin escribir en BD
  if (isCurrent && !isCurrent()) return alertasExistentes;

  const nuevasAlertas = generarAlertas(
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
    suelo,
    climaBaseId,
    proveedoresAgua,
    proyectoId,
    sesionesRecientes,
    opcionesConsumoAgua,
  );

  const mismaAlerta = (
    a: Omit<Alerta, "id" | "created_at" | "updated_at"> | Alerta,
    b: Omit<Alerta, "id" | "created_at" | "updated_at"> | Alerta,
  ) => {
    if (a.tipo !== b.tipo) return false;
    // Alerta de proyecto: matchea por tipo + proyecto_id únicamente
    // También cubre caso mixto (uno con proyecto_id, otro con terreno_id del mismo proyecto)
    if (a.proyecto_id || b.proyecto_id) {
      return (
        (a.proyecto_id ?? a.terreno_id) === (b.proyecto_id ?? b.terreno_id)
      );
    }
    // replanta_pendiente: ahora se agrupa por (zona + cultivo), no por planta.
    // Ignorar planta_id para que los alerts viejos per-planta sean reemplazados
    // correctamente por el nuevo alert agrupado.
    if (a.tipo === "replanta_pendiente") {
      return a.terreno_id === b.terreno_id && a.zona_id === b.zona_id;
    }
    // Alerta de terreno: matchea por tipo + terreno_id + zona_id + planta_id
    return (
      a.terreno_id === b.terreno_id &&
      a.zona_id === b.zona_id &&
      a.planta_id === b.planta_id
    );
  };

  // Deduplicar alertas existentes antes de procesar: si un sync anterior corrió en paralelo
  // puede haber insertado el mismo alert dos veces con IDs distintos. Resolver los extras.
  const seenKeys = new Set<string>();
  const alertasDedup: Alerta[] = [];
  const resolver: Array<{ id: string; cambios: Partial<Alerta> }> = [];
  for (const existente of alertasExistentes) {
    const key = `${existente.tipo}|${existente.terreno_id ?? ""}|${existente.zona_id ?? ""}|${existente.planta_id ?? ""}|${existente.proyecto_id ?? ""}`;
    if (seenKeys.has(key)) {
      // Duplicado en DB — resolver este
      resolver.push({
        id: existente.id,
        cambios: {
          estado: ESTADO_ALERTA.RESUELTA,
          fecha_resolucion: timestamp,
          como_se_resolvio: "Automático",
          updated_at: timestamp,
        },
      });
    } else {
      seenKeys.add(key);
      alertasDedup.push(existente);
    }
  }

  for (const existente of alertasDedup) {
    const sigueSiendo = nuevasAlertas.some((n) => mismaAlerta(n, existente));
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
    const yaExiste = alertasDedup.some((e) => mismaAlerta(nueva, e));

    if (!yaExiste) {
      nuevas.push({
        ...nueva,
        id: generateUUID(),
        created_at: timestamp,
        updated_at: timestamp,
      });
    }
  }

  if (isCurrent && !isCurrent()) return alertasExistentes;

  if (resolver.length > 0 || nuevas.length > 0) {
    await transaccionesDAL.sincronizarAlertas(resolver, nuevas);
  }

  return alertasDAL.getActiveByTerrenoId(terreno.id, proyectoId);
}

# 02: Etapas Crecimiento con Kc Automático

**Status**: ✅ COMPLETADO
**Prioridad**: 🔴 CRÍTICA
**Estimación**: 4-5 días
**Dependencias**: 01_dashboard (base consumo)

---

## 🎯 Objetivo

Implementar **etapas automáticas de crecimiento** que ajustan consumo agua según Kc (coeficiente cultivo).

---

## 📋 Concepto Técnico

### Kc (Coeficiente de Cultivo)

**Definición**: Multiplica la evapotranspiración de referencia (ETo) para obtener consumo real del cultivo (ETc).

```
ETc = ETo × Kc

Consumo/planta/día = Base × Kc × Factor_suelo × Factor_clima
```

### Etapas y Kc Típico

| Etapa        | Descripción                     | Kc      | Ejemplo         |
| ------------ | ------------------------------- | ------- | --------------- |
| **Plántula** | Recién plantada, raíces débiles | 0.4-0.5 | Tomate 2L/día   |
| **Joven**    | Crecimiento vegetativo          | 0.7-0.8 | Tomate 4L/día   |
| **Adulta**   | Floración/fructificación (PICO) | 1.0-1.2 | Tomate 6L/día   |
| **Madura**   | Fin ciclo, preparando cosecha   | 0.8-0.9 | Tomate 4.5L/día |

---

## 🏗️ Implementación

### Tarea 2.1: Enum Etapas

**Archivo**: `src/types/index.ts`

```typescript
export enum EtapaCrecimiento {
  PLANTULA = "plántula",
  JOVEN = "joven",
  ADULTA = "adulta",
  MADURA = "madura",
}

export interface Planta {
  // ... campos existentes
  etapa_actual: EtapaCrecimiento;
  fecha_plantacion: Timestamp;
  fecha_cambio_etapa?: Timestamp;
}
```

---

### Tarea 2.2: Tabla Kc por Cultivo/Etapa

**Archivo**: `src/lib/data/kc-cultivos.ts` (CREAR)

```typescript
import type { EtapaCrecimiento } from "@/types";

export const KC_POR_CULTIVO: Record<
  string, // tipo cultivo
  Record<EtapaCrecimiento, number>
> = {
  tomate: {
    plántula: 0.45,
    joven: 0.75,
    adulta: 1.15,
    madura: 0.85,
  },
  mango: {
    plántula: 0.5,
    joven: 0.8,
    adulta: 1.1,
    madura: 0.9,
  },
  zanahoria: {
    plántula: 0.4,
    joven: 0.7,
    adulta: 1.0,
    madura: 0.8,
  },
  // ... resto cultivos Arica
};

// Función helper
export function getKc(tipoCultivo: string, etapa: EtapaCrecimiento): number {
  const kcs = KC_POR_CULTIVO[tipoCultivo.toLowerCase()];
  if (!kcs) return 1.0; // default si no encontrado
  return kcs[etapa] || 1.0;
}
```

---

### Tarea 2.3: Duración Etapas (Auto-Progresión)

**Archivo**: `src/lib/data/duracion-etapas.ts` (CREAR)

```typescript
// Duración en días de cada etapa
export const DURACION_ETAPAS: Record<
  string, // tipo cultivo
  Record<EtapaCrecimiento, number>
> = {
  tomate: {
    plántula: 30, // 0-30 días
    joven: 45, // 30-75 días
    adulta: 90, // 75-165 días
    madura: 75, // 165-240 días (cosecha)
  },
  mango: {
    plántula: 180,
    joven: 365,
    adulta: 730, // 2 años pico producción
    madura: 365,
  },
  // ... resto
};

// Función calcular etapa actual según fecha plantación
export function calcularEtapaActual(
  tipoCultivo: string,
  fechaPlantacion: Date,
): EtapaCrecimiento {
  const diasDesde = Math.floor(
    (Date.now() - fechaPlantacion.getTime()) / (1000 * 60 * 60 * 24),
  );

  const duraciones = DURACION_ETAPAS[tipoCultivo.toLowerCase()];
  if (!duraciones) return "adulta"; // default

  let acumulado = 0;
  for (const [etapa, dias] of Object.entries(duraciones)) {
    acumulado += dias;
    if (diasDesde < acumulado) {
      return etapa as EtapaCrecimiento;
    }
  }

  return "madura"; // fin ciclo
}
```

---

### Tarea 2.4: Hook Actualizar Etapas Automático

**Archivo**: `src/hooks/use-actualizar-etapas.ts` (CREAR)

```typescript
"use client";

import { useEffect } from "react";
import { plantasDAL } from "@/lib/dal";
import { calcularEtapaActual } from "@/lib/data/duracion-etapas";
import type { Planta } from "@/types";

export function useActualizarEtapas(plantas: Planta[], onRefetch: () => void) {
  useEffect(() => {
    async function actualizar() {
      let cambios = 0;

      for (const planta of plantas) {
        if (planta.estado === "muerta" || !planta.fecha_plantacion) continue;

        const etapaCalculada = calcularEtapaActual(
          planta.tipo_cultivo_id,
          new Date(planta.fecha_plantacion),
        );

        // Si etapa cambió, actualizar
        if (etapaCalculada !== planta.etapa_actual) {
          await plantasDAL.update(planta.id, {
            etapa_actual: etapaCalculada,
            fecha_cambio_etapa: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          cambios++;
        }
      }

      if (cambios > 0) {
        console.log(`✅ Actualizadas ${cambios} plantas a nueva etapa`);
        onRefetch();
      }
    }

    // Ejecutar al cargar y cada 24h
    actualizar();
    const interval = setInterval(actualizar, 1000 * 60 * 60 * 24);

    return () => clearInterval(interval);
  }, [plantas, onRefetch]);
}
```

---

### Tarea 2.5: Actualizar Cálculo Consumo

**Archivo**: `src/lib/utils/agua-calculo.ts` (MODIFICAR)

```typescript
import { getKc } from "@/lib/data/kc-cultivos";

export function calcularConsumoPlanta(
  planta: Planta,
  cultivo: CatalogoCultivo,
  factorSuelo: number = 1.0,
  factorClima: number = 1.0,
): number {
  if (planta.estado === "muerta") return 0;

  // Base agua (L/día) del catálogo
  const aguaBase =
    (cultivo.agua_m3_ha_año_min + cultivo.agua_m3_ha_año_max) / 2 / 365;

  // Kc según etapa
  const kc = getKc(cultivo.tipo, planta.etapa_actual);

  // Consumo final
  const consumo = aguaBase * kc * factorSuelo * factorClima;

  return consumo;
}
```

---

### Tarea 2.6: UI Selector Etapa Manual

**Archivo**: `src/components/plantas/planta-info.tsx` (MODIFICAR)

Agregar selector para usuario pueda forzar etapa manualmente:

```typescript
<div className="mb-3">
  <label className="block text-sm font-medium mb-1">
    Etapa Actual
  </label>
  <select
    value={planta.etapa_actual}
    onChange={async (e) => {
      await plantasDAL.update(planta.id, {
        etapa_actual: e.target.value as EtapaCrecimiento,
        fecha_cambio_etapa: new Date().toISOString(),
      })
      onRefetch()
    }}
    className="w-full px-3 py-2 border rounded"
  >
    <option value="plántula">🌱 Plántula (Kc 0.4-0.5)</option>
    <option value="joven">🌿 Joven (Kc 0.7-0.8)</option>
    <option value="adulta">🌳 Adulta (Kc 1.0-1.2)</option>
    <option value="madura">🍎 Madura (Kc 0.8-0.9)</option>
  </select>
  <p className="text-xs text-gray-500 mt-1">
    Auto-actualiza según fecha plantación
  </p>
</div>
```

---

## ✅ Criterios de Aceptación

- [ ] Enum `EtapaCrecimiento` creado
- [ ] Tabla Kc por cultivo/etapa implementada
- [ ] Duración etapas por cultivo definida
- [ ] Hook auto-actualiza etapas cada 24h
- [ ] Cálculo consumo usa Kc correcto
- [ ] Usuario puede forzar etapa manualmente
- [ ] Dashboard muestra etapa en desglose plantas
- [ ] Al plantar nueva planta, etapa = 'plántula' por default
- [ ] Fecha plantación se guarda automáticamente

---

## 🎯 Ejemplo Real

**Tomate plantado 15 Dic 2025:**

```
Fecha hoy: 5 Feb 2026
Días desde plantación: 52 días

Etapa automática: JOVEN (30-75 días)
Kc: 0.75
Consumo base: 4 L/día
Consumo real: 4 × 0.75 = 3 L/día
```

**Después de 80 días** (5 Mar 2026):

```
Etapa automática: ADULTA (75-165 días)
Kc: 1.15
Consumo base: 4 L/día
Consumo real: 4 × 1.15 = 4.6 L/día
```

Dashboard actualiza consumo automáticamente → recalcula "días restantes".

---

## 📝 Notas

1. **Automático primero**: Hook actualiza etapa cada 24h sin intervención usuario
2. **Manual override**: Usuario puede forzar si sabe mejor (ej: crecimiento acelerado)
3. **Persistencia**: Guardar `fecha_cambio_etapa` para auditoría
4. **Performance**: Hook solo ejecuta si detecta cambio (no update innecesario)
5. **Cultivos sin Kc**: Default 1.0 si no encontrado en tabla

---

## 🔗 Siguiente Tarea

→ **03_sistema_riego_goteros.md** (goteros/planta + continuo vs programado)

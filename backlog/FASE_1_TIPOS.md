# FASE 1: Modelo de Datos y Dexie

**Status**: ✅ COMPLETADA
**Prioridad**: 🔴 Alta
**Dependencias**: FASE_0
**Estimación**: 3-4 horas

---

## Objetivo

Implementar todos los tipos TypeScript y configurar IndexedDB con Dexie.

---

## Tareas

### Tarea 1: Crear Archivo de Tipos

**Archivo**: `src/types/index.ts` (crear)
**Referencia**: `backlog/MODELO_DATOS.md`

Copiar todos los tipos del archivo de referencia:

- Tipos base (UUID, Timestamp, unidades)
- Usuario, Proyecto, Terreno, Zona, Planta
- CatalogoCultivo, EntradaAgua, Cosecha
- Alerta, HistorialEntrada, SyncItem
- DashboardTerreno, constantes (COLORES_ZONA, FACTORES_TEMPORADA)

---

### Tarea 2: Configurar Dexie

**Archivo**: `src/lib/db/index.ts` (crear)

```typescript
import Dexie, { type Table } from "dexie";
import type {
  Usuario,
  Proyecto,
  Terreno,
  Zona,
  Planta,
  CatalogoCultivo,
  EntradaAgua,
  Cosecha,
  Alerta,
  HistorialEntrada,
  SyncItem,
} from "@/types";

export class AgriPlanDB extends Dexie {
  usuarios!: Table<Usuario>;
  proyectos!: Table<Proyecto>;
  terrenos!: Table<Terreno>;
  zonas!: Table<Zona>;
  plantas!: Table<Planta>;
  catalogo_cultivos!: Table<CatalogoCultivo>;
  entradas_agua!: Table<EntradaAgua>;
  cosechas!: Table<Cosecha>;
  alertas!: Table<Alerta>;
  historial!: Table<HistorialEntrada>;
  sync_queue!: Table<SyncItem>;

  constructor() {
    super("AgriPlanDB");

    this.version(1).stores({
      usuarios: "id, email",
      proyectos: "id, usuario_id, nombre",
      terrenos: "id, proyecto_id, nombre",
      zonas: "id, terreno_id, tipo, nombre",
      plantas: "id, zona_id, tipo_cultivo_id, estado",
      catalogo_cultivos: "id, proyecto_id, nombre, tier",
      entradas_agua: "id, terreno_id, fecha",
      cosechas: "id, zona_id, tipo_cultivo_id, fecha",
      alertas: "id, terreno_id, tipo, estado, severidad",
      historial: "id, usuario_id, terreno_id, tipo_accion, created_at",
      sync_queue: "id, entidad, estado, created_at",
    });
  }
}

export const db = new AgriPlanDB();
```

---

### Tarea 3: Crear Utilidades Base

**Archivo**: `src/lib/utils/index.ts` (crear)

```typescript
import type { UUID, Timestamp, Temporada } from "@/types";

// UUID
export function generateUUID(): UUID {
  return crypto.randomUUID();
}

// Timestamps
export function getCurrentTimestamp(): Timestamp {
  return new Date().toISOString();
}

export function parseTimestamp(timestamp: Timestamp): Date {
  return new Date(timestamp);
}

export function formatTimestamp(
  timestamp: Timestamp,
  locale = "es-CL",
): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parseTimestamp(timestamp));
}

export function formatDate(timestamp: Timestamp, locale = "es-CL"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parseTimestamp(timestamp));
}

// Temporada
export function getTemporadaActual(): Temporada {
  const mes = new Date().getMonth() + 1; // 1-12

  if (mes >= 12 || mes <= 2) return "verano"; // Dic-Feb (hemisferio sur)
  if (mes >= 3 && mes <= 5) return "otoño"; // Mar-May
  if (mes >= 6 && mes <= 8) return "invierno"; // Jun-Ago
  return "primavera"; // Sep-Nov
}

// Formateo de números
export function formatArea(m2: number): string {
  return `${m2.toLocaleString("es-CL")} m²`;
}

export function formatAgua(m3: number): string {
  return `${m3.toLocaleString("es-CL", { maximumFractionDigits: 1 })} m³`;
}

export function formatPesos(clp: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(clp);
}
```

---

### Tarea 4: Crear Hook useTerreno (ejemplo)

**Archivo**: `src/hooks/useTerreno.ts` (crear)

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/db";
import type { Terreno, Zona, Planta, UUID } from "@/types";

interface UseTerreno {
  terreno: Terreno | null;
  zonas: Zona[];
  plantas: Planta[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTerreno(terrenoId: UUID): UseTerreno {
  const [terreno, setTerreno] = useState<Terreno | null>(null);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar terreno
      const terrenoData = await db.terrenos.get(terrenoId);
      if (!terrenoData) {
        throw new Error("Terreno no encontrado");
      }
      setTerreno(terrenoData);

      // Cargar zonas del terreno
      const zonasData = await db.zonas
        .where("terreno_id")
        .equals(terrenoId)
        .toArray();
      setZonas(zonasData);

      // Cargar plantas de todas las zonas
      const zonaIds = zonasData.map((z) => z.id);
      if (zonaIds.length > 0) {
        const plantasData = await db.plantas
          .where("zona_id")
          .anyOf(zonaIds)
          .toArray();
        setPlantas(plantasData);
      } else {
        setPlantas([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"));
    } finally {
      setLoading(false);
    }
  }, [terrenoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    terreno,
    zonas,
    plantas,
    loading,
    error,
    refetch: fetchData,
  };
}
```

---

## Criterios de Aceptación

- [ ] `src/types/index.ts` contiene todos los tipos del modelo
- [ ] Dexie configurado en `src/lib/db/index.ts` con 11 tablas
- [ ] Utilidades en `src/lib/utils/index.ts` funcionando
- [ ] Hook `useTerreno` carga datos correctamente
- [ ] `pnpm exec tsc --noEmit` sin errores TypeScript
- [ ] IndexedDB se crea al abrir la app (verificar en DevTools)

---

## Siguiente Fase

**FASE_2_MAPA_SVG** - Crear componente de mapa interactivo SVG

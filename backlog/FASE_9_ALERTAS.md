# FASE 9: Alertas y Dashboard

**Status**: ✅ COMPLETADA
**Prioridad**: 🟡 Media
**Dependencias**: FASE_8
**Estimación**: 3-4 horas

---

## Objetivo

Sistema de alertas automáticas y dashboard con métricas del terreno.

---

## Tipos de Alertas

| Tipo                   | Severidad | Condición                         |
| ---------------------- | --------- | --------------------------------- |
| `deficit_agua`         | critical  | Agua disponible < consumo semanal |
| `espaciado_incorrecto` | warning   | Plantas muy cerca (<0.5m)         |
| `zona_sin_cultivo`     | info      | Zona tipo cultivo sin plantas     |
| `planta_muerta`        | warning   | Hay plantas muertas               |
| `cosecha_pendiente`    | info      | Plantas en estado "produciendo"   |

---

## Tareas

### Tarea 1: Crear Generador de Alertas

**Archivo**: `src/lib/utils/alertas.ts` (crear)

```typescript
import type {
  Alerta,
  Terreno,
  Zona,
  Planta,
  CatalogoCultivo,
  TipoAlerta,
  SeveridadAlerta,
} from "@/types";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import { calcularConsumoTerreno } from "@/lib/utils/agua";
import { ESPACIADO_MINIMO } from "@/lib/validations/planta";

// Distancia entre dos puntos
function distancia(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Generar todas las alertas para un terreno
export function generarAlertas(
  terreno: Terreno,
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
): Omit<Alerta, "id" | "created_at" | "updated_at">[] {
  const alertas: Omit<Alerta, "id" | "created_at" | "updated_at">[] = [];

  // 1. Alerta de déficit de agua
  const consumoSemanal = calcularConsumoTerreno(
    zonas,
    plantas,
    catalogoCultivos,
  );
  if (terreno.agua_actual_m3 < consumoSemanal) {
    alertas.push({
      terreno_id: terreno.id,
      tipo: "deficit_agua",
      severidad: "critical",
      estado: "activa",
      titulo: "Déficit de agua",
      descripcion: `El agua disponible (${terreno.agua_actual_m3.toFixed(1)} m³) es menor al consumo semanal (${consumoSemanal.toFixed(1)} m³).`,
      sugerencia: "Registra una entrada de agua o reduce el número de plantas.",
    });
  }

  // 2. Alertas por zona
  for (const zona of zonas) {
    const plantasZona = plantas.filter((p) => p.zona_id === zona.id);

    // Zona de cultivo sin plantas
    if (zona.tipo === "cultivo" && plantasZona.length === 0) {
      alertas.push({
        terreno_id: terreno.id,
        zona_id: zona.id,
        tipo: "zona_sin_cultivo",
        severidad: "info",
        estado: "activa",
        titulo: `Zona "${zona.nombre}" sin cultivos`,
        descripcion: "Esta zona de cultivo no tiene plantas.",
        sugerencia: "Agrega plantas o cambia el tipo de zona.",
      });
    }

    // Verificar espaciado entre plantas
    for (let i = 0; i < plantasZona.length; i++) {
      for (let j = i + 1; j < plantasZona.length; j++) {
        const dist = distancia(plantasZona[i], plantasZona[j]);
        if (dist < ESPACIADO_MINIMO) {
          alertas.push({
            terreno_id: terreno.id,
            zona_id: zona.id,
            planta_id: plantasZona[i].id,
            tipo: "espaciado_incorrecto",
            severidad: "warning",
            estado: "activa",
            titulo: "Plantas muy cercanas",
            descripcion: `Dos plantas están a ${dist.toFixed(2)}m de distancia (mínimo: ${ESPACIADO_MINIMO}m).`,
            sugerencia: "Mueve una de las plantas o elimínala.",
          });
          break; // Solo una alerta por zona
        }
      }
    }

    // Plantas muertas
    const plantasMuertas = plantasZona.filter((p) => p.estado === "muerta");
    if (plantasMuertas.length > 0) {
      alertas.push({
        terreno_id: terreno.id,
        zona_id: zona.id,
        tipo: "planta_muerta",
        severidad: "warning",
        estado: "activa",
        titulo: `${plantasMuertas.length} planta(s) muerta(s) en "${zona.nombre}"`,
        descripcion: "Hay plantas muertas que deberían ser removidas.",
        sugerencia: "Elimina las plantas muertas y considera reemplazarlas.",
      });
    }

    // Cosecha pendiente
    const plantasProduciendo = plantasZona.filter(
      (p) => p.estado === "produciendo",
    );
    if (plantasProduciendo.length > 0) {
      alertas.push({
        terreno_id: terreno.id,
        zona_id: zona.id,
        tipo: "cosecha_pendiente",
        severidad: "info",
        estado: "activa",
        titulo: `${plantasProduciendo.length} planta(s) listas para cosechar`,
        descripcion: `Hay plantas produciendo en "${zona.nombre}".`,
        sugerencia: "Registra la cosecha cuando recojas los frutos.",
      });
    }
  }

  return alertas;
}

// Sincronizar alertas con la base de datos
export async function sincronizarAlertas(
  db: any,
  terreno: Terreno,
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
): Promise<Alerta[]> {
  const timestamp = getCurrentTimestamp();

  // Marcar alertas existentes como resueltas (si ya no aplican)
  const alertasExistentes = await db.alertas
    .where("terreno_id")
    .equals(terreno.id)
    .and((a: Alerta) => a.estado === "activa")
    .toArray();

  // Generar nuevas alertas
  const nuevasAlertas = generarAlertas(
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
  );

  // Comparar y actualizar
  for (const existente of alertasExistentes) {
    const sigueSiendo = nuevasAlertas.some(
      (n) =>
        n.tipo === existente.tipo &&
        n.zona_id === existente.zona_id &&
        n.planta_id === existente.planta_id,
    );

    if (!sigueSiendo) {
      await db.alertas.update(existente.id, {
        estado: "resuelta",
        fecha_resolucion: timestamp,
        como_se_resolvio: "Automático",
        updated_at: timestamp,
      });
    }
  }

  // Crear alertas nuevas (que no existían)
  const alertasCreadas: Alerta[] = [];
  for (const nueva of nuevasAlertas) {
    const yaExiste = alertasExistentes.some(
      (e) =>
        e.tipo === nueva.tipo &&
        e.zona_id === nueva.zona_id &&
        e.planta_id === nueva.planta_id,
    );

    if (!yaExiste) {
      const alerta: Alerta = {
        ...nueva,
        id: generateUUID(),
        created_at: timestamp,
        updated_at: timestamp,
      };
      await db.alertas.add(alerta);
      alertasCreadas.push(alerta);
    }
  }

  // Retornar todas las alertas activas
  return db.alertas
    .where("terreno_id")
    .equals(terreno.id)
    .and((a: Alerta) => a.estado === "activa")
    .toArray();
}
```

---

### Tarea 2: Crear Hook useAlertas

**Archivo**: `src/hooks/useAlertas.ts` (crear)

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/db";
import { sincronizarAlertas } from "@/lib/utils/alertas";
import { getCurrentTimestamp } from "@/lib/utils";
import type {
  Alerta,
  Terreno,
  Zona,
  Planta,
  CatalogoCultivo,
  UUID,
} from "@/types";

interface UseAlertas {
  alertas: Alerta[];
  alertasCriticas: number;
  loading: boolean;

  refrescarAlertas: () => Promise<void>;
  resolverAlerta: (id: UUID, como: string) => Promise<void>;
  ignorarAlerta: (id: UUID) => Promise<void>;
}

export function useAlertas(
  terreno: Terreno | null,
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
): UseAlertas {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);

  const refrescarAlertas = useCallback(async () => {
    if (!terreno) return;

    setLoading(true);
    const activas = await sincronizarAlertas(
      db,
      terreno,
      zonas,
      plantas,
      catalogoCultivos,
    );
    setAlertas(activas);
    setLoading(false);
  }, [terreno, zonas, plantas, catalogoCultivos]);

  useEffect(() => {
    refrescarAlertas();
  }, [refrescarAlertas]);

  const resolverAlerta = useCallback(async (id: UUID, como: string) => {
    await db.alertas.update(id, {
      estado: "resuelta",
      fecha_resolucion: getCurrentTimestamp(),
      como_se_resolvio: como,
      updated_at: getCurrentTimestamp(),
    });
    setAlertas((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const ignorarAlerta = useCallback(async (id: UUID) => {
    await db.alertas.update(id, {
      estado: "ignorada",
      updated_at: getCurrentTimestamp(),
    });
    setAlertas((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const alertasCriticas = alertas.filter(
    (a) => a.severidad === "critical",
  ).length;

  return {
    alertas,
    alertasCriticas,
    loading,
    refrescarAlertas,
    resolverAlerta,
    ignorarAlerta,
  };
}
```

---

### Tarea 3: Crear Lista de Alertas

**Archivo**: `src/components/alertas/AlertasList.tsx` (crear)

```typescript
'use client'

import type { Alerta, UUID } from '@/types'

interface AlertasListProps {
  alertas: Alerta[]
  onResolver: (id: UUID, como: string) => void
  onIgnorar: (id: UUID) => void
}

export function AlertasList({ alertas, onResolver, onIgnorar }: AlertasListProps) {
  if (alertas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        ✅ No hay alertas activas
      </div>
    )
  }

  // Ordenar por severidad
  const ordenadas = [...alertas].sort((a, b) => {
    const orden = { critical: 0, warning: 1, info: 2 }
    return orden[a.severidad] - orden[b.severidad]
  })

  return (
    <div className="space-y-3">
      {ordenadas.map((alerta) => (
        <AlertaCard
          key={alerta.id}
          alerta={alerta}
          onResolver={onResolver}
          onIgnorar={onIgnorar}
        />
      ))}
    </div>
  )
}

function AlertaCard({
  alerta,
  onResolver,
  onIgnorar,
}: {
  alerta: Alerta
  onResolver: (id: UUID, como: string) => void
  onIgnorar: (id: UUID) => void
}) {
  const severidadConfig = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '🚨',
      color: 'text-red-800',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: '⚠️',
      color: 'text-yellow-800',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'ℹ️',
      color: 'text-blue-800',
    },
  }

  const config = severidadConfig[alerta.severidad]

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{config.icon}</span>
        <div className="flex-1">
          <h4 className={`font-medium ${config.color}`}>{alerta.titulo}</h4>
          <p className="text-sm text-gray-600 mt-1">{alerta.descripcion}</p>
          {alerta.sugerencia && (
            <p className="text-sm text-gray-500 mt-2 italic">
              💡 {alerta.sugerencia}
            </p>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onResolver(alerta.id, 'Resuelto manualmente')}
              className="text-sm px-3 py-1 bg-white rounded border hover:bg-gray-50"
            >
              Marcar resuelta
            </button>
            <button
              onClick={() => onIgnorar(alerta.id)}
              className="text-sm px-3 py-1 text-gray-500 hover:text-gray-700"
            >
              Ignorar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### Tarea 4: Crear Dashboard de Métricas

**Archivo**: `src/components/dashboard/TerrenoDashboard.tsx` (crear)

```typescript
'use client'

import type { DashboardTerreno } from '@/types'
import { FACTORES_TEMPORADA } from '@/types'

interface TerrenoDashboardProps {
  dashboard: DashboardTerreno
}

export function TerrenoDashboard({ dashboard }: TerrenoDashboardProps) {
  return (
    <div className="space-y-4">
      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricaCard
          label="Área usada"
          value={`${dashboard.porcentaje_uso.toFixed(0)}%`}
          detail={`${dashboard.area_usada_m2} / ${dashboard.area_total_m2} m²`}
          color="blue"
        />
        <MetricaCard
          label="Agua"
          value={`${dashboard.agua_disponible_m3.toFixed(1)} m³`}
          detail={`Necesitas ${dashboard.agua_necesaria_m3.toFixed(1)} m³/sem`}
          color={dashboard.estado_agua === 'ok' ? 'green' : dashboard.estado_agua === 'ajustado' ? 'yellow' : 'red'}
        />
        <MetricaCard
          label="Plantas"
          value={dashboard.total_plantas.toString()}
          detail={`${dashboard.plantas_produciendo} produciendo`}
          color="green"
        />
        <MetricaCard
          label="Alertas"
          value={dashboard.alertas_activas.toString()}
          detail={dashboard.alertas_criticas > 0 ? `${dashboard.alertas_criticas} críticas` : 'Todo ok'}
          color={dashboard.alertas_criticas > 0 ? 'red' : 'gray'}
        />
      </div>

      {/* Temporada actual */}
      <div className="bg-white rounded-lg p-4 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-700">Temporada actual</h3>
            <p className="text-2xl font-bold capitalize">{dashboard.temporada_actual}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Factor de consumo</div>
            <div className="text-xl font-bold">
              ×{dashboard.factor_temporada.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Plantas por cultivo */}
      {Object.keys(dashboard.plantas_por_cultivo).length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="font-medium text-gray-700 mb-3">Plantas por cultivo</h3>
          <div className="space-y-2">
            {Object.entries(dashboard.plantas_por_cultivo).map(([cultivo, cantidad]) => (
              <div key={cultivo} className="flex justify-between items-center">
                <span className="text-gray-600">{cultivo}</span>
                <span className="font-medium">{cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plantas muertas */}
      {dashboard.plantas_muertas > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-500">☠️</span>
            <span className="text-red-800">
              {dashboard.plantas_muertas} planta(s) muerta(s) - considera removerlas
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricaCard({
  label,
  value,
  detail,
  color,
}: {
  label: string
  value: string
  detail: string
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-800',
    green: 'bg-green-50 text-green-800',
    yellow: 'bg-yellow-50 text-yellow-800',
    red: 'bg-red-50 text-red-800',
    gray: 'bg-gray-50 text-gray-800',
  }

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="text-sm font-medium opacity-75">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-60">{detail}</div>
    </div>
  )
}
```

---

### Tarea 5: INTEGRAR Alertas y Dashboard en UI

**Archivos**: `src/app/page.tsx` (actualizar), `src/app/alertas/page.tsx` (crear)

**Cambios requeridos:**

1. **Contador de alertas en header**:

   ```typescript
   <div className="relative">
     <BellIcon />
     {alertasCriticas > 0 && (
       <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4">
         {alertasCriticas}
       </span>
     )}
   </div>
   ```

2. **Dropdown de alertas** al hacer click en campana:
   - Lista últimas 5 alertas
   - Link a página completa

3. **Crear ruta /alertas**:

   ```
   src/app/alertas/page.tsx
   ```

4. **Dashboard en página principal**:
   - Reemplazar sidebar cuando no hay zona seleccionada
   - Mostrar TerrenoDashboard con métricas

5. **Notificación visual** para alertas críticas:
   - Banner en la parte superior
   - Se puede cerrar temporalmente

6. **Conectar useAlertas** para cargar y actualizar alertas

---

## Criterios de Aceptación

- [ ] Alertas se generan automáticamente al cargar datos
- [ ] Déficit de agua genera alerta crítica
- [ ] Plantas muy cercanas generan warning
- [ ] Zonas vacías generan info
- [ ] Se puede marcar alerta como resuelta
- [ ] Se puede ignorar alerta
- [ ] Dashboard muestra métricas correctas
- [ ] Temporada y factor se muestran correctamente
- [ ] Plantas muertas tienen indicador visual
- [ ] **Contador de alertas visible en header**
- [ ] **Dashboard en página principal**
- [ ] **Página /alertas con lista completa**

---

## Siguiente Fase

**FASE_8_PWA** - PWA y sincronización offline

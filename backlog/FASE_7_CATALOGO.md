# FASE 7: Catálogo de Cultivos

**Status**: ✅ COMPLETADO
**Prioridad**: 🟡 Media
**Dependencias**: FASE_6
**Estimación**: 3-4 horas

---

## Objetivo

Implementar gestión del catálogo de cultivos que es por proyecto y editable.

---

## Reglas de Negocio

1. **Por proyecto**: Cada proyecto tiene su propio catálogo
2. **Editable**: Usuario puede agregar, editar, eliminar cultivos
3. **Precargado**: Se inicializa con datos de YAML de referencia
4. **Campos requeridos**: nombre, agua, espaciado, tiempo producción
5. **Campos opcionales**: precio, tolerancias, tier, riesgo

---

## Tareas

### Tarea 1: Crear Hook useCatalogo

**Archivo**: `src/hooks/useCatalogo.ts` (crear)

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/db";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import type { CatalogoCultivo, UUID } from "@/types";

interface UseCatalogo {
  cultivos: CatalogoCultivo[];
  loading: boolean;
  error: Error | null;

  agregarCultivo: (
    data: Omit<
      CatalogoCultivo,
      "id" | "proyecto_id" | "created_at" | "updated_at"
    >,
  ) => Promise<CatalogoCultivo>;
  actualizarCultivo: (
    id: UUID,
    cambios: Partial<CatalogoCultivo>,
  ) => Promise<void>;
  eliminarCultivo: (id: UUID) => Promise<void>;
  obtenerCultivo: (id: UUID) => CatalogoCultivo | undefined;
}

export function useCatalogo(proyectoId: UUID): UseCatalogo {
  const [cultivos, setCultivos] = useState<CatalogoCultivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Cargar cultivos del proyecto
  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        const data = await db.catalogo_cultivos
          .where("proyecto_id")
          .equals(proyectoId)
          .toArray();
        setCultivos(data);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Error al cargar catálogo"),
        );
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, [proyectoId]);

  const agregarCultivo = useCallback(
    async (
      data: Omit<
        CatalogoCultivo,
        "id" | "proyecto_id" | "created_at" | "updated_at"
      >,
    ) => {
      const nuevo: CatalogoCultivo = {
        ...data,
        id: generateUUID(),
        proyecto_id: proyectoId,
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp(),
      };

      await db.catalogo_cultivos.add(nuevo);
      setCultivos((prev) => [...prev, nuevo]);
      return nuevo;
    },
    [proyectoId],
  );

  const actualizarCultivo = useCallback(
    async (id: UUID, cambios: Partial<CatalogoCultivo>) => {
      await db.catalogo_cultivos.update(id, {
        ...cambios,
        updated_at: getCurrentTimestamp(),
      });
      setCultivos((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, ...cambios, updated_at: getCurrentTimestamp() }
            : c,
        ),
      );
    },
    [],
  );

  const eliminarCultivo = useCallback(async (id: UUID) => {
    await db.catalogo_cultivos.delete(id);
    setCultivos((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const obtenerCultivo = useCallback(
    (id: UUID) => {
      return cultivos.find((c) => c.id === id);
    },
    [cultivos],
  );

  return {
    cultivos,
    loading,
    error,
    agregarCultivo,
    actualizarCultivo,
    eliminarCultivo,
    obtenerCultivo,
  };
}
```

---

### Tarea 2: Crear Página de Catálogo

**Archivo**: `src/app/terrenos/[id]/catalogo/page.tsx` (crear)

```typescript
'use client'

import { use, useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { CatalogoList } from '@/components/catalogo/CatalogoList'
import { CultivoForm } from '@/components/catalogo/CultivoForm'
import { useTerreno } from '@/hooks/useTerreno'
import { useCatalogo } from '@/hooks/useCatalogo'
import type { CatalogoCultivo } from '@/types'

export default function CatalogoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: terrenoId } = use(params)
  const { terreno } = useTerreno(terrenoId)
  const { cultivos, agregarCultivo, actualizarCultivo, eliminarCultivo } = useCatalogo(
    terreno?.proyecto_id || ''
  )

  const [cultivoEditando, setCultivoEditando] = useState<CatalogoCultivo | null>(null)
  const [showNuevo, setShowNuevo] = useState(false)

  if (!terreno) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar terrenoId={terrenoId} />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Catálogo de Cultivos</h1>
            <button
              onClick={() => setShowNuevo(true)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              + Agregar Cultivo
            </button>
          </div>

          <CatalogoList
            cultivos={cultivos}
            onEditar={setCultivoEditando}
            onEliminar={eliminarCultivo}
          />
        </main>

        <Sidebar>
          {(showNuevo || cultivoEditando) && (
            <CultivoForm
              cultivo={cultivoEditando || undefined}
              onGuardar={async (data) => {
                if (cultivoEditando) {
                  await actualizarCultivo(cultivoEditando.id, data)
                } else {
                  await agregarCultivo(data as any)
                }
                setCultivoEditando(null)
                setShowNuevo(false)
              }}
              onCancelar={() => {
                setCultivoEditando(null)
                setShowNuevo(false)
              }}
            />
          )}
        </Sidebar>
      </div>
    </div>
  )
}
```

---

### Tarea 3: Crear Componente Lista de Cultivos

**Archivo**: `src/components/catalogo/CatalogoList.tsx` (crear)

```typescript
'use client'

import type { CatalogoCultivo, UUID } from '@/types'

interface CatalogoListProps {
  cultivos: CatalogoCultivo[]
  onEditar: (cultivo: CatalogoCultivo) => void
  onEliminar: (id: UUID) => void
}

export function CatalogoList({ cultivos, onEditar, onEliminar }: CatalogoListProps) {
  if (cultivos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay cultivos en el catálogo. Agrega uno para empezar.
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cultivos.map((cultivo) => (
        <CultivoCard
          key={cultivo.id}
          cultivo={cultivo}
          onEditar={() => onEditar(cultivo)}
          onEliminar={() => onEliminar(cultivo.id)}
        />
      ))}
    </div>
  )
}

function CultivoCard({
  cultivo,
  onEditar,
  onEliminar,
}: {
  cultivo: CatalogoCultivo
  onEditar: () => void
  onEliminar: () => void
}) {
  const tierColors = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-yellow-100 text-yellow-800',
    3: 'bg-red-100 text-red-800',
  }

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-bold">{cultivo.nombre}</h3>
          {cultivo.nombre_cientifico && (
            <p className="text-sm text-gray-500 italic">{cultivo.nombre_cientifico}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded ${tierColors[cultivo.tier]}`}>
          Tier {cultivo.tier}
        </span>
      </div>

      <div className="space-y-1 text-sm text-gray-600 mb-3">
        <div>
          <span className="font-medium">Agua:</span>{' '}
          {cultivo.agua_m3_ha_año_min}-{cultivo.agua_m3_ha_año_max} m³/ha/año
        </div>
        <div>
          <span className="font-medium">Espaciado:</span>{' '}
          {cultivo.espaciado_recomendado_m}m (mín: {cultivo.espaciado_min_m}m)
        </div>
        <div>
          <span className="font-medium">Producción:</span>{' '}
          {cultivo.tiempo_produccion_meses} meses
        </div>
        {cultivo.precio_kg_min_clp && cultivo.precio_kg_max_clp && (
          <div>
            <span className="font-medium">Precio:</span>{' '}
            ${cultivo.precio_kg_min_clp.toLocaleString()}-${cultivo.precio_kg_max_clp.toLocaleString()}/kg
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEditar}
          className="flex-1 text-sm bg-gray-100 py-1 rounded hover:bg-gray-200"
        >
          Editar
        </button>
        <button
          onClick={onEliminar}
          className="text-sm text-red-600 hover:text-red-800 px-3"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}
```

---

### Tarea 4: Crear Formulario de Cultivo

**Archivo**: `src/components/catalogo/CultivoForm.tsx` (crear)

```typescript
'use client'

import { useState } from 'react'
import type { CatalogoCultivo, Tolerancia, ToleranciaSimple, Tier, Riesgo } from '@/types'

interface CultivoFormProps {
  cultivo?: CatalogoCultivo
  onGuardar: (data: Partial<CatalogoCultivo>) => void
  onCancelar: () => void
}

export function CultivoForm({ cultivo, onGuardar, onCancelar }: CultivoFormProps) {
  const [nombre, setNombre] = useState(cultivo?.nombre || '')
  const [nombreCientifico, setNombreCientifico] = useState(cultivo?.nombre_cientifico || '')
  const [aguaMin, setAguaMin] = useState(cultivo?.agua_m3_ha_año_min || 3000)
  const [aguaMax, setAguaMax] = useState(cultivo?.agua_m3_ha_año_max || 5000)
  const [espaciadoMin, setEspaciadoMin] = useState(cultivo?.espaciado_min_m || 0.5)
  const [espaciadoRec, setEspaciadoRec] = useState(cultivo?.espaciado_recomendado_m || 2)
  const [toleranciaBoro, setToleranciaBoro] = useState<Tolerancia>(cultivo?.tolerancia_boro || 'media')
  const [toleranciaSalinidad, setToleranciaSalinidad] = useState<ToleranciaSimple>(cultivo?.tolerancia_salinidad || 'media')
  const [tiempoProduccion, setTiempoProduccion] = useState(cultivo?.tiempo_produccion_meses || 24)
  const [vidaUtil, setVidaUtil] = useState(cultivo?.vida_util_años || 20)
  const [precioMin, setPrecioMin] = useState(cultivo?.precio_kg_min_clp || 0)
  const [precioMax, setPrecioMax] = useState(cultivo?.precio_kg_max_clp || 0)
  const [tier, setTier] = useState<Tier>(cultivo?.tier || 2)
  const [riesgo, setRiesgo] = useState<Riesgo>(cultivo?.riesgo || 'medio')
  const [notas, setNotas] = useState(cultivo?.notas || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onGuardar({
      nombre,
      nombre_cientifico: nombreCientifico || undefined,
      agua_m3_ha_año_min: aguaMin,
      agua_m3_ha_año_max: aguaMax,
      espaciado_min_m: espaciadoMin,
      espaciado_recomendado_m: espaciadoRec,
      tolerancia_boro: toleranciaBoro,
      tolerancia_salinidad: toleranciaSalinidad,
      tiempo_produccion_meses: tiempoProduccion,
      vida_util_años: vidaUtil,
      precio_kg_min_clp: precioMin || undefined,
      precio_kg_max_clp: precioMax || undefined,
      tier,
      riesgo,
      notas,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h3 className="text-lg font-bold">
        {cultivo ? 'Editar Cultivo' : 'Nuevo Cultivo'}
      </h3>

      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium mb-1">Nombre *</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Nombre científico</label>
        <input
          type="text"
          value={nombreCientifico}
          onChange={(e) => setNombreCientifico(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      {/* Agua */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Agua mín (m³/ha/año)</label>
          <input
            type="number"
            value={aguaMin}
            onChange={(e) => setAguaMin(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Agua máx</label>
          <input
            type="number"
            value={aguaMax}
            onChange={(e) => setAguaMax(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>

      {/* Espaciado */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Espaciado mín (m)</label>
          <input
            type="number"
            value={espaciadoMin}
            onChange={(e) => setEspaciadoMin(Number(e.target.value))}
            min={0.5}
            step={0.1}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Recomendado (m)</label>
          <input
            type="number"
            value={espaciadoRec}
            onChange={(e) => setEspaciadoRec(Number(e.target.value))}
            step={0.1}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>

      {/* Tiempos */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Producción (meses)</label>
          <input
            type="number"
            value={tiempoProduccion}
            onChange={(e) => setTiempoProduccion(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Vida útil (años)</label>
          <input
            type="number"
            value={vidaUtil}
            onChange={(e) => setVidaUtil(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>

      {/* Tier y Riesgo */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Tier</label>
          <select
            value={tier}
            onChange={(e) => setTier(Number(e.target.value) as Tier)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value={1}>1 - Bajo riesgo</option>
            <option value={2}>2 - Medio</option>
            <option value={3}>3 - Alto potencial</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Riesgo</label>
          <select
            value={riesgo}
            onChange={(e) => setRiesgo(e.target.value as Riesgo)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="bajo">Bajo</option>
            <option value="medio">Medio</option>
            <option value="alto">Alto</option>
          </select>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium mb-1">Notas</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          rows={2}
        />
      </div>

      {/* Botones */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
```

---

### Tarea 5: INTEGRAR Catálogo en Navegación

**Archivo**: `src/app/catalogo/page.tsx` (crear)

**Cambios requeridos:**

1. **Crear ruta /catalogo** con página dedicada:

   ```
   src/app/catalogo/page.tsx
   ```

2. **Link en header** de la página principal:

   ```typescript
   <Link href="/catalogo">Catálogo</Link>
   ```

3. **Página de catálogo** con:
   - Lista de cultivos (CatalogoList)
   - Botón "+ Agregar Cultivo"
   - Formulario en modal o sidebar (CultivoForm)

4. **Selector de cultivo al plantar** (FASE_4):
   - Dropdown usa datos de useCatalogo
   - Muestra espaciado recomendado

5. **Precarga de datos** (opcional):
   - Si catálogo vacío, ofrecer cargar cultivos de ejemplo

---

## Criterios de Aceptación

- [x] Catálogo es por proyecto (no global)
- [x] Lista de cultivos muestra cards con info
- [x] Se puede agregar nuevo cultivo
- [x] Se puede editar cultivo existente
- [x] Se puede eliminar cultivo
- [x] Formulario valida campos requeridos
- [x] Tier y riesgo tienen visual diferenciado
- [x] **Página /catalogo accesible desde navegación**
- [x] **Cultivos disponibles al plantar**

---

## Siguiente Fase

**FASE_6_AGUA** - Control de agua: entradas, consumo, cálculos

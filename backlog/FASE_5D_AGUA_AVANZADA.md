# FASE 5D: Agua Avanzada

**Status**: ✅ COMPLETADA
**Prioridad**: 🟡 Media
**Dependencias**: FASE_5C
**Fuente**: `mi primera investigacion/3-modelo_ordenado/2_recursos_base/03_agua.yaml`

---

## Objetivo

Extender el sistema de agua con:

1. **Calidad del agua** (salinidad, boro, arsénico) - CRÍTICO
2. **Gestión de proveedores** (aljibe, alternativos)
3. **Contingencias** (qué hacer si no llega agua)
4. **Técnicas de ahorro** (RDC, hidrogel)

**IMPORTANTE**: La calidad del agua limita qué cultivos puedes plantar. Agua del Lluta tiene >11 ppm boro (tóxico para muchos cultivos).

---

## Nuevos Datos

### 1. Calidad del Agua (CRÍTICO)

```typescript
calidad_agua?: {
  analisis_realizado?: boolean
  fecha_analisis?: string
  laboratorio?: string

  salinidad_dS_m?: number       // Lluta >2 dS/m
  boro_ppm?: number             // Lluta >11 ppm (MUY ALTO)
  arsenico_mg_l?: number

  requiere_filtrado?: boolean
  costo_filtrado_mensual?: number
}
```

### 2. Proveedores de Agua

```typescript
proveedores_agua?: {
  principal?: {
    nombre: string
    telefono?: string
    precio_m3_clp?: number
    confiabilidad?: 'alta' | 'media' | 'baja'
    notas?: string
  }
  alternativos?: Array<{
    nombre: string
    telefono?: string
    precio_m3_clp?: number
  }>
}
```

### 3. Derechos Legales de Agua

```typescript
derechos_agua?: {
  tiene_derechos_dga?: boolean
  litros_por_segundo?: number
  m3_mes_autorizado?: number
  fuente_oficial?: string       // DGA, junta de vigilancia
  inscripcion_dga?: string
}
```

### 4. Contingencias

```typescript
contingencias_agua?: {
  buffer_minimo_pct?: number    // 30% - nunca bajar de esto
  alerta_critica_pct?: number   // 20% - llamar aljibe inmediatamente
  plan_si_no_llega?: string[]   // acciones a tomar
}
```

### 5. Técnicas de Ahorro

```typescript
tecnicas_ahorro?: {
  riego_deficitario_controlado?: boolean  // RDC - ahorra 20-60%
  hidrogel?: boolean                      // Reduce frecuencia 74%
  mulch?: boolean                         // Reduce evaporación
  sensores_humedad?: boolean
}
```

---

## Tareas

### Tarea 1: Agregar Campos a Terreno

**Archivo**: `src/types/index.ts`

Agregar todos los nuevos campos opcionales.

### Tarea 2: Crear Umbrales Calidad Agua

**Archivo**: `src/lib/data/umbrales-agua.ts`

```typescript
export const UMBRALES_AGUA = {
  salinidad: { max: 2, unidad: "dS/m", alerta: "Agua salina" },
  boro: { max: 2, unidad: "ppm", alerta: "Tóxico para muchos cultivos" },
  arsenico: { max: 0.05, unidad: "mg/L", alerta: "Riesgo para salud" },
};

export const RIOS_ARICA = {
  lluta: { salinidad: 2.5, boro: 11, arsenico: 0.02, nota: "MUY ALTO BORO" },
  azapa: { salinidad: 1.5, boro: 0.5, arsenico: 0.01, nota: "Mejor calidad" },
};
```

### Tarea 3: Crear Formulario Calidad Agua

**Archivo**: `src/components/agua/formulario-calidad-agua.tsx`

Similar al de suelo:

- Campos para salinidad, boro, arsénico
- Validación visual vs umbrales
- Selector de fuente conocida (Lluta, Azapa, aljibe)

### Tarea 4: CRUD Proveedores

**Archivo**: `src/components/agua/proveedores-agua.tsx`

Lista de proveedores con:

- Agregar nuevo proveedor
- Editar datos
- Marcar como principal/alternativo
- Mostrar precio por m³

### Tarea 5: Panel Contingencias

**Archivo**: `src/components/agua/contingencias-agua.tsx`

Muestra:

- Nivel de alerta actual (OK, Ajustado, Crítico)
- Plan de acción si agua < 20%
- Contactos de emergencia (proveedores alternativos)

### Tarea 6: Panel Técnicas Ahorro

**Archivo**: `src/components/agua/tecnicas-ahorro.tsx`

Información sobre:

- **RDC (Riego Deficitario Controlado)**: Ahorra 20-60% sin perder producción
- **Hidrogel Raindrops**: 74% menos frecuencia de riego
- **Mulch**: Reduce evaporación
- **Sensores humedad**: Riego preciso

Con links a proveedores (Raindrops.cl, PlusAgro, etc.)

### Tarea 7: Integrar en Validación Cultivos

**Archivo**: `src/lib/validations/cultivo-restricciones.ts`

Actualizar `validarCultivoEnTerreno()` para considerar:

- Calidad del agua (boro, salinidad)
- Si agua del Lluta → descartar cultivos sensibles a boro

### Tarea 8: Página /agua/configuracion

**Archivo**: `src/app/agua/configuracion/page.tsx`

Página con tabs:

1. Calidad del Agua
2. Proveedores
3. Contingencias
4. Técnicas de Ahorro

---

## Criterios de Aceptación

- [x] Formulario calidad agua con validación
- [x] CRUD de proveedores funcional
- [x] Panel contingencias con niveles de alerta
- [x] Panel técnicas ahorro con información útil
- [x] Validación de cultivos considera calidad agua
- [x] Si boro > 2 ppm, advertir sobre cultivos sensibles
- [x] Proveedores alternativos visibles en emergencia
- [x] Datos guardados en terreno (IndexedDB)

---

## Notas

- Prioridad MEDIA pero calidad agua es CRÍTICO
- Agua del Lluta tiene >11 ppm boro (tóxico para mango, papaya, etc.)
- Análisis de agua INIA ~$75,000 CLP
- RDC puede aumentar producción además de ahorrar agua (FIA/INIA)
- Hidrogel Raindrops: envío gratis >$60,000

---

## Referencias Proveedores Hidrogel (Chile)

| Proveedor | URL           | Ventaja                      |
| --------- | ------------- | ---------------------------- |
| Raindrops | raindrops.cl  | Aplica en SECO, 400L/kg      |
| PlusAgro  | plusagro.cl   | Biodegradable, 85% ahorro    |
| Plantagel | plantagel.com | Contacto: info@plantagel.com |

---

## Siguiente Fase

**FASE_6_RECOMENDACION** - Motor de recomendación inteligente (renombrado de FASE_2_RECOMENDACION)

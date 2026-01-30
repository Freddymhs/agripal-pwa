# FASE 5: Configuración Terreno Avanzada

**Status**: ✅ COMPLETADA
**Prioridad**: 🟡 Media
**Dependencias**: FASE_4C
**Fuente**: `mi primera investigacion/3-modelo_ordenado/2_recursos_base/00_terreno.yaml`

---

## Objetivo

Ampliar la configuración del terreno con datos legales, ubicación geográfica, distancias a servicios y conectividad. Estos datos no bloquean el uso de la app pero enriquecen el análisis y ayudan al usuario a tomar decisiones informadas.

---

## Campos a Agregar en Terreno

### 1. Ubicación Geográfica
```typescript
ubicacion?: {
  region?: string              // "Arica y Parinacota"
  comuna?: string              // "Arica"
  coordenadas?: string         // "-18.36386, -70.02931"
  direccion?: string           // Dirección o referencia
}
```

### 2. Legal (CRÍTICO para venta)
```typescript
legal?: {
  tipo_propiedad?: 'propio' | 'arriendo' | 'comodato' | 'sucesion' | null
  titulo_saneado?: boolean
  rol_sii?: string
  contribuciones_al_dia?: boolean

  permisos?: {
    permiso_edificacion?: boolean
    resolucion_sanitaria?: boolean
    declaracion_sii?: boolean
    patente_municipal?: boolean
  }

  registro_agricola?: {
    inscripcion_sag?: boolean    // OBLIGATORIO para vender
    rut_agricola?: string
    registro_indap?: boolean     // Para subsidios
  }

  derechos_agua?: {
    tiene_derechos_dga?: boolean
    litros_por_segundo?: number
    inscripcion_junta_vigilancia?: boolean
  }

  seguros?: {
    seguro_agricola?: boolean
    seguro_incendio?: boolean
    costo_anual_clp?: number
  }
}
```

### 3. Distancias a Servicios
```typescript
distancias?: {
  pueblo_cercano_km?: number
  ciudad_principal_km?: number
  hospital_km?: number
  ferreteria_agricola_km?: number
  mercado_mayorista_km?: number
}
```

### 4. Conectividad
```typescript
conectividad?: {
  señal_celular?: boolean
  operador_celular?: string
  calidad_señal?: 'buena' | 'regular' | 'mala'
  internet_disponible?: boolean
  tipo_internet?: 'fibra' | '4g' | 'satelital' | null
}
```

### 5. Infraestructura Existente
```typescript
infraestructura?: {
  acceso?: 'pavimentado' | 'ripio' | 'tierra' | 'inexistente'
  cerco?: 'completo' | 'parcial' | 'sin_cerco'
  electricidad?: boolean
  agua_potable?: boolean
}
```

---

## Tareas

### Tarea 1: Actualizar Tipos
**Archivo**: `src/types/index.ts`

Agregar los nuevos campos opcionales a la interface `Terreno`.

### Tarea 2: Crear Modal/Página Configuración Avanzada
**Archivo**: `src/components/terreno/configuracion-avanzada-modal.tsx`

Modal con tabs o secciones colapsables:
- Tab 1: Ubicación
- Tab 2: Legal
- Tab 3: Distancias
- Tab 4: Conectividad
- Tab 5: Infraestructura

### Tarea 3: Crear Checklist Legal
**Archivo**: `src/components/terreno/checklist-legal.tsx`

Muestra estado de requisitos legales:
- ✅ / ❌ Inscripción SAG (OBLIGATORIO para vender)
- ✅ / ❌ RUT Agrícola
- ✅ / ❌ Derechos de agua DGA
- etc.

Con advertencias si faltan elementos críticos.

### Tarea 4: Integrar en Selector Terreno
**Archivo**: `src/components/terreno/selector-terreno.tsx`

Agregar botón "⚙️ Configuración" que abre el modal de configuración avanzada.

### Tarea 5: Panel de Resumen
**Archivo**: `src/components/terreno/resumen-terreno.tsx`

Card que muestre:
- Ubicación (región, comuna)
- Estado legal (% completado)
- Distancias clave
- Conectividad

---

## Criterios de Aceptación

- [x] Todos los campos son opcionales (no bloquean uso de app)
- [x] Modal de configuración con tabs organizados
- [x] Checklist legal muestra estado visual claro
- [x] Advertencia si falta inscripción SAG
- [x] Datos se guardan en IndexedDB
- [x] Panel resumen visible en página principal o sidebar

---

## Notas

- Estos datos son para INFORMACIÓN del usuario
- No afectan cálculos de agua/cultivos
- A futuro podrían integrarse con APIs (SII, SAG, etc.)
- Prioridad MEDIA porque no bloquea funcionalidad core

---

## Siguiente Fase

**FASE_5B_CLIMA** - Panel de clima con datos estáticos por zona

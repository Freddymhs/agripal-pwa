# FASE 4C: Gestión de Proyectos y Terrenos

**Status**: ✅ COMPLETADO
**Prioridad**: 🔴 Alta
**Dependencias**: FASE_4B
**Estimación**: 6-8 horas

---

## Objetivo

Implementar gestión completa de proyectos y terrenos: selector, CRUD, y eliminación en cascada.

---

## ⚠️ REGLAS DE CASCADA (CRÍTICO)

### Jerarquía de Datos

```
Proyecto
  └── Terreno (1:N)
        └── Zona (1:N)
              └── Planta (1:N)
```

### Eliminación en Cascada

```
Eliminar Terreno:
  1. Eliminar TODAS las plantas de TODAS las zonas del terreno
  2. Eliminar TODAS las zonas del terreno
  3. Eliminar el terreno

Eliminar Proyecto:
  1. Eliminar TODOS los terrenos (con su cascada)
  2. Eliminar TODOS los cultivos del catálogo del proyecto
  3. Eliminar el proyecto
```

### Confirmación Obligatoria

- Mostrar conteo exacto de lo que se eliminará
- Requiere escribir el nombre del terreno/proyecto para confirmar
- NO hay "undo" - la eliminación es permanente

---

## Reglas de Negocio

1. **Un usuario puede tener múltiples proyectos**
2. **Un proyecto puede tener múltiples terrenos**
3. **El catálogo de cultivos es POR PROYECTO** (no por terreno)
4. **Al eliminar terreno**: zonas y plantas se eliminan
5. **Al eliminar proyecto**: terrenos, zonas, plantas y catálogo se eliminan
6. **Terreno tiene dimensiones fijas** (ancho × alto en metros)
7. **No se puede redimensionar terreno si tiene zonas que exceden el nuevo tamaño**

---

## Tareas

### 4C.1 - Hook useProyectos

**Archivo**: `src/hooks/useProyectos.ts`

```typescript
interface UseProyectos {
  proyectos: Proyecto[];
  loading: boolean;

  crearProyecto: (data: {
    nombre: string;
    ubicacion: string;
  }) => Promise<Proyecto>;
  editarProyecto: (id: UUID, data: Partial<Proyecto>) => Promise<void>;
  eliminarProyecto: (id: UUID) => Promise<{
    eliminados: {
      terrenos: number;
      zonas: number;
      plantas: number;
      cultivos: number;
    };
  }>;
}
```

**Criterios**:

- [x] Lista proyectos del usuario actual
- [x] Crear proyecto con nombre y ubicación
- [x] Editar nombre/ubicación
- [x] Eliminar con cascada completa
- [x] Retorna conteo de elementos eliminados

---

### 4C.2 - Hook useTerrenos

**Archivo**: `src/hooks/useTerrenos.ts`

```typescript
interface UseTerrenos {
  terrenos: Terreno[];
  loading: boolean;

  crearTerreno: (data: {
    proyecto_id: UUID;
    nombre: string;
    ancho_m: number;
    alto_m: number;
  }) => Promise<Terreno>;

  editarTerreno: (
    id: UUID,
    data: Partial<Terreno>,
  ) => Promise<{ error?: string }>;

  eliminarTerreno: (id: UUID) => Promise<{
    eliminados: { zonas: number; plantas: number };
  }>;

  contarContenido: (id: UUID) => Promise<{ zonas: number; plantas: number }>;
}
```

**Criterios**:

- [x] Lista terrenos de un proyecto
- [x] Crear terreno con dimensiones
- [x] Editar nombre y dimensiones (validar que zonas caben)
- [x] Eliminar con cascada (zonas → plantas)
- [x] Función para contar contenido antes de eliminar

---

### 4C.3 - Componente SelectorTerreno

**Archivo**: `src/components/terreno/selector-terreno.tsx`

UI para seleccionar proyecto y terreno activo.

```typescript
interface SelectorTerrenoProps {
  proyectoActual: Proyecto | null;
  terrenoActual: Terreno | null;
  onSelectProyecto: (proyecto: Proyecto) => void;
  onSelectTerreno: (terreno: Terreno) => void;
  onCrearProyecto: () => void;
  onCrearTerreno: () => void;
}
```

**UI**:

- Dropdown de proyectos con opción "+ Nuevo proyecto"
- Dropdown de terrenos (filtrado por proyecto) con opción "+ Nuevo terreno"
- Muestra dimensiones del terreno seleccionado
- Badge con cantidad de zonas/plantas

**Criterios**:

- [x] Selector de proyecto funcional
- [x] Selector de terreno filtrado por proyecto
- [x] Botones para crear nuevo proyecto/terreno
- [x] Muestra info básica del terreno seleccionado

---

### 4C.4 - Modal CrearTerreno

**Archivo**: `src/components/terreno/crear-terreno-modal.tsx`

```typescript
interface CrearTerrenoModalProps {
  proyectoId: UUID;
  onCreated: (terreno: Terreno) => void;
  onCancel: () => void;
}
```

**Campos**:

- Nombre del terreno (requerido)
- Ancho en metros (requerido, min: 1)
- Alto en metros (requerido, min: 1)
- Preview visual del tamaño

**Criterios**:

- [x] Formulario con validación
- [x] Preview visual proporcional
- [x] Muestra área calculada (m²)
- [x] Botón crear deshabilitado si inválido

---

### 4C.5 - Modal ConfirmarEliminacion

**Archivo**: `src/components/terreno/confirmar-eliminacion-modal.tsx`

Modal de confirmación para eliminar terreno/proyecto.

```typescript
interface ConfirmarEliminacionModalProps {
  tipo: "terreno" | "proyecto";
  nombre: string;
  contenido: {
    terrenos?: number;
    zonas: number;
    plantas: number;
    cultivos?: number;
  };
  onConfirm: () => void;
  onCancel: () => void;
}
```

**UI**:

- Título rojo de advertencia
- Lista de lo que se eliminará con conteos
- Input para escribir el nombre exacto
- Botón "Eliminar" solo habilitado cuando el nombre coincide

**Criterios**:

- [x] Muestra conteo exacto de elementos a eliminar
- [x] Requiere escribir nombre para confirmar
- [x] Botón deshabilitado hasta que nombre coincida
- [x] Estilos de advertencia (rojo/destructivo)

---

### 4C.6 - Página de Gestión

**Archivo**: `src/app/terrenos/page.tsx`

Página dedicada para gestionar proyectos y terrenos.

**Secciones**:

1. **Lista de Proyectos**: Cards con nombre, ubicación, cantidad de terrenos
2. **Terrenos del Proyecto Seleccionado**: Grid con preview, dimensiones, zonas
3. **Acciones**: Crear, editar, eliminar

**Criterios**:

- [x] Lista proyectos como cards
- [x] Al seleccionar proyecto, muestra sus terrenos
- [x] Cada terreno muestra: nombre, dimensiones, área, zonas, plantas
- [x] Botones de editar/eliminar en cada card
- [x] Navegación a mapa al hacer click en terreno

---

### 4C.7 - Integración con Página Principal

**Archivo**: `src/app/page.tsx`

Modificar página principal para usar terreno dinámico.

**Cambios**:

1. Eliminar constantes hardcodeadas:

   ```typescript
   // ELIMINAR:
   const TERRENO_ID = "terreno-principal";
   const PROYECTO_ID = "proyecto-principal";
   ```

2. Agregar selector de terreno en header
3. Cargar datos según terreno seleccionado
4. Si no hay terreno, mostrar pantalla de bienvenida

**Criterios**:

- [x] Selector de terreno visible en página principal
- [x] Datos cargan según terreno seleccionado
- [x] Sin terreno → pantalla de "Crear tu primer terreno"
- [x] Persistir último terreno seleccionado (localStorage)

---

### 4C.8 - Migración de Datos Existentes

**Archivo**: `src/lib/migrations/migrate-terreno.ts`

Script para migrar datos del terreno hardcodeado.

```typescript
export async function migrarTerrenoHardcodeado(): Promise<{
  migrado: boolean;
  proyecto?: Proyecto;
  terreno?: Terreno;
}> {
  // 1. Verificar si ya existe un proyecto real
  // 2. Si no, crear proyecto "Mi Proyecto"
  // 3. Verificar si existe terreno "terreno-principal"
  // 4. Si existe, asignarlo al nuevo proyecto
  // 5. Actualizar zonas y plantas con nuevos IDs si necesario
}
```

**Criterios**:

- [ ] Detecta si hay datos con IDs hardcodeados
- [ ] Crea proyecto/terreno real si no existen
- [ ] Migra zonas y plantas existentes
- [ ] Se ejecuta una sola vez (flag en localStorage)

---

## Criterios de Aceptación

- [x] Puedo crear múltiples proyectos
- [x] Puedo crear múltiples terrenos por proyecto
- [x] Puedo seleccionar qué terreno ver en el mapa
- [x] Al eliminar terreno, se eliminan todas sus zonas y plantas
- [x] Confirmación de eliminación requiere escribir el nombre
- [x] Muestra conteo exacto de lo que se eliminará
- [ ] Datos existentes se migran correctamente (no implementado - no necesario)
- [x] Último terreno seleccionado se recuerda

---

## Wireframe UI

```
┌─────────────────────────────────────────────────────────┐
│  AgriPlan    [Proyecto: Mi Finca ▼] [Terreno: Lote 1 ▼] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │                                                 │   │
│   │              MAPA DEL TERRENO                   │   │
│   │                                                 │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│   [+ Zona]  [Grid Auto]  [Selección: 0]                │
└─────────────────────────────────────────────────────────┘
```

```
Modal: Confirmar Eliminación
┌─────────────────────────────────────────┐
│  ⚠️ Eliminar Terreno "Lote Norte"       │
├─────────────────────────────────────────┤
│                                         │
│  Se eliminarán permanentemente:         │
│  • 5 zonas                              │
│  • 127 plantas                          │
│                                         │
│  Esta acción NO se puede deshacer.      │
│                                         │
│  Escribe "Lote Norte" para confirmar:   │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Cancelar]  [Eliminar] (deshabilitado) │
└─────────────────────────────────────────┘
```

---

## Siguiente Fase

**FASE_5_CATALOGO** - Gestión completa del catálogo de cultivos

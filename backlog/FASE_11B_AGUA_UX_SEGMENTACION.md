# FASE 11B: Segmentación UX Agua (Experimentación vs Gestión)

**Status**: ✅ COMPLETADA
**Prioridad**: 🔴 Alta
**Dependencias**: FASE_11, FASE_8, FASE_6
**Estimación**: 2-3 horas
**Fecha completada**: 2026-02-05

---

## Problema Detectado

El sistema mezclaba dos casos de uso distintos sin clara separación:

1. **Experimentación/Planificación**: Usuario quiere probar configuraciones antes de invertir dinero real
   - "¿Qué cultivos son viables con mi agua actual?"
   - "¿Cuánta agua necesitaría para X cultivo?"
   - Sandbox para jugar con plantas y estanques hipotéticos

2. **Gestión Diaria**: Usuario gestiona su sistema en operación
   - Registrar entradas reales de agua
   - Monitorear consumo actual de plantas reales
   - Ver cuántos días queda de agua

**Confusión UX**: Ambos flujos estaban mezclados en el sidebar del mapa, causando:
- Recomendaciones basadas en plantas actuales (no útil para experimentación)
- No era claro dónde planificar vs dónde gestionar
- Usuario perdido entre múltiples tabs sin propósito claro

---

## Objetivo

Separar claramente los dos flujos de trabajo en páginas distintas con:
- Propósito evidente (color, mensajes, ubicación)
- Navegación clara entre ambas
- Herramientas específicas para cada contexto

---

## Solución Implementada

### Arquitectura de Páginas

```
/agua
├── page.tsx                    💧 GESTIÓN DIARIA (agua real, consumo actual)
└── planificador/
    └── page.tsx                🧪 EXPERIMENTACIÓN (simulaciones, recomendaciones)
```

### Diferenciación Visual

| Aspecto | 💧 Gestión `/agua` | 🧪 Planificador `/agua/planificador` |
|---------|-------------------|--------------------------------------|
| **Color principal** | Cian (`cyan-600`) | Azul (`blue-600`) |
| **Propósito** | Día a día real | Simulación antes de invertir |
| **Datos** | Plantas/estanques actuales | Hipotéticos (prueba) |
| **Consumo** | Basado en plantas reales | Basado en cultivos potenciales |
| **Entradas agua** | Registro histórico real | No aplica (solo planificación) |
| **Recomendaciones** | No | Sí (viables/no viables) |
| **Target user** | Agricultor en operación | Agricultor planificando inversión |

---

## Tareas Implementadas

### Tarea 1: Crear Página Planificador
**Archivo**: `src/app/agua/planificador/page.tsx` ✅

**Características:**
- Banner azul explicativo: "🧪 Modo Experimentación"
- Panel de recomendaciones completo (cultivos viables/no viables)
- Calculadora de agua anual automática
- Mensajes educativos sobre restricciones
- Enlace directo al mapa para crear zonas de prueba
- Navegación clara a "Gestión" cuando estés listo

**Mensaje al usuario:**
> "Esta herramienta te permite **simular y planificar** antes de invertir dinero real. Prueba diferentes cultivos, calcula cuánta agua necesitarías, y descubre qué es viable para tu terreno."

**Implementación:**
```typescript
export default function PlanificadorAguaPage() {
  // Carga terreno, zonas, plantas, catálogo
  // Usa hooks existentes: useEstanques, useAgua

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600">
        <h1>Planificador de Agua</h1>
        <Link href="/agua">Ir a Gestión</Link>
      </header>

      <main>
        {/* Banner explicativo */}
        <div className="bg-blue-50 border-l-4 border-blue-500">
          🧪 Modo Experimentación
        </div>

        {/* Panel recomendaciones */}
        <RecomendacionPanel
          terreno={terreno}
          estanques={estanques}
          entradasAgua={entradas}
          zonas={zonas}
          plantas={plantas}
          catalogoCultivos={catalogoCultivos}
        />

        {/* Call to action */}
        <Link href="/">Ir al Mapa →</Link>
      </main>
    </div>
  )
}
```

---

### Tarea 2: Mejorar Página Gestión
**Archivo**: `src/app/agua/page.tsx` ✅

**Mejoras:**
- Header actualizado: "Gestión de Agua" (antes: "Control de Agua")
- Banner cian explicativo: "💧 Gestión Diaria del Agua"
- Botón "Planificador" en header
- Enlace al planificador en banner

**Mensaje al usuario:**
> "Monitorea tu agua **actual**, registra entradas reales, y controla el consumo día a día. Este es el seguimiento de tu sistema **en operación**."

**Implementación:**
```typescript
<header className="bg-cyan-600">
  <h1>Gestión de Agua</h1>
  <div className="flex gap-2">
    <Link href="/agua/planificador">Planificador</Link>
    <Link href="/agua/configuracion">Configuración</Link>
  </div>
</header>

<main>
  {/* Banner explicativo */}
  <div className="bg-cyan-50 border-l-4 border-cyan-500">
    💧 Gestión Diaria del Agua
    <Link href="/agua/planificador">Usa el Planificador</Link>
  </div>

  {/* Resumen agua actual */}
  <ResumenAgua ... />

  {/* Registro entradas */}
  <button>+ Registrar Entrada de Agua</button>

  {/* Historial */}
  <PanelEstanques ... />
  <HistorialAgua ... />
</main>
```

---

### Tarea 3: Simplificar Sidebar Mapa
**Archivo**: `src/components/mapa/map-sidebar.tsx` ✅

**Cambios:**
- ❌ **Eliminado**: Tab "Recomendación" (movido a planificador)
- ❌ **Eliminado**: Imports innecesarios (`RecomendacionPanel`)
- ❌ **Eliminado**: Estado `panelTab`, `setPanelTab`
- ✅ **Agregado**: Banner verde con enlace al planificador
- ✅ **Simplificado**: Panel único enfocado en terreno/zonas/plantas

**Beneficio**: Sidebar más limpio, enfocado en editar el mapa

**Implementación:**
```typescript
// Antes: Tabs (Terreno | Recomendación)
<div className="flex border-b">
  <button onClick={() => setPanelTab('terreno')}>Terreno</button>
  <button onClick={() => setPanelTab('recomendacion')}>Recomendación</button>
</div>

// Ahora: Panel único + link planificador
<div className="p-4">
  <ResumenTerreno ... />
  <TerrenoDashboard ... />

  {/* Call to action */}
  <div className="bg-green-50">
    <h3>🧪 ¿Planificando tu cultivo?</h3>
    <p>Usa el Planificador de Agua para descubrir cultivos viables</p>
    <a href="/agua/planificador">Ir al Planificador →</a>
  </div>
</div>
```

---

## Navegación Implementada

### Desde `/agua` (Gestión):
```
Header → Botón "Planificador" (azul)
Banner → Link "Usa el Planificador para simular"
```

### Desde `/agua/planificador` (Experimentación):
```
Header → Botón "Ir a Gestión" (azul)
Card final → Link "Ir al Mapa →"
```

### Desde Mapa (Sidebar):
```
Panel → Banner verde "¿Planificando tu cultivo?" → "Ir al Planificador →"
```

---

## Criterios de Aceptación

- [x] Página `/agua/planificador` creada y funcional
- [x] Panel de recomendaciones muestra cultivos viables/no viables
- [x] Cálculo automático de agua anual funciona
- [x] Página `/agua` mejorada con banner explicativo
- [x] Navegación clara entre ambas páginas (links bidireccionales)
- [x] Sidebar del mapa simplificado (sin tab recomendación)
- [x] Banner en sidebar enlaza al planificador
- [x] Diferenciación visual clara (cian vs azul)
- [x] Mensajes educativos sobre propósito de cada página
- [x] Build compila sin errores TypeScript
- [x] Rutas generadas correctamente en build

---

## Impacto UX

### Antes (Confuso):
```
Mapa → Sidebar → Tab "Recomendación"
                   ↳ ¿Basado en qué? ¿Plantas actuales o hipotéticas?
                   ↳ ¿Para qué sirve exactamente?
                   ↳ ¿Dónde registro agua real?
```

### Ahora (Claro):
```
💧 /agua
   ↳ "Gestión Diaria del Agua"
   ↳ Registro real, consumo actual, historial
   ↳ Link: "¿Quieres planificar? → Planificador"

🧪 /agua/planificador
   ↳ "Modo Experimentación"
   ↳ Recomendaciones, simulaciones, "qué pasaría si..."
   ↳ Link: "¿Listo para gestionar? → Gestión"

🗺️ Mapa
   ↳ Sidebar: "¿Planificando cultivo? → Planificador"
```

---

## Archivos Modificados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/app/agua/planificador/page.tsx` | ✅ Creado | Nueva página experimentación |
| `src/app/agua/page.tsx` | ✏️ Modificado | Mejorado con banner gestión + link planificador |
| `src/components/mapa/map-sidebar.tsx` | ✏️ Modificado | Eliminado tab recomendación + agregado link planificador |

---

## Código de Calidad

- ✅ TypeScript estricto (sin `any`)
- ✅ Componentes funcionales con tipos explícitos
- ✅ Hooks reutilizados (useEstanques, useAgua)
- ✅ Sin duplicación de lógica
- ✅ Nombres descriptivos y semánticos
- ✅ Imports absolutos con `@/`

---

## Testing

### Build Production
```bash
pnpm build
```

**Resultado:**
```
✓ Compiled successfully in 3.6s
  Running TypeScript ...
  Generating static pages using 15 workers (14/14)

Route (app)
├ ○ /agua                    ← Gestión (mejorado)
├ ○ /agua/configuracion
├ ○ /agua/planificador       ← Experimentación (nuevo)
```

**✅ Sin errores TypeScript**
**✅ Todas las rutas generadas correctamente**

---

## Próximas Mejoras Sugeridas

1. **Modo "Comparar Escenarios"**: En planificador, permitir guardar múltiples configuraciones y compararlas
2. **Exportar Plan**: Desde planificador, exportar PDF con recomendaciones
3. **Tutorial Interactivo**: Primera vez que entras, tour guiado "Gestión vs Planificador"
4. **Historial de Simulaciones**: Guardar simulaciones pasadas en IndexedDB
5. **Notificaciones**: Si agua crítica, sugerir ir al planificador para optimizar

---

## Lecciones Aprendidas

1. **UI Segmentada > Tabs Múltiples**: Páginas separadas son más claras que tabs cuando hay contextos muy distintos
2. **Color como señal**: Cian = Real, Azul = Simulación → ayuda visualmente
3. **Mensajes educativos**: Banners explicativos reducen confusión del usuario
4. **Navegación bidireccional**: Links claros en ambas direcciones facilitan flujo
5. **Simplicidad en sidebar**: Eliminar opciones mejora enfoque

---

## Referencias

- Problema original: Confusión entre gestión real y simulación
- Inspiración: Aplicaciones financieras (cuenta real vs simulador de inversión)
- UX Pattern: Context Segmentation (separar flujos de trabajo distintos)

---

## Siguiente Fase

**FASE_12_SUPABASE** - Migración a backend real con Supabase

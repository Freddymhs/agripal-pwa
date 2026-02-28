# Auditoría UX - Recorrido Completo de Usuario Real

**Fecha**: 2026-02-05
**Tipo**: User Journey completo desde registro hasta operación
**Prioridad**: CRÍTICA - Define próximas fases de desarrollo

---

## Resumen Ejecutivo

Un usuario agricultor recorre TODA la aplicación por primera vez. Se documentan bugs, confusiones UX, features faltantes y problemas de confianza en los cálculos.

**Veredicto del usuario**: La app tiene potencial INCREÍBLE pero genera MIEDO por falta de claridad en cálculos y flujos confusos.

---

## 🔴 BUGS ENCONTRADOS

### BUG-01: Plantar en Grilla sobreescribe plantas manuales

**Severidad**: ALTA
**Ubicación**: Zona de cultivo → Plantar en Grilla
**Descripción**: Usuario planta manualmente algunas plantas, luego usa "Plantar en Grilla" esperando que rellene espacios vacíos. En cambio, BORRA todas las manuales y las reemplaza con la grilla.
**Esperado**: Grilla debería respetar plantas existentes o advertir antes de sobreescribir.

### BUG-02: Botón "Registrar Agua" aparece habilitado sin estanques ✅ RESUELTO

**Severidad**: MEDIA
**Ubicación**: /agua → Registrar Agua
**Descripción**: El botón "Registrar Agua" se ve activo pero no funciona sin estanques. "Configurar Recarga" SÍ está deshabilitado. Inconsistencia.
**Esperado**: Ambos botones deshabilitados si no hay estanques, con tooltip explicativo.
**Resolución**: Botón ahora deshabilitado cuando no hay estanques.

### BUG-03: Hora fin de riego no se auto-calcula ✅ RESUELTO

**Severidad**: BAJA
**Ubicación**: Configurar Riego → Programado
**Descripción**: Si usuario elige 6 horas de riego e inicio 06:00, la hora fin no se ajusta automáticamente a 12:00.
**Esperado**: hora_fin = hora_inicio + horas_dia (auto-calculado).
**Resolución**: Hora fin se auto-calcula al cambiar inicio o duración.

### BUG-04: Botón "Plantar X en Grilla" muestra cultivo incorrecto al inicio ✅ RESUELTO

**Severidad**: BAJA
**Ubicación**: Panel zona cultivo → Plantar en Grilla
**Descripción**: El botón dice "Plantar Tuna" cuando el select muestra "Higuera" por defecto.
**Esperado**: Botón refleja el cultivo seleccionado en el dropdown.
**Resolución**: cultivoSeleccionado se sincroniza con catalogoCultivos del proyecto al cargar.

### BUG-05: No se puede seleccionar zona/estanque directamente en modo ZONAS

**Severidad**: MEDIA
**Ubicación**: Mapa principal → Herramientas → Zonas
**Descripción**: Con herramienta ZONAS activa, no se puede clickear directamente un estanque o zona. Hay que clickear área vacía primero, luego la zona.
**Esperado**: Click directo en zona/estanque debería seleccionarla.

### BUG-06: Registrar Agua permite exceder capacidad del estanque ✅ YA MANEJADO

**Severidad**: MEDIA
**Ubicación**: /agua → Registrar Entrada de Agua → Cantidad
**Descripción**: El campo permite ingresar más m³ de los que caben en el estanque.
**Esperado**: Limitar al espacio disponible, o advertir si se excede (con nota de que el excedente se almacena fuera).
**Resolución**: Ya implementado: muestra advertencia amarilla y limita cantidad real a espacio disponible.

### BUG-07: Próxima recarga NO se actualiza al registrar agua ✅ RESUELTO

**Severidad**: ALTA
**Ubicación**: /agua → después de Registrar Entrada
**Descripción**: Al registrar una recarga real, la fecha de "Próxima recarga" no se recalcula. Queda desincronizada.
**Esperado**: Al registrar entrada, el sistema recalcula automáticamente la próxima recarga basándose en la fecha actual + frecuencia.
**Resolución**: registrarEntrada ahora actualiza ultima_recarga y recalcula proxima_recarga automáticamente.

### BUG-08: "Costo agua/año" muestra $0 en panel ROI ✅ RESUELTO

**Severidad**: ALTA
**Ubicación**: Panel zona cultivo → Proyección ROI → Costo agua/año
**Descripción**: A pesar de haber configurado costo de agua en /agua y registrado entradas con costo, el panel muestra $0.
**Esperado**: Calcular costo anual de agua basado en consumo × costo por m³.
**Resolución**: Ahora calcula costo/m³ desde config recarga (costo_recarga / litros) como fallback.

### BUG-09: Alerta "Agua disponible 0.0 m³" incorrecta ✅ RESUELTO

**Severidad**: ALTA
**Ubicación**: Panel principal → Alertas
**Descripción**: Después de configurar agua y estanque, la alerta sigue diciendo 0.0 m³ disponible.
**Esperado**: Debe reflejar el nivel real del estanque.
**Resolución**: Alertas ahora leen nivel real de estanques en vez de terreno.agua_actual_m3.

### BUG-10: m³/semana muestra 0.00 después de configurar todo ⚠️ PARCIALMENTE RESUELTO

**Severidad**: ALTA
**Ubicación**: /agua → Estado del Agua → m³/semana
**Descripción**: Tras configurar estanque, agua, y tener plantas, el consumo semanal sigue en 0.00.
**Esperado**: Mostrar consumo semanal calculado en base a plantas activas.
**Fix parcial**: Se conectó `useActualizarEtapas` que estaba desconectado — las plantas nunca progresaban de etapa, causando Kc incorrecto y consumo subestimado ~50-60%. Requiere verificación del usuario.

---

## 🟡 CONFUSIONES UX (Prioridad por impacto)

### UX-01: Tab "Agua" duplicada en Configuración Avanzada ✅ RESUELTO

**Impacto**: CRÍTICO - Usuario cree que es un BUG
**Descripción**: La Configuración Avanzada del terreno tiene una tab "Agua" con campos similares a /agua. Usuario piensa que llenar estos campos va a romper los datos de /agua.
**Solución**: Eliminar tab "Agua" del modal de config avanzada (igual que hicimos con Suelo). Toda configuración de agua debe estar en /agua.
**Resolución**: Tab Agua eliminada del modal. Config Avanzada ahora tiene: Ubicación, Legal, Distancias, Conectividad, Infraestructura.

### UX-02: "Registrar Agua" vs "Configurar Recarga" - flujo confuso

**Impacto**: ALTO
**Descripción**: Usuario no sabe cuál usar primero. "Registrar Agua" parece ser para agregar agua, pero "Configurar Recarga" es donde se define el tracking. No hay guía de flujo.
**Solución**: Wizard guiado o flujo paso a paso: "1. Configura tu recarga → 2. Registra entradas"

### UX-03: "Planificador" enlaces por todos lados, usuario asustado

**Impacto**: MEDIO
**Descripción**: Links al Planificador aparecen en panel principal y en /agua. Usuario no entiende qué es y lo ignora/teme.
**Solución**: Reducir visibilidad. Solo mostrar en /agua como link secundario, no como CTA principal.

### UX-04: Sistema de Riego per zona - propósito confuso

**Impacto**: ALTO
**Descripción**: Usuario configura riego pero no entiende qué afecta. No ve el "Gasto diario estimado" después de guardar (solo aparece dentro del modal).
**Solución**: Mostrar gasto diario/semanal directamente en el panel de la zona, no solo dentro del modal.

### UX-05: ROI / Punto de Equilibrio - terminología no accesible

**Impacto**: MEDIO
**Descripción**: Usuario no entiende "ROI", "punto de equilibrio". Son términos financieros no familiares para agricultores.
**Solución**: Usar lenguaje simple: "Ganancia estimada", "Recuperas tu inversión en X meses", "Por cada $1 invertido ganas $X".

### UX-06: Cálculos no transparentes - genera desconfianza

**Impacto**: CRÍTICO
**Descripción**: Usuario ve números calculados pero NO sabe de dónde salen. Teme que estén mal y lleven a pérdida económica real.
**Solución**: Agregar tooltips o expandibles "¿Cómo se calcula?" que muestren la fórmula en lenguaje simple.

### UX-07: ISAG 0% Legal en rojo - asusta sin explicar

**Impacto**: BAJO
**Descripción**: Indicador rojo de ISAG sin explicación de qué es ni por qué importa.
**Solución**: Agregar tooltip o texto descriptivo de qué es ISAG y cómo completarlo.

### UX-08: Card morada de "semanas" con símbolo infinito ✅ RESUELTO

**Impacto**: BAJO
**Descripción**: Card que muestra "∞ semanas" no se entiende.
**Solución**: Mostrar "Sin consumo registrado" o esconder si no hay datos.
**Resolución**: Ahora muestra "-" con texto "Sin consumo" en vez de "∞".

---

## 🟢 FEATURES FALTANTES (Prioridad por valor)

### FEAT-01: Recomendación de fecha óptima de recarga

**Valor**: ALTO
**Descripción**: Usuario quiere saber no solo "en X días se acaba" sino "recarga ANTES del día Y para no llegar a 0%".
**Implementación**: `fecha_recarga_recomendada = fecha_actual + dias_restantes - margen_seguridad`

### FEAT-02: Historial de agua filtrable por fechas

**Valor**: ALTO
**Descripción**: Filtrar entradas entre fechas para saber gasto mensual/semanal de agua y costos.
**Implementación**: Agregar filtros de fecha al HistorialAgua component.

### FEAT-03: Gestión de proveedores de agua

**Valor**: MEDIO
**Descripción**: Crear proveedores con nombre, fuente de agua, calidad, precio. Seleccionable al registrar entrada.
**Implementación**: Nueva entidad Proveedor en tipos + CRUD + selector en entrada de agua.

### FEAT-04: Desglose de plantas por tipo en panel principal

**Valor**: ALTO
**Descripción**: Panel muestra "656 plantas total" pero no el desglose: "256 Pitahaya + 400 Higuera".
**Implementación**: Agregar resumen por tipo en ResumenTerreno o TerrenoDashboard.

### FEAT-05: Gasto diario/semanal de riego visible en panel de zona

**Valor**: ALTO
**Descripción**: Después de configurar riego, mostrar gasto estimado SIN necesidad de abrir el modal.
**Implementación**: Ya se tiene el dato, solo falta mostrarlo en el panel.

### FEAT-06: Descuento automático de agua en tiempo real

**Valor**: CRÍTICO
**Descripción**: El estanque no debería quedarse en 100% estático. Debe descontar agua basándose en consumo × tiempo transcurrido.
**Estado**: PARCIALMENTE IMPLEMENTADO en agua-real.ts, verificar que funciona end-to-end.

### FEAT-07: Alerta de agua insuficiente para plantas actuales

**Valor**: CRÍTICO
**Descripción**: "Tu estanque tiene X litros pero tus plantas necesitan Y litros/semana. El agua alcanza para Z días."
**Estado**: PARCIALMENTE IMPLEMENTADO, parece tener bugs (muestra 0.0 m³).

### FEAT-08: Sincronización automática Registrar Agua ↔ Configurar Recarga ✅ RESUELTO

**Valor**: ALTO
**Descripción**: Al registrar una entrada de agua, actualizar automáticamente la fecha de última recarga y recalcular próxima recarga.
**Implementación**: En el handler de registrarEntrada, actualizar también recarga config.
**Resolución**: Implementado en BUG-07 — `registrarEntrada` ahora actualiza `ultima_recarga` y recalcula `proxima_recarga`.

### FEAT-09: Historial de infraestructura (cerco, mejoras)

**Valor**: BAJO
**Descripción**: Registrar cambios en infraestructura del terreno en el tiempo.
**Implementación**: Fase futura.

### FEAT-10: Nivel de señal celular/internet visible en panel

**Valor**: BAJO
**Descripción**: Datos de conectividad son pocos, podrían mostrarse directamente sin abrir modal.
**Implementación**: Fase futura.

---

## 🔵 PROBLEMAS DE CONFIANZA (Los más críticos)

### TRUST-01: "¿Los cálculos están bien?"

**Contexto**: Usuario VE números pero NO SABE si son correctos. Teme pérdida económica real.
**Solución**:

- Tooltips con fórmulas explicadas en lenguaje simple
- Ejemplo: "Consumo semanal = 256 plantas × 2 goteros × 4 L/h × 6 h/día × 7 días × Kc 0.5 = 3.41 m³"
- Botón "Ver detalle del cálculo" que muestre paso a paso

### TRUST-02: "¿Funciona con múltiples estanques?"

**Contexto**: Usuario teme que agregar más estanques rompa cálculos.
**Solución**: Test end-to-end con múltiples estanques. Documentar que sí soporta N estanques.

### TRUST-03: "¿Cada zona tiene su propio panel independiente?"

**Contexto**: Usuario no sabe si los datos del panel son POR ZONA o GLOBAL.
**Solución**: Título claro: "Panel de Zona: MANGOS (200×200m)" en vez de genérico.

### TRUST-04: "¿El agua se descuenta sola?"

**Contexto**: Usuario espera que el nivel baje en tiempo real, no que se quede estático.
**Solución**: Ya implementado en agua-real.ts, verificar que funciona visualmente.

---

## 📊 Flujo Ideal del Usuario (Propuesto)

### Paso 1: Crear Proyecto

```
Nombre: "Pampa San Martín"
Ubicación: "Arica, Chile, 18°21'54.2"S 70°02'30.5"W"
```

### Paso 2: Crear Terreno

```
Nombre: "Lote Norte"
Dimensiones: 400×400m
Ubicación específica: coordenadas del lote
```

### Paso 3: Configurar Contexto (en cualquier orden)

```
/suelo → Textura, pH, salinidad, drenaje
/clima → Verificar datos estáticos, ajustar si necesario
/catalogo → Verificar cultivos disponibles, agregar si necesario
```

### Paso 4: Crear Estanque

```
Mapa → Nueva Zona → Estanque → Capacidad, Material
Estanque → Asignar Fuente de Agua
```

### Paso 5: Configurar Agua

```
/agua → Configurar Recarga → Fecha, cantidad, consumo L/h, frecuencia, costo
```

### Paso 6: Crear Zonas de Cultivo

```
Mapa → Nueva Zona → Cultivo → Dimensiones
Zona → Configurar Riego → Tipo, caudal, horario
Zona → Plantar en Grilla → Cultivo, espaciado
```

### Paso 7: Operar Día a Día

```
/agua → Ver nivel actual, días restantes
/agua → Registrar entrada cuando llega aljibe
Panel zona → Ver consumo, score calidad, ROI
Alertas → Actuar sobre agua crítica, replantas, etc.
```

---

## 🎯 Priorización Sugerida

### Fase Inmediata (Bugs críticos)

1. ~~BUG-07: Próxima recarga no se actualiza~~ ✅
2. ~~BUG-08: Costo agua/año $0~~ ✅
3. ~~BUG-09: Alerta agua 0.0 m³ incorrecta~~ ✅
4. BUG-10: m³/semana 0.00 ⚠️ parcialmente resuelto (useActualizarEtapas conectado)
5. ~~UX-01: Eliminar tab Agua duplicada~~ ✅

### Fase Siguiente (Bugs + UX pendientes)

6. BUG-01: Grilla respeta plantas manuales
7. BUG-05: Click directo en zona/estanque modo ZONAS
8. UX-06: Transparencia de cálculos (tooltips)
9. UX-02: Flujo guiado Registrar/Configurar agua
10. FEAT-01: Fecha recomendada de recarga
11. FEAT-04: Desglose plantas por tipo en panel

### Fase Posterior (Mejoras de valor)

12. UX-04: Gasto riego visible en panel zona
13. UX-05: Lenguaje simple para ROI
14. FEAT-02: Historial filtrable
15. FEAT-03: Gestión proveedores

---

## 💡 Insights Clave del Usuario

1. **MIEDO es la emoción dominante**: El usuario teme que cálculos incorrectos lleven a pérdida económica REAL.
2. **Quiere AUTOMATIZACIÓN**: No quiere trabajo extra de sincronizar datos manualmente entre secciones.
3. **Quiere TRANSPARENCIA**: Necesita ver DE DÓNDE salen los números para confiar.
4. **Ignora features avanzadas**: El Planificador le asusta. Solo quiere lo básico funcionando BIEN.
5. **Valora datos en tiempo real**: Le encanta cuando algo se actualiza solo (como el nivel de agua).
6. **Detecta inconsistencias rápido**: Tab Agua duplicada, $0 en costos, alertas incorrectas.
7. **Piensa en escalabilidad**: Se pregunta si funcionará con múltiples estanques, múltiples zonas.

---

## 🧹 LIMPIEZA DE CÓDIGO MUERTO (2026-02-06)

### Fix Crítico: useActualizarEtapas desconectado

**Impacto**: Las plantas NUNCA progresaban de etapa automáticamente. El Kc se quedaba en valor por defecto (~0.4 plántula) en vez de subir a 1.0+ para plantas adultas. Consumo de agua subestimado ~50-60%.
**Fix**: Conectado `useActualizarEtapas(plantas, catalogoCultivos, cargarDatosTerreno)` en `project-context.tsx`.

### Archivos eliminados

| Archivo                                            | Razón                                 |
| -------------------------------------------------- | ------------------------------------- |
| `src/lib/utils/agua-simulacion.ts`                 | Reemplazado por `agua-real.ts`        |
| `src/components/agua/configurar-recarga-modal.tsx` | Reemplazado por `ConfigurarAguaModal` |
| `src/lib/utils/coordinates.ts`                     | Nunca importado                       |
| `src/components/layout/navbar.tsx`                 | Nunca importado, layout viejo         |
| `src/components/layout/sidebar.tsx`                | Nunca importado, layout viejo         |
| `src/hooks/use-terreno.ts`                         | Reemplazado por `project-context`     |

### Dependencias eliminadas del package.json

`leaflet`, `react-leaflet`, `recharts`, `swr`, `js-yaml`, `idb`, `next-themes`, `zod`, `@types/leaflet`, `@types/js-yaml`

**Resultado**: -48 paquetes de node_modules. Build pasa limpio.

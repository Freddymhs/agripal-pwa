# FASE 23 — Feedback Loop: El Agricultor Sabe Si Va Bien

**Estado:** ⏳ PENDIENTE — dependencias cumplidas, parcialmente iniciada
**Prioridad:** Alta — sin esto la app funciona para el creador, no para el usuario real
**Dependencias:** ✅ FASE_9 (Alertas), ✅ ROI implementado (roi.ts funcional)

> **Progreso al 2026-03-21** (commit `1fa7e6d`):
>
> - ✅ `precio_agua_break_even` implementado en `ProyeccionROI` — Mejora C tiene base
> - ✅ Dual pricing feria/mayorista en `/economia` — Mejora C parcialmente implementada
> - ✅ ROI 10 años via `extenderROI10Años()` — disponible para Mejoras A, C
> - ✅ `KR_POR_AÑO`, `FRACCION_LAVADO`, `FACTOR_EFICIENCIA_RIEGO` como constantes
> - ⏳ Mejora A (ROI inline en zona) — pendiente
> - ⏳ Mejora B (calculadora inversa proveedor) — pendiente
> - ⏳ Mejora C (semáforo `/economia`) — parcial, falta `<SemaforoRoi>` con causa principal
> - ⏳ Mejora D (wizard creación terreno) — pendiente
>   **Estimación:** 4-6 sesiones

---

## El Problema Real

Esta fase nació de una observación honesta: el creador de la app necesitó asistencia de IA, scripts de verificación y múltiples iteraciones para llegar a un proyecto con ROI positivo. Un agricultor real no va a tener eso.

La app tiene toda la inteligencia necesaria — fórmulas ROI con Kr y FL calibradas para Arica, break-even por cultivo, agua máxima tolerable, costos de transporte. Pero esa inteligencia aparece solo en `/economia`, después de que el usuario ya configuró todo. Si el resultado es rojo, el usuario no sabe qué cambiar ni cuánto.

**Analogía que define el problema:**

En un RTS (Starcraft, Age of Empires), uno sabe en tiempo real si tiene supply, si le falta madera, si puede producir. La gestión se hace _con_ información, no a ciegas. El juego te avisa antes de que cometas el error, no después.

Hoy AgriPlan te muestra el resultado solo después. Eso destruye la autonomía del usuario.

---

## Flujo Actual vs Flujo Deseado

**Hoy:**

```
Configura dimensiones del terreno
    ↓
Dibuja zonas en el mapa
    ↓
Configura estanque (capacidad, material)
    ↓
Configura proveedor agua (precio, transporte, litros)
    ↓
Planta cultivos en las zonas
    ↓
Va a /economia
    ↓
Ve ROI rojo o verde — no sabe por qué ni qué cambiar
```

**Deseado:**

```
Elige fuente de agua → sistema muestra costo efectivo y plantas mínimas
    ↓
Dibuja zona → sistema muestra ROI estimado inline mientras dimensionas
    ↓
Planta cultivos → sistema confirma si cantidad es viable o sugiere ajuste
    ↓
Llega a /economia con ROI positivo en su primer intento
```

---

## Variables que Afectan el ROI (y que el usuario modifica sin saberlo)

Todas estas variables existen en la app. Ninguna muestra feedback de consecuencia en el momento de editarlas.

| Variable                                     | Dónde se edita              | Impacto en ROI                                         |
| -------------------------------------------- | --------------------------- | ------------------------------------------------------ |
| Cantidad de plantas en la zona               | Mapa (plantar)              | Directo — más plantas = más ingresos y más agua        |
| Precio del proveedor de agua                 | Config estanque → proveedor | Crítico — determina el break-even                      |
| Costo transporte / litros recarga            | Config estanque → proveedor | Crítico — suma al costo efectivo m³                    |
| Cultivo elegido                              | Zona cultivo panel          | Alto — agua, producción y precio kg varían por cultivo |
| Tipo de riego (goteo vs manual)              | Config riego zona           | Medio — factor eficiencia 80%-100%                     |
| Precio de venta (feria vs mayorista)         | /economia (simulador)       | Alto — afecta todos los ingresos proyectados           |
| Calidad de cosecha (básico/estándar/premium) | /economia                   | Medio — multiplica precio por perfil                   |
| Calidad de suelo (pH, CE, boro)              | /suelo                      | Medio — factorSuelo reduce producción                  |
| Meses desde plantación (Kr)                  | Automático por fecha        | Determinante año 1 vs año 5                            |
| Tolerancia salinidad del cultivo (FL)        | Dato del cultivo en seed    | Aumenta agua bruta necesaria 2-7.5%                    |

---

## Las 3 Capas del Problema

**1. El ROI está aislado en /economia**
El usuario configura en el mapa, en `/agua`, en `/configurar`. El resultado aparece en otro lugar, separado. No hay señal mientras trabajas.

**2. Las variables están desconectadas visualmente**
El precio del transporte vive en la config del estanque. Las plantas viven en el mapa. El precio de venta vive en /economia. Nadie le dice al usuario que esas tres cosas están conectadas y que mover una afecta el resultado de las otras.

**3. No hay umbral mínimo visible**
El usuario no sabe que con 45 plantas de ajo el ROI es positivo y con 30 es negativo. No sabe que subir el transporte de $5,000 a $7,000 destruye la viabilidad de cultivos de bajo precio/kg. Esa información existe calculada en `roi.ts` pero nunca se muestra donde se toma la decisión.

---

## Soluciones: 4 Mejoras Independientes

Cada mejora es implementable por separado. No hay dependencia entre ellas. Ordenadas por impacto / esfuerzo.

---

### Mejora A — ROI Estimado Inline en el Panel de Zona

**Impacto: MUY ALTO | Esfuerzo: MEDIO**

Cuando el usuario selecciona o edita una zona de cultivo en el mapa, mostrar en el panel lateral el ROI estimado calculado en tiempo real.

**Diseño UI:**

```
┌─────────────────────────────────────────┐
│ Ajo Morado · Zona Huerto Norte          │
│ 189 plantas · 0.5 m³/año               │
│                                         │
│ ROI estimado     9,888%  ✅             │
│ Recupera en      1 mes                  │
│ Agua máx tolerable  $37,928/m³         │
│ Inversión        $460                   │
└─────────────────────────────────────────┘
```

Si el ROI es negativo:

```
┌─────────────────────────────────────────┐
│ Orégano · Zona Sur                      │
│ 12 plantas · 0.1 m³/año                │
│                                         │
│ ROI estimado     -82%   ✗               │
│ Causa: muy pocas plantas                │
│ Mínimo para viabilidad: 20 plantas      │
│ Tienes: 12 → agrega 8 más              │
└─────────────────────────────────────────┘
```

**Archivos a modificar:**

- `src/components/mapa/zona-cultivo-panel.tsx` — agregar sección ROI estimado
- Llamar a `calcularROI()` con los datos disponibles en el panel

**Datos ya disponibles en el panel:**

- `zona` — area, tipo riego
- `cultivo` — desde `catalogoCultivos`
- `numPlantasVivas` — ya se calcula
- `costoAguaM3` — desde `terreno.agua_costo_clp_por_m3`

**Lo nuevo:**

- Importar y llamar `calcularROI()` desde `src/lib/utils/roi.ts`
- Componente `<RoiEstimadoZona>` que renderiza el resultado
- Lógica de "mínimo de plantas para viabilidad": iterar `calcularROI()` con plantas crecientes hasta ROI > 0

**No requiere:** nuevas tablas, nuevos hooks, nuevas rutas.

---

### Mejora B — Calculadora Inversa en Config del Proveedor de Agua

**Impacto: ALTO | Esfuerzo: MEDIO**

Cuando el usuario configura precio del proveedor + costo transporte + litros de recarga, mostrar en tiempo real el costo efectivo resultante y su impacto en todos los cultivos del terreno.

**Diseño UI (dentro del modal ConfigurarAguaModal o ConfigurarRiegoModal):**

```
Precio agua:        $2,000 /m³
Costo transporte:   $6,438 por viaje
Litros por viaje:   1,500 L

────────────────────────────────────
Costo efectivo:  $6,292 /m³

Con este precio, mínimo de plantas para ROI positivo:
  Ajo Morado      45 plantas    tienes 189  ✅ ×4.2
  Tomate Cherry   30 plantas    tienes 48   ✅ ×1.6
  Orégano         20 plantas    tienes 64   ✅ ×3.2
  Ají/Pimiento    55 plantas    tienes 48   ✗ faltan 7
────────────────────────────────────
```

Si el usuario sube el precio del transporte, los mínimos cambian en tiempo real.

**Fórmula del costo efectivo (ya existe en `roi.ts`):**

```typescript
// obtenerCostoAguaM3() — src/lib/utils/roi.ts:72
const costoEfectivo = precioM3 + costoTransporte / (litros / 1000);
```

**Archivos a modificar:**

- `src/components/agua/configurar-agua-modal.tsx` — agregar sección "Impacto en cultivos"
- Calcular `precioAguaBreakEven` por cultivo usando `calcularROI()` con costo variable

**Lógica nueva:**

```typescript
// Para cada cultivo activo en el terreno:
// calcular cuántas plantas mínimas necesita con este costoAguaM3
function calcularMinimoPlantasParaViabilidad(
  cultivo: CatalogoCultivo,
  zona: Zona,
  costoAguaM3: number,
): number {
  for (let n = 1; n <= 10000; n++) {
    const roi = calcularROI(cultivo, zona, n, costoAguaM3);
    if (roi.roi_5_años_pct > 0) return n;
  }
  return Infinity; // cultivo no viable con este precio de agua
}
```

**No requiere:** nuevas tablas, nuevas rutas.

---

### Mejora C — Semáforo Explicativo en /economia

**Impacto: ALTO | Esfuerzo: BAJO**

En lugar de solo mostrar el número de ROI, mostrar la causa principal del problema y la palanca más efectiva para corregirlo.

**Diseño UI (debajo de las tarjetas de cultivo en /economia):**

Para ROI negativo:

```
┌──────────────────────────────────────────────────────────┐
│ ✗ Ají / Pimiento — ROI -340%                            │
│                                                          │
│ Causa principal: costo agua muy alto para este cultivo   │
│                                                          │
│ Para llegar a ROI positivo, elige una opción:           │
│   • Bajar precio agua de $8,200 a $6,100/m³  (-26%)    │
│   • Agregar 35 plantas más (tienes 48 → necesitas 83)  │
│   • Vender a precio feria en lugar de mayorista         │
│                                                          │
│ Agua máxima tolerable: $5,890/m³                        │
└──────────────────────────────────────────────────────────┘
```

Para ROI positivo pero bajo:

```
┌──────────────────────────────────────────────────────────┐
│ ✅ Tomate Cherry — ROI 340% · Recupera en 8 meses       │
│                                                          │
│ Si vendieras a precio feria: ROI 580% · 5 meses        │
│ Si agregaras 20 plantas más: ROI 460% · 6 meses        │
└──────────────────────────────────────────────────────────┘
```

**Datos ya calculados en `ProyeccionROI`:**

- `roi_5_años_pct` — para determinar si positivo/negativo
- `precio_agua_break_even` — agua máxima tolerable (ya existe)
- `punto_equilibrio_meses` — recuperación

**Lo nuevo:**

- Lógica para identificar causa principal (comparar `costoAguaM3` vs `precio_agua_break_even`)
- Calcular ROI con precio feria vs mayorista para mostrar alternativa
- Calcular mínimo de plantas para viabilidad (misma función que Mejora A)
- Componente `<SemaforoRoi roi={roi} costoAgua={costoAgua} />` en `/economia/page.tsx`

**Archivos a modificar:**

- `src/app/(app)/economia/page.tsx` — agregar `<SemaforoRoi>` por cultivo
- `src/components/economia/semaforo-roi.tsx` — componente nuevo

---

### Mejora D — Wizard Guiado al Crear Terreno Nuevo

**Impacto: MUY ALTO | Esfuerzo: ALTO**

En lugar de un mapa vacío sin instrucciones, un wizard de 4 pasos que lleva al usuario desde cero hasta un proyecto viable.

**Flujo:**

```
Paso 1 — ¿Cómo vas a conseguir el agua?
  [ Porter / camión ]   → precio base + transporte → costo efectivo calculado
  [ Aljibe propio ]     → costo por llenado        → costo efectivo calculado
  [ Canal / pozo ]      → precio fijo              → costo efectivo calculado

  Sistema muestra:
  "Con este precio ($6,292/m³) puedes tener:
   · Ajo: rentable desde 45 plantas
   · Tomate: rentable desde 30 plantas
   · Orégano: rentable desde 20 plantas"

────────────────────────────────────

Paso 2 — ¿Cuánto espacio tienes disponible?
  [ ancho ] × [ alto ] metros

  Sistema muestra:
  "Con 20×12m puedes tener:
   · Ajo (0.15m):    ~1,100 plantas (espacio para 3 zonas)
   · Tomate (0.5m):  ~800 plantas
   · Orégano (0.4m): ~500 plantas"

────────────────────────────────────

Paso 3 — ¿Qué quieres plantar?
  Top cultivos recomendados para tu agua + espacio:

  ┌─────────────────────────────────────────┐
  │ ★ Ajo Morado       ROI ~4,800%  1 mes  │
  │   189 plantas · $4,070/kg feria         │
  ├─────────────────────────────────────────┤
  │ ★ Tomate Cherry    ROI ~3,100%  4 mes  │
  │   48 plantas · $1,950/kg feria          │
  ├─────────────────────────────────────────┤
  │   Orégano          ROI ~997%   16 mes  │
  │   64 plantas · $15,000/kg feria         │
  └─────────────────────────────────────────┘

────────────────────────────────────

Paso 4 — Vista previa antes de crear
  ROI estimado del proyecto:    2,320%
  Inversión inicial:            $32,527
  Recuperas en:                 3 meses
  Costo real agua:              $6,292/m³
  Agua anual estimada:          5.6 m³

  [ Crear proyecto ] [ Ajustar ]
```

**Archivos nuevos:**

- `src/app/(app)/terrenos/nuevo/page.tsx` — wizard de creación
- `src/components/terreno/wizard/paso-agua.tsx`
- `src/components/terreno/wizard/paso-espacio.tsx`
- `src/components/terreno/wizard/paso-cultivos.tsx`
- `src/components/terreno/wizard/paso-preview.tsx`

**Archivos a modificar:**

- `src/components/terreno/selector-terreno.tsx` — botón "Nuevo terreno" apunta al wizard
- `src/lib/utils/roi.ts` — exponer helper `calcularMinimoPlantasParaViabilidad()`
- `src/lib/dal/catalogo.ts` — query de cultivos ordenados por ROI para un costo de agua dado

**No requiere:** nuevas tablas ni migraciones. Usa la misma lógica de creación de terreno existente.

---

## Prioridad de Implementación

| Orden | Mejora                               | Por qué primero                                                     |
| ----- | ------------------------------------ | ------------------------------------------------------------------- |
| 1     | C — Semáforo en /economia            | Mínimo esfuerzo, máximo impacto inmediato. Usa datos ya calculados. |
| 2     | A — ROI inline en zona               | Feedback donde el usuario está trabajando.                          |
| 3     | B — Calculadora inversa en proveedor | Cierra el loop del precio del agua.                                 |
| 4     | D — Wizard creación terreno          | Mayor esfuerzo, pero el más transformador para usuarios nuevos.     |

---

## Funciones Existentes que Esta Fase Reutiliza

Todo el cálculo ya existe. Esta fase solo expone los resultados en el lugar correcto.

| Función                         | Archivo                             | Usada en                  |
| ------------------------------- | ----------------------------------- | ------------------------- |
| `calcularROI()`                 | `src/lib/utils/roi.ts`              | Mejoras A, B, C, D        |
| `obtenerCostoAguaM3()`          | `src/lib/utils/roi.ts`              | Mejoras B, D              |
| `calcularAguaPromedioHaAño()`   | `src/lib/utils/helpers-cultivo.ts`  | Mejoras A, D              |
| `calcularPlantasPorHa()`        | `src/lib/utils/helpers-cultivo.ts`  | Mejoras A, D              |
| `KR_POR_AÑO`, `FRACCION_LAVADO` | `src/lib/constants/conversiones.ts` | Implícito via calcularROI |
| `precio_agua_break_even`        | Campo de `ProyeccionROI`            | Mejora C                  |
| `punto_equilibrio_meses`        | Campo de `ProyeccionROI`            | Mejoras A, C              |

---

## Criterios de Aceptación

### Mejora A (ROI en panel de zona)

- [ ] Al seleccionar zona con cultivo plantado, el panel muestra ROI estimado
- [ ] ROI positivo se muestra en verde con meses de recuperación
- [ ] ROI negativo se muestra en rojo con plantas mínimas necesarias
- [ ] El cálculo usa el costo de agua real del proveedor configurado del estanque vinculado
- [ ] Si no hay proveedor configurado, muestra aviso "configura el agua primero"

### Mejora B (calculadora inversa proveedor)

- [ ] Al editar precio, transporte o litros en la config del proveedor, el costo efectivo actualiza en tiempo real
- [ ] Se muestran los cultivos activos del terreno con sus mínimos de plantas
- [ ] Los cultivos con cantidad insuficiente se marcan en rojo
- [ ] Los cultivos con cantidad suficiente se marcan en verde con ratio (tienes ×N el mínimo)

### Mejora C (semáforo en /economia)

- [ ] Cultivos con ROI negativo muestran causa principal identificada
- [ ] Se muestra el agua máxima tolerable (`precio_agua_break_even`)
- [ ] Se muestra la cantidad mínima de plantas para viabilidad
- [ ] Se muestra qué pasaría con precio feria vs mayorista
- [ ] Cultivos con ROI positivo muestran el "siguiente nivel" (qué mejoraría el ROI más)

### Mejora D (wizard)

- [ ] El botón "Nuevo terreno" abre el wizard en lugar del mapa vacío
- [ ] Paso 1 calcula costo efectivo en tiempo real al ingresar precio y transporte
- [ ] Paso 3 muestra los 3 mejores cultivos ordenados por ROI para ese costo de agua
- [ ] Paso 4 muestra ROI consolidado del proyecto antes de crear
- [ ] Al finalizar el wizard, el terreno se crea con agua ya configurada y zonas pre-llenadas

---

## Lo que Esta Fase NO Es

- No es rediseñar /economia desde cero
- No es cambiar la fórmula del ROI (ya es correcta)
- No es agregar datos nuevos — es mostrar datos existentes en el lugar correcto
- No es un dashboard nuevo — es feedback contextual donde el usuario ya está
- No requiere nuevas tablas ni migraciones SQL

---

## Condición de Éxito Final

Un usuario nuevo, sin asistencia de IA, sin leer documentación, puede:

1. Crear un terreno nuevo con el wizard
2. Ver el impacto de su precio de agua antes de comprometerse
3. Plantar cultivos y ver el ROI estimado inline en el mapa
4. Ajustar una variable (precio agua, cantidad plantas, cultivo) y ver el efecto inmediato
5. Llegar a `/economia` y encontrar confirmación de lo que ya sabía, no una sorpresa

**Esta es la última fase planeada del producto.** Representa el salto de "herramienta que funciona" a "herramienta que enseña".

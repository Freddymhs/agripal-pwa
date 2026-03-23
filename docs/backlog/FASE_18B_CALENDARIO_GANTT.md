# FASE 18B — Calendario Gantt Agrícola (Vista 12 Meses)

**Estado:** IMPLEMENTADA (núcleo funcional) / Refinamiento visual pendiente
**Prioridad:** Media-Alta — transforma datos existentes en inteligencia operativa real
**Dependencias:** FASE_16 (Cosechas), FASE_18 (Calendario base), ROI funcional
**Ruta:** `/gantt`
**Entrada en menú:** Analizar → Calendario Gantt

---

## Qué Es

Una página exclusiva de vista anual — los 12 meses como columnas — donde cada cultivo activo del terreno aparece como una barra horizontal que muestra su ciclo completo:

- desde cuándo se plantó y en qué etapa está hoy
- cuándo viene la primera cosecha (y si es de formación/poda sin ingreso)
- cuántas cosechas hay en el año con ingreso estimado feria vs mayorista
- el total de cosechas en toda la vida útil de la planta
- si al morir se resiembra, se compra planta nueva, o el pie rebrota

No es un calendario de días. Es un **Gantt agrícola orientado a meses** que complementa `/economia` dando el _cuándo_ con el mismo ROI que ya calculamos.

---

## Diseño Visual

```
◄ 2025          [ 2026 ]          2027 ►        Agua: $6,292/m³  [ Feria ] [Mayorista]

                ENE  FEB  MAR  ABR  MAY  JUN  JUL  AGO  SEP  OCT  NOV  DIC    Total
                ──────────────────────────────────────────────────────────────────────
● AJO MORADO                                                                   $85,400
  Zona Huerto   [░░░░░░░ establecimiento ░░░░░░░] [████ producción ████]
  ◆×3  anual   [■ plantado]                                    [◆ cosecha①]
                ABR                                             OCT  ~$85k

● PITAHAYA                                                                        —
  Zona Este     [░░░░░░░░░░░░░░░░░ año 1 sin cosecha ···
  ◆×14  pie    [■ plantado]
                ENE  joven                                           sin cosecha año 1

● HIGUERA                                                                     $42,000
  Zona Norte    [─── dormición ─── ] [████ producción ████] [─── dormición ─── ]
  ◆×28  pie    (desde 2024)         [◆ cosecha①]
                                     AGO  ~$42k

──────────────────────────────────────────────────────────────────────────────────────
INGRESOS        $0   $0   $0   $0   $0   $0   $0  $42k $85k  $0   $0   $0   $127k
```

**Leyenda de la barra segmentada:**
| Segmento | Color | Significado |
|---|---|---|
| `░░░ establecimiento` | Color zona × 15% opacidad, borde punteado | Plántula/joven — consume agua, no produce |
| `▓▓▓ formación` | Naranja × 25% opacidad | Primera cosecha descarte (poda formativa) |
| `███ producción` | Color zona × 85% opacidad sólida | Cosechas con ingreso activas |
| `─── dormición` | Gris × 18% opacidad | meses_descanso del catálogo |
| Color zona × 30% | Normal entre eventos | Crecimiento activo sin cosecha ese mes |

**Chips sobre la barra:**
| Chip | Color | Evento |
|---|---|---|
| `■` verde | Plantación real | Fecha de inicio |
| `◆` amarillo | Cosecha proyectada | Con ingreso estimado |
| `◆●` azul | Cosecha real registrada | Datos reales de Cosecha[] |
| `✂` naranja | Formación/poda | Primera cosecha descarte |
| `↺` violeta | Replanta/fin de ciclo | Con label de PropagacionTipo |

---

## PropagacionTipo — Derivado Sin Migración

**Fuente:** campo `vida_util_años` existente en `CatalogoCultivo` (siempre poblado).

```typescript
export type PropagacionTipo =
  | "anual_semilla" // vida <= 1: ajo, cebolla, zapallo, quinoa...
  | "perenne_nueva_planta" // vida 2-8: maracuyá, orégano, ají
  | "perenne_pie"; // vida >= 9: tuna, higuera, granada, olivo...
```

**Distribución en los 28 cultivos actuales:**

- `anual_semilla` (9): Ajo, Cebolla, Zapallo, Camote, Quinoa, Melón, Sandía, Choclo, Tomate
- `perenne_nueva_planta` (3): Maracuyá (8a), Orégano (6a), Ají (2a)
- `perenne_pie` (16): Tuna (25a), Higuera (30a), Pitahaya (15a), Guayaba (25a), Dátil (60a), Uva (20a), Limón (35a), Mandarina (30a), Arándano (12a), Lúcuma (40a), Granada (30a), Zapote (35a), Olivo (50a), Algarrobo (80a), Mango (40a), Romero (10a)

**UI:** chips debajo del nombre en la columna izquierda:

- `anual` (lime) | `perenne` (amber) | `pie` (emerald)
- Con tooltip explicando el método de replante específico

---

## meses_descanso — Estado Actual

**85.7% de cultivos (24/28) tienen datos reales** de meses_descanso en el seed.
**4 sin datos** (Orégano, Romero, Choclo, Tomate): en estos casos el segmento "dormición" no aparece (correcto — no tienen pausa estacional real).

Ejemplos reales:

- Uva Mesa Primor: `[2,3,4,5,6,9,10]` — 7 meses de dormición (caducifolio)
- Mandarina: `[10,11,12,1,2,3,4,5]` — 8 meses de baja actividad
- Dátil Medjool: `[1,5,6,7,8,12]`
- Tuna: `[5,6,7,8,11]`

---

## Total Cosechas en Vida

Calculado como:

```typescript
const mesesProductivos = Math.max(
  0,
  vida_util_años * 12 - tiempo_produccion_meses,
);
const cosechasTotales = Math.floor((mesesProductivos / 12) * cosechasPorAño);
```

Ejemplos:

- Ajo (vida=1, tiempo_prod=6, 1 cosecha/año): **1 cosecha en vida**
- Tuna (vida=25, tiempo_prod=36, 3 cosechas/año): **~66 cosechas en vida**
- Higuera (vida=30, tiempo_prod=36, 1 cosecha/año): **~27 cosechas en vida**
- Dátil (vida=60, tiempo_prod=60, 1 cosecha/año): **~55 cosechas en vida**

Mostrado como chip `◆×N` junto al nombre del cultivo.

---

## Inventario Completo de Reutilización

### Funciones existentes usadas directamente

| Función                      | Archivo              | Uso                                                 |
| ---------------------------- | -------------------- | --------------------------------------------------- |
| `calcularROI()`              | `roi.ts`             | ROI feria + mayorista por zona (incluye Kr por año) |
| `extenderROI10Años()`        | `roi.ts`             | Plurianuales                                        |
| `obtenerCostoAguaPromedio()` | `roi.ts`             | Costo efectivo agua                                 |
| `calcularEtapaActual()`      | `calculos-etapas.ts` | Etapa y label sobre barra                           |
| `getDiasRestantesEtapa()`    | `calculos-etapas.ts` | Días restantes para tooltip                         |
| `calcularConsumoZona()`      | `agua.ts`            | Consumo para ROI                                    |
| `cosechasDAL.getByZonaIds()` | `dal/cosechas.ts`    | Cosechas reales                                     |
| `KR_POR_AÑO`                 | `conversiones.ts`    | Mostrar Kr en tooltip                               |
| `FRACCION_LAVADO`            | `conversiones.ts`    | Ya aplicado en calcularROI                          |
| `filtrarEstanques()`         | `helpers-cultivo.ts` | Estanques para costo agua                           |

### Datos del catálogo usados

| Campo                       | Uso                                               |
| --------------------------- | ------------------------------------------------- |
| `vida_util_años`            | PropagacionTipo + total cosechas + barra `···`    |
| `tiempo_produccion_meses`   | Mes de primera cosecha + segmento establecimiento |
| `calendario.meses_cosecha`  | Qué meses tienen cosecha en el año                |
| `calendario.meses_descanso` | Segmento dormición en la barra                    |
| `calendario.meses_siembra`  | Badge ⚠ fuera de temporada                        |
| `cultivo_base_id`           | Lookup precio mayorista (igual que /economia)     |

### Nuevas funciones creadas en `calendario-gantt.ts`

| Función                       | Qué hace                                      |
| ----------------------------- | --------------------------------------------- |
| `buildFilasGantt()`           | Construye FilaGantt[] para el año dado        |
| `derivarPropagacion()`        | PropagacionTipo desde vida_util_años (sin BD) |
| `calcularTotalCosechasVida()` | Cosechas productivas en toda la vida útil     |
| `calcularSegmentosEnAño()`    | SegmentoBarra[] con fase por mes              |
| `estiloFase()`                | backgroundColor + opacity por FaseBarra       |
| `calcularTotalesPorMes()`     | Suma ingresos por mes para fila totales       |

---

## Componentes Implementados

| Componente                                    | Descripción                                               |
| --------------------------------------------- | --------------------------------------------------------- |
| `src/app/(app)/gantt/page.tsx`                | Página — carga cosechas, nav año, toggle feria/mayorista  |
| `src/components/calendario/gantt-fila.tsx`    | Fila: nombre + chips propagacion/cosechas + barra + total |
| `src/components/calendario/gantt-barra.tsx`   | Barra segmentada + chips de eventos + tooltips            |
| `src/components/calendario/gantt-totales.tsx` | Totales por mes con mini-barras + total anual             |
| `src/lib/utils/calendario-gantt.ts`           | Toda la lógica de construcción y derivación               |

---

## Tooltip al Hover sobre Cosecha (click en mobile)

```
◆ cosecha① — Agosto 2026
─────────────────────────────────────────
Etapa hoy:    adulta (45d para madura)
Año cultivo:  2° · Kr ×0.40
─────────────────────────────────────────
Kg estimado:  42 kg
Precio/kg:    $2,990
Feria:        ~$125,780
Mayorista:    ~$77,490
─────────────────────────────────────────
Cosechas en vida:  27 cosechas
```

Si hay cosecha real registrada:

```
─────────────────────────────────────────
Real registrada: 38 kg
Venta real:      $116,000
```

Tooltip en `↺ replanta`:

```
Higuera — Zona Norte · Replanta 2031
─────────────────────────────────────────
Poda renovación: El pie sobrevive. Solo
poda de renovación necesaria.
Cosechas en vida: 27 cosechas
```

---

## Navegación y Controles

```
◄ 2025    [ 2026 ]    2027 ►    Agua: $6,292/m³
[ Feria ] [ Mayorista ]    ◆● 3 cosechas reales
```

- Navegar por año con `◄ ►`
- Toggle precio feria vs mayorista (todos los ingresos cambian en tiempo real)
- Indicador de cosechas reales cargadas desde BD

---

## Casos Especiales Manejados

| Caso                                       | Comportamiento                                   |
| ------------------------------------------ | ------------------------------------------------ |
| Sin fecha de plantación                    | Fila gris "sin fecha — configura en el mapa"     |
| Año 1 sin cosecha (pitahaya, olivo, dátil) | Barra completa sin ◆, sin ingreso                |
| Primera cosecha es poda (`kg_año1 = 0`)    | Chip `✂ formación` sin ingreso, segmento naranja |
| Cultivo anual (ajo, tomate)                | Barra sin `···`, chip `↺` al final del año       |
| Plantado antes del año mostrado            | Barra empieza ENE con etiqueta etapa             |
| Continúa el año siguiente                  | Barra termina DIC con `→` en label               |
| Siembra fuera de temporada                 | `⚠` junto al nombre                              |
| Sin proveedor agua                         | `$?` en total, tooltip explica                   |
| Cosecha real registrada                    | Chip `◆●` azul con datos reales en tooltip       |
| meses_descanso vacío                       | No aparece segmento dormición (correcto)         |

---

## Sin Migraciones Requeridas

Todo funciona con los campos actuales de la BD:

- `vida_util_años` → PropagacionTipo (derivado en cliente)
- `calendario.meses_descanso` → segmento dormición (ya en JSONB `datos`)
- `calendario.meses_cosecha` → meses de cosecha en el año
- `tiempo_produccion_meses` → mes de primera cosecha
- `precio_actual_clp` + `factor_precio_feria` → precios duales

---

## Lo que Esta Fase NO Hace

- No permite editar fechas desde el Gantt — solo lectura
- No muestra días exactos dentro del mes — granularidad mensual
- No reemplaza FASE_18 (ese calendario es para alertas y agua día a día)
- No reemplaza `/economia` (ese muestra ROI acumulado, el Gantt muestra el cuándo)
- No crea nuevas tablas ni migraciones

---

## Criterios de Aceptación

- [x] Los 12 meses del año se ven en una sola pantalla como columnas
- [x] Cada zona con cultivo aparece como fila con barra horizontal coloreada
- [x] La barra está segmentada por fase: establecimiento / formación / producción / dormición
- [x] La barra empieza en el mes real de plantación (ENE si fue año anterior)
- [x] Se muestra la etapa actual con días restantes en el tooltip
- [x] La primera cosecha de formación tiene chip ✂ sin ingreso
- [x] Cosechas siguientes muestran ingreso estimado feria y mayorista
- [x] Toggle feria / mayorista cambia todos los ingresos en tiempo real
- [x] Cultivos en año sin cosecha muestran barra completa sin ◆
- [x] Cosechas reales registradas aparecen como ◆● azul con datos reales
- [x] Tooltip click: kg, precio, Kr aplicado, feria/mayorista, cosechas en vida
- [x] Tooltip replanta: descripción PropagacionTipo + cosechas totales en vida
- [x] Chip `◆×N` debajo del nombre: total cosechas en vida útil
- [x] Chip `anual` / `perenne` / `pie` con color semántico
- [x] Fila de totales al pie: mini-barras proporcionales + total anual
- [x] Navegación por año (`◄ 2025 / 2026 / 2027 ►`) funciona
- [x] Zona sin fecha aparece en gris con aviso de configuración
- [x] Siembra fuera de temporada muestra ⚠
- [x] Sin proveedor agua: ingresos como $?

---

## Mejoras Futuras (No FASE 18B)

- **Raleo (thinning):** chip naranja en primer mes post-floración (`nutricion_por_etapa`)
- **Tratamiento post-cosecha:** chip café 2-4 semanas después de cada cosecha
- **Sucesión automática:** al terminar ciclo, mostrar sugerencia de qué plantar a continuación
- **Exportar a PDF:** incluir el Gantt en el reporte PDF de `/reportes`
- **Vista multi-terreno:** comparar calendarios de distintos terrenos en la misma pantalla

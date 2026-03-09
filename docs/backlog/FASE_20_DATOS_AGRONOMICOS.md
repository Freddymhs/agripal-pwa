# FASE_20 — Datos Agronómicos Enriquecidos

**Estado:** ✅ Completada
**Prioridad:** Alta
**Fecha:** 2026-03-08

---

## Objetivo

Enriquecer el catálogo de cultivos con datos agronómicos de mayor profundidad, conectarlos al sistema de alertas existente y agregar correctores de micronutrientes para suelos alcalinos.

---

## Cambios Implementados

### 3a. `data/static/cultivos/arica.json`

Campos nuevos agregados a los cultivos: **olivo, higuera, tuna, guayaba rosada**.

| Campo                 | Tipo                 | Descripción                                           |
| --------------------- | -------------------- | ----------------------------------------------------- |
| `nutricion_por_etapa` | `NutricionEtapa[]`   | N, P, K en kg/ha por etapa de crecimiento con timing  |
| `poda`                | `PodaCultivo[]`      | Tipos de poda, época y técnica por especie            |
| `propagacion`         | `PropagacionCultivo` | Método principal de multiplicación                    |
| `veceria`             | `VeceriaCultivo`     | Solo olivo e higuera: susceptibilidad y manejo        |
| `alelopatia`          | `AlelopatiaCultivo`  | Solo olivo: cultivos incompatibles y distancia mínima |

### 3b. `data/static/suelo/enmiendas.json`

Agregados 3 quelatos para corrección de micronutrientes en suelos alcalinos (pH > 7.5):

- **Fe-EDTA 13%** — corrige clorosis férrica
- **Zn-EDTA 15%** — corrige hoja pequeña en cítricos/olivo
- **Mn-EDTA 13%** — corrige clorosis interveinal en adultas

Campos nuevos en estos items: `micronutriente`, `concentracion_pct`, `dosis_foliar_g_l`, `ph_maximo_eficacia`.

### 3c. `src/lib/utils/alertas.ts`

4 nuevas alertas integradas en `generarAlertas()`:

| Tipo                          | Severidad | Condición                                                     |
| ----------------------------- | --------- | ------------------------------------------------------------- |
| `fertilizacion_etapa`         | info      | Planta en etapa con datos `nutricion_por_etapa`               |
| `deficiencia_micronutrientes` | warning   | pH suelo > 7.5                                                |
| `alelopatia_riesgo`           | warning   | Cultivos incompatibles en misma zona                          |
| `veceria_riesgo`              | info      | Planta en etapa madura con vecería susceptibilidad alta/media |

Función auxiliar `generarAlertasIncompatibilidadQuimica()` exportada (usada en FASE_21).

### 3d. `src/types/index.ts`

Tipos nuevos:

- `TipoAlerta` — extendido con 5 nuevos valores
- `NutricionEtapa`, `PodaCultivo`, `PropagacionCultivo`, `VeceriaCultivo`, `AlelopatiaCultivo`
- `InsumoCompatibilidad`, `IncompatibilidadQuimica`, `MatrizCompatibilidad`, `InsumoUsuario`

---

## Archivos Modificados

- `data/static/cultivos/arica.json`
- `data/static/suelo/enmiendas.json`
- `src/lib/utils/alertas.ts`
- `src/types/index.ts`

---

## Notas

- Los campos nuevos en el JSON son opcionales — cultivos sin ellos siguen funcionando.
- El tipo `CatalogoCultivo` no fue modificado (los campos extras pasan como `unknown`). La lógica de alertas usa casting seguro `as CatalogoCultivo & { nutricion_por_etapa?: ... }`.
- Prioridad para próximas iteraciones: agregar `nutricion_por_etapa` al resto de los 10 cultivos.

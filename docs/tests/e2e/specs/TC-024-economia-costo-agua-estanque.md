# TC-024 — Economía: costo agua lee `estanque_config.costo_por_m3` correctamente

## Contexto

La página `/economia` calculaba `costoAguaM3 = 0` aunque el estanque tuviera
`estanque_config.costo_por_m3 = 2500` en IndexedDB. Esto causaba que el ROI mostrara
"Excelente rentabilidad" sin incluir el costo real del agua.

### Root Cause

- `EstanqueConfig` en `src/types/index.ts` no tenía el campo `costo_por_m3`.
- `obtenerCostoAguaPromedio` en `src/lib/utils/roi.ts` no leía ese campo.

### Fix aplicado

1. `src/types/index.ts` — se agregó `costo_por_m3?: number` a `EstanqueConfig`:

```typescript
export interface EstanqueConfig {
  capacidad_m3: MetrosCubicos;
  nivel_actual_m3: MetrosCubicos;
  fuente_id?: string;
  costo_por_m3?: number; // ← ADDED
  // ...
}
```

2. `src/lib/utils/roi.ts` — `obtenerCostoAguaPromedio` usa `costo_por_m3` como fallback:

```typescript
const costo =
  obtenerCostoAguaM3(fuente, terreno, est.estanque_config?.recarga) ||
  est.estanque_config?.costo_por_m3 ||
  0;
```

### Prioridad de costo agua (fuente → terreno → recarga → costo_por_m3 directo)

```
fuente.costo_m3_clp
  → terreno.agua_costo_clp_por_m3
    → recarga: costo_recarga_clp / (cantidad_litros / 1000)
      → estanque_config.costo_por_m3
```

## Precondiciones

- Terreno con al menos 1 estanque configurado
- `estanque_config.costo_por_m3` > 0 en IndexedDB (verificar con `window.__agriplanDb__`)
- Al menos 1 zona de cultivo con plantas vivas

## Pasos

1. Navegar a `http://localhost:3000/economia`
2. Verificar que el card "Costo Agua/año" muestra un valor > $0
3. Verificar que NO aparece el warning naranja "Costo del agua no configurado"
4. Abrir DevTools → Application → IndexedDB → AgriPlanDB → zonas
5. Buscar la zona tipo `estanque`, revisar `estanque_config.costo_por_m3`
6. Calcular manualmente: `consumo_semanal_m3 * 52 semanas * costo_por_m3`
7. Comparar con el valor mostrado en pantalla (tolerancia ±5% por redondeos)

## Verificación manual (terreno Oasis Piloto TC012)

```
Consumo semanal: 3.27 m³/sem (verificado en TC-013)
Costo por m³: $2.500 CLP (estanque_config.costo_por_m3)
Costo anual: 3.27 × 52 × 2500 = $425.100 CLP/año
Pantalla muestra: $424.575 ≈ ✅ (diferencia por redondeo de plantas)
```

## Criterios de éxito

- [ ] `Costo Agua/año` muestra valor > $0
- [ ] Warning naranja NO aparece (cuando hay costo configurado)
- [ ] El valor es matemáticamente correcto respecto a IDB
- [ ] ROI refleja el costo del agua (no muestra "excelente" cuando el agua es cara)

## Caso adicional — warning cuando costo = 0

Si se quiere verificar el warning:

1. Crear un terreno sin `costo_por_m3` y sin fuente ni `agua_costo_clp_por_m3`
2. Navegar a `/economia`
3. Verificar que aparece el banner naranja con mensaje de configuración

## Evidencia de verificación

- Fecha: 2026-03-10
- Resultado: Costo Agua/año = `$424.575`, ROI = -294% (antes mostraba ROI positivo con agua $0)
- Estado: ✅ PASS

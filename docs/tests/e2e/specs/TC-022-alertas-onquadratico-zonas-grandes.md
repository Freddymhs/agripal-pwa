# TC-022 — Alertas O(n²): zonas grandes no bloquean el hilo principal

## Metadata

| Campo     | Valor                                                   |
| --------- | ------------------------------------------------------- |
| ID        | TC-022                                                  |
| Feature   | Sistema de alertas — chequeo de solapamiento de plantas |
| Prioridad | Alta                                                    |
| Tipo      | Performance / regresión                                 |
| Creado    | 2026-03-10                                              |

## Contexto

`generarAlertas()` en `src/lib/utils/alertas.ts` incluye un chequeo O(n²) que compara todos los pares de plantas dentro de una zona para detectar solapamientos por espaciado insuficiente.

Con 1200 plantas en una sola zona (Pitahaya en sandbox 200×200m), esto generaba ~719.000 comparaciones, bloqueando el hilo principal de JS durante varios segundos y causando el crash del error boundary.

**Fix aplicado:** El chequeo se omite cuando la zona tiene más de `MAX_PLANTAS_OVERLAP_CHECK = 80` plantas. Plantas colocadas por grid automático nunca se solapan; el check es inútil y destructivo en zonas grandes.

**Constante:** `src/lib/lib/constants/conversiones.ts` → `MAX_PLANTAS_OVERLAP_CHECK = 80`

## Steps

| #   | Acción                                                                      | Resultado esperado                                                                               |
| --- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | Cargar terreno sandbox con zona de 1200+ plantas (Pitahaya)                 | App carga sin freeze. Sin bloqueo del hilo principal                                             |
| 2   | Activar modo Plantas (click en icono Plantas en barra de herramientas)      | Modo activa instantáneamente. Sin hang de UI                                                     |
| 3   | Esperar a que `sincronizarAlertas` complete (observable en consola/network) | Completa en < 500ms. Sin "page unresponsive" del browser                                         |
| 4   | Verificar alertas generadas para zona de 1200 plantas                       | 0 alertas de solapamiento generadas (chequeo omitido). Solo alertas genuinas de otras categorías |
| 5   | Verificar alertas para zona pequeña (< 80 plantas con solapamiento real)    | Alertas de solapamiento SÍ se generan correctamente                                              |
| 6   | Verificar `MAX_PLANTAS_OVERLAP_CHECK` en constants                          | Valor = 80. Cambiar el umbral actualiza el comportamiento sin tocar `alertas.ts`                 |

## Criterios de aceptación

- `sincronizarAlertas` con 2265 plantas totales completa en < 500ms
- El número de alertas generadas para zonas > 80 plantas no incluye solapamientos (chequeo skipped)
- Zonas con ≤ 80 plantas siguen detectando solapamientos reales
- No hay "Maximum update depth exceeded" ni freeze de UI al activar modo Plantas en terreno grande
- `bulkAdd` usado en lugar de N `add()` secuenciales para insertar alertas nuevas

## Implementación del fix

**`src/lib/constants/conversiones.ts`**

```typescript
// Umbral a partir del cual el chequeo O(n²) de solapamiento se omite.
// Plantas colocadas por grid automático nunca se solapan; el check es inútil
// para zonas grandes y bloquea el hilo principal.
export const MAX_PLANTAS_OVERLAP_CHECK = 80;
```

**`src/lib/utils/alertas.ts`**

```typescript
// Chequeo O(n²): se omite en zonas grandes porque bloquea el hilo principal.
// Zonas plantadas con grid automático nunca generan solapamientos.
if (plantasZona.length <= MAX_PLANTAS_OVERLAP_CHECK) {
  for (let i = 0; i < plantasZona.length; i++) {
    if (plantasZona[i].x == null || plantasZona[i].y == null) continue;
    for (let j = i + 1; j < plantasZona.length; j++) {
      if (plantasZona[j].x == null || plantasZona[j].y == null) continue;
      const dist = distancia(plantasZona[i], plantasZona[j]);
      if (dist < ESPACIADO_MINIMO_M) {
        alertas.push({ ... });
        break;
      }
    }
  }
}
```

**`src/lib/dal/transactions.ts`** — `bulkAdd` en lugar de N `add()`:

```typescript
sincronizarAlertas: (resolver, nuevas) =>
  db.transaction("rw", db.alertas, async () => {
    for (const r of resolver) {
      await db.alertas.update(r.id, r.cambios);
    }
    if (nuevas.length > 0) {
      await db.alertas.bulkAdd(nuevas);
    }
  }),
```

## Notes

- El escenario que detonó este bug: sandbox 200×200m con 8 zonas, 2265 plantas, Pitahaya con 1200 en una sola zona → 719.000 comparaciones O(n²)
- `bulkAdd` redujo la escritura de 844 operaciones secuenciales a 1 batch, eliminando overhead de transacciones repetidas en IDB
- El umbral 80 es conservador: un grid de 9×9 plantas ya supera el límite. Si se detectan solapamientos reales en zonas grandes en el futuro, considerar un algoritmo espacial (R-tree, grid bucket) en lugar de elevar el umbral.

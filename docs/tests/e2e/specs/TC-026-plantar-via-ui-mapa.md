# TC-026 — Plantar cultivos via UI del mapa (flujo real, no script IDB)

## Metadata

| Campo     | Valor                              |
| --------- | ---------------------------------- |
| ID        | TC-026                             |
| Feature   | Mapa — plantar individual y lote   |
| Prioridad | Crítica                            |
| Tipo      | E2E / Browser (PixiJS canvas + UI) |
| Ejecutor  | AI Agent (Chrome DevTools MCP)     |

## Contexto

El flujo principal de un agricultor en la app: entrar al mapa, seleccionar una zona de cultivo,
usar el botón "🌱 Plantar" para colocar plantas. Hay dos modos:

- **Individual**: click en el canvas donde va la planta
- **Lote**: ingresar número de plantas → se distribuyen automáticamente en la zona

TC-012 verificó el resultado final via IDB scripts. Este TC verifica el flujo de UI real.

## Precondiciones

- Terreno con al menos 1 zona tipo `cultivo`
- Zona con espacio disponible (no 100% llena)
- Usuario en `/app` en modo "Plantas" (`🌱 Plantas` activo en la barra de modos)

## Pasos — Plantar individual

| #   | Acción                                                                                | Resultado esperado                       |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------- |
| 1   | Navegar a `/app`                                                                      | Mapa cargado                             |
| 2   | Click en `🌱 Plantas` en la barra de modos                                            | Modo plantas activo                      |
| 3   | Click en zona de cultivo en el mapa                                                   | Zona seleccionada, panel lateral aparece |
| 4   | Verificar que el panel muestra: nombre zona, tipo cultivo, número de plantas actuales | Info correcta                            |
| 5   | Click en botón `🌾 Plantar`                                                           | Modal de plantación abierto              |
| 6   | Seleccionar tipo de cultivo (ej. Limón, Higuera)                                      | Cultivo seleccionado                     |
| 7   | Confirmar plantación individual                                                       | Modal cierra                             |
| 8   | Verificar que el contador de plantas en el panel aumenta en 1                         | Contador +1                              |
| 9   | Esperar 3s → verificar en IDB: `db.plantas.where('zona_id').equals(zonaId).count()`   | +1 planta                                |
| 10  | Esperar 6s → verificar sync en Supabase                                               | Planta en backend                        |

## Pasos — Plantar en lote

| #   | Acción                                                  | Resultado esperado                                |
| --- | ------------------------------------------------------- | ------------------------------------------------- |
| 11  | Con zona seleccionada, click `🌾 Plantar`               | Modal de plantación                               |
| 12  | Activar modo "Lote" o ingresar cantidad (ej. 5 plantas) | Campo cantidad visible                            |
| 13  | Seleccionar cultivo, ingresar cantidad 5                | Formulario completo                               |
| 14  | Confirmar                                               | 5 plantas distribuidas automáticamente en la zona |
| 15  | Verificar en canvas que aparecen N iconos nuevos        | N plantas visibles                                |
| 16  | Verificar en IDB                                        | +5 plantas con `zona_id` correcto                 |

## Verificación en consola

```js
const db = window.__agriplanDb__;
const zonas = await db.zonas.toArray();
const zonaTarget = zonas.find((z) => z.tipo === "cultivo");
const plantas = await db.plantas
  .where("zona_id")
  .equals(zonaTarget.id)
  .toArray();
console.log({
  zonaId: zonaTarget.id,
  totalPlantas: plantas.length,
  estados: plantas.map((p) => p.estado),
  cultivos: [...new Set(plantas.map((p) => p.tipo_cultivo_id))],
});
```

## Criterios de éxito

- [ ] Modal de plantación abre y cierra correctamente
- [ ] Plantas aparecen en el canvas inmediatamente (optimistic update)
- [ ] Contador del panel lateral se actualiza
- [ ] IDB tiene los registros correctos con `zona_id`, `tipo_cultivo_id`, `estado`
- [ ] Sync a Supabase ocurre en ≤ 6 segundos
- [ ] Plantar en zona llena muestra mensaje de error (no silencio)
- [ ] Plantar en zona tipo `estanque` o `infraestructura` → no debería ser posible

## Casos límite

- Cultivo no disponible en catálogo del proyecto → no aparece en selector
- Zona llena (100% ocupada según espaciado_recomendado_m) → warning visible
- Cancelar el modal → no se crea ninguna planta
- Plantar 0 plantas → botón deshabilitado

## Estado

⬜ Pendiente ejecución

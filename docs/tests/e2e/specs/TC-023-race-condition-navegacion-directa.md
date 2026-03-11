# TC-023 — Race Condition: Carga directa a páginas internas muestra terreno correcto

## Contexto

Al navegar directamente a una URL interna (ej. `/economia`, `/agua`) en lugar de pasar por `/app`,
el `ProjectContext` inicializaba el proyecto antes de que `useLiveQuery` retornara datos reales.

### Root Cause

`useLiveQuery` retorna el resultado cacheado anterior (`[]` de `usuarioId="sin-sesion"`) cuando
cambian sus dependencias, en lugar de `undefined`. El efecto `initialLoad` en `ProjectContext`
disparaba con `proyectosCount=0` en el mismo render que `authLoading` pasaba a `false`, llamando
`setInitialLoad(false)` antes de que llegaran los 5 proyectos reales.

### Fix aplicado

`src/hooks/use-proyectos.ts` — se taguea el resultado con el `usuarioId` consultado:

```typescript
const result = useLiveQuery(
  async () => ({
    id: usuarioId,
    data: await proyectosDAL.getByUsuarioId(usuarioId),
  }),
  [usuarioId],
);
const loading = result === undefined || result.id !== usuarioId;
const proyectos = (result?.id === usuarioId ? result.data : undefined) ?? [];
```

## Precondiciones

- Usuario autenticado con sesión activa (cookie `sb-*-auth-token` presente)
- Al menos 1 proyecto y 1 terreno en IndexedDB para ese usuario
- `localStorage` tiene `agriplan_proyecto_actual` y `agriplan_terreno_actual` guardados

## Pasos

1. Abrir nueva pestaña o hacer hard refresh (`Ctrl+Shift+R`) en `http://localhost:3000/economia`
2. Esperar 3 segundos (sin interacción)
3. Verificar que la página muestra datos reales (no "No hay terrenos creados.")
4. Repetir el test para `/agua`, `/agua/planificador`, `/agua/configuracion`, `/escenarios`

## Criterios de éxito

- [ ] `/economia` muestra tabla con cultivos y valores de ROI (no mensaje de error)
- [ ] `/agua` muestra datos de estanque y consumo (no "No hay terrenos creados.")
- [ ] `/agua/planificador` carga la proyección 12 meses
- [ ] `/agua/configuracion` muestra formulario con datos del terreno actual
- [ ] `/escenarios` carga el comparador
- [ ] El nombre del terreno en el header coincide con el guardado en `localStorage`

## Evidencia de verificación

- Fecha: 2026-03-10
- Método: Chrome DevTools MCP — hard navigate + `evaluate_script` con `setTimeout(3000)`
- Resultado `/economia`: mostró `$424.575 Costo Agua/año`, ROI -294% con 12 plantas
- Estado: ✅ PASS

## Notas

- Este bug solo ocurre en navegación directa (hard refresh). Client-side navigation (Next.js Link)
  no lo reproduce porque el contexto ya está montado.
- La secuencia de renders que causaba el bug (verificada via console.log):
  - Render 68: `authLoading=true, proyectosLoading=false, count=0` (sin-sesion cache)
  - Render 69: `authLoading=false, proyectosLoading=false, count=0` ← disparaba initialLoad=false
  - Render 71: `initialLoad=false, count=5` ← demasiado tarde

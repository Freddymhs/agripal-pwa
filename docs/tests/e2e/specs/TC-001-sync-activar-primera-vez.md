# TC-001 — Activar sincronización por primera vez

## Metadata

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| ID          | TC-001                         |
| Feature     | Sync — Activación inicial      |
| Prioridad   | Alta                           |
| Tipo        | E2E / Browser                  |
| Ejecutor    | AI Agent (Chrome DevTools MCP) |
| Creado      | 2026-03-10                     |
| Última rev. | 2026-03-10                     |

## Preconditions

- [ ] `pnpm dev` corriendo en `http://localhost:3000`
- [ ] Usuario autenticado en Supabase Auth
- [ ] Sync desactivado (`sync_habilitado = false` en IndexedDB)
- [ ] Al menos un proyecto y un terreno en IndexedDB

## Steps

| #   | Acción                                                     | Resultado esperado                                                                       |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | Navegar a `/configuracion`                                 | Página carga con sección "Respaldo en la nube"                                           |
| 2   | Verificar estado del toggle                                | Toggle OFF, texto "Solo almacenamiento local"                                            |
| 3   | Click toggle                                               | Aparece modal de confirmación                                                            |
| 4   | Verificar texto del modal                                  | "Al activar, tus datos se guardarán en la nube..."                                       |
| 5   | Click "Activar sincronización"                             | Aparece texto "Activando sincronización..."                                              |
| 6   | Esperar hasta 30s                                          | Aparece mensaje verde "Sincronización activada. Tus datos se respaldan automáticamente." |
| 7   | Verificar toggle                                           | Toggle ON (verde, checked)                                                               |
| 8   | Verificar `window.__agriplan_sync_habilitado__` en consola | `true`                                                                                   |
| 9   | Verificar Supabase REST: `proyectos?select=id` con auth    | ≥ 1 registros                                                                            |
| 10  | Verificar Supabase REST: `terrenos?select=id` con auth     | ≥ 1 registros                                                                            |

## Expected Final State

- Toggle ON en `/configuracion`
- `window.__agriplan_sync_habilitado__ === true`
- Tablas proyectos y terrenos con datos en Supabase
- No hay errores en `sync_queue` para entidades críticas

## Verificación Supabase (en browser console)

```js
const ANON_KEY = "<anon-key>";
const BASE = "https://wnxbfdxpolgiavrmqwpv.supabase.co";
const token = JSON.parse(
  atob(
    document.cookie
      .split("; ")
      .find((c) => c.includes("auth-token="))
      .split("=")
      .slice(1)
      .join("=")
      .replace("base64-", ""),
  ),
).access_token;
const tablas = [
  "proyectos",
  "terrenos",
  "zonas",
  "plantas",
  "catalogo_cultivos",
  "insumos_usuario",
];
for (const t of tablas) {
  const r = await fetch(`${BASE}/rest/v1/${t}?select=id`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  });
  console.log(t, (await r.json()).length);
}
```

## Notes

- Si IndexedDB está vacío, el upload termina sin llamar `onProgress` — aún así debe mostrar "Activando sincronización..." (BUG-01 fix)
- Alertas con FK huérfanas generan warning pero NO abortan la activación (fix en `initial-upload.ts`)
- `window.__agriplanDb__` disponible solo en `NODE_ENV=development`

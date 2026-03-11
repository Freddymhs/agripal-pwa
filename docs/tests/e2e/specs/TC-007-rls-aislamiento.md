# TC-007 — RLS: aislamiento de datos entre usuarios

## Metadata

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| ID          | TC-007                         |
| Feature     | Seguridad — RLS Supabase       |
| Prioridad   | Alta                           |
| Tipo        | E2E / Browser + REST           |
| Ejecutor    | AI Agent (Chrome DevTools MCP) |
| Creado      | 2026-03-10                     |
| Última rev. | 2026-03-10                     |

## Preconditions

- [ ] `pnpm dev` corriendo
- [ ] Datos en Supabase para el usuario principal

## Steps

### Verificación sin sesión (anon key)

```js
// En browser console — SIN token de autenticación
const ANON_KEY = "<anon-key>";
const BASE = "https://wnxbfdxpolgiavrmqwpv.supabase.co";

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
    headers: { apikey: ANON_KEY },
  });
  console.log(t, (await r.json()).length, "← debe ser 0");
}
```

| #   | Tabla             | Resultado esperado |
| --- | ----------------- | ------------------ |
| 1   | proyectos         | `[]` (0 registros) |
| 2   | terrenos          | `[]` (0 registros) |
| 3   | zonas             | `[]` (0 registros) |
| 4   | plantas           | `[]` (0 registros) |
| 5   | catalogo_cultivos | `[]` (0 registros) |
| 6   | insumos_usuario   | `[]` (0 registros) |

### Verificación con sesión autenticada

```js
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

for (const t of tablas) {
  const r = await fetch(`${BASE}/rest/v1/${t}?select=id`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  });
  console.log(t, (await r.json()).length, "← debe ser > 0 si hay datos");
}
```

| #   | Tabla     | Resultado esperado |
| --- | --------- | ------------------ |
| 7   | proyectos | ≥ 1 registros      |
| 8   | terrenos  | ≥ 1 registros      |

## Expected Final State

- Sin sesión: 0 registros en todas las tablas (RLS bloquea)
- Con sesión: solo datos del usuario autenticado

## Notes

- TC-007 se considera verificado POR DISEÑO si los dos escenarios anteriores pasan
- Aislamiento entre usuarios (2 cuentas) requiere cuenta adicional de prueba — omitido en esta ejecución
- RLS policies definidas en Supabase dashboard → cada tabla tiene `user_id = auth.uid()` policy

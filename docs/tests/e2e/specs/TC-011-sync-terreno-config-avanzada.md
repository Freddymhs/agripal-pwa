# TC-011 — Sync Configuración Avanzada de Terreno (datos JSONB)

## Metadata

| Campo       | Valor                               |
| ----------- | ----------------------------------- |
| ID          | TC-011                              |
| Feature     | Sync — Terreno datos JSONB completo |
| Prioridad   | Media                               |
| Tipo        | E2E / Browser                       |
| Ejecutor    | AI Agent (Chrome DevTools MCP)      |
| Creado      | 2026-03-10                          |
| Última rev. | 2026-03-10                          |

## Contexto

El modal "Configuración Avanzada" de un terreno guarda campos en `terrenos.datos` JSONB:

- **Ubicación**: región, comuna, dirección, coordenadas GPS
- **Legal**: tipo propiedad, rol SII, inscripcion SAG, INDAP, derechos DGA
- **Distancias**: km a pueblo, ciudad, hospital, ferretería, mercado
- **Conectividad**: señal celular, internet
- **Infraestructura**: tipo acceso, cerco, electricidad, agua potable

El objetivo es verificar que al guardar desde la UI, el JSONB completo llega a Supabase sin perder campos.

## Preconditions

- [ ] `pnpm dev` corriendo en `http://localhost:3000`
- [ ] Usuario autenticado
- [ ] Sync activado
- [ ] Existe al menos un terreno ("Terreno Oasis 2" u otro)

## Steps

### Vía UI (preferido para este test)

| #   | Acción                                                                                            | Resultado esperado                                |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | Navegar al terreno → abrir "Configuración Avanzada"                                               | Modal con 5 tabs visible                          |
| 2   | Tab Ubicación → llenar: Región "Arica y Parinacota", Coordenadas "-18.36386, -70.02931" → Guardar | Modal cierra                                      |
| 3   | Tab Legal → marcar "Inscripcion SAG" → Guardar                                                    | Modal cierra                                      |
| 4   | Tab Distancias → llenar: Ciudad principal "15" km → Guardar                                       | Modal cierra                                      |
| 5   | Esperar 6 segundos                                                                                | Sync engine procesa                               |
| 6   | Verificar Supabase: `terrenos?id=eq.{id}&select=datos`                                            | `datos` JSONB contiene todos los campos guardados |

### Verificación en consola (alternativa)

```js
const db = window.__agriplanDb__;
const terrenos = await db.terrenos.toArray();
const t = terrenos[0];
console.log("datos locales:", JSON.stringify(t.datos, null, 2));
// Verificar que el mismo objeto llegó a Supabase
```

## Expected Final State

- `terrenos.datos` en Supabase contiene los campos de todas las tabs guardadas
- No hay pérdida de campos previos al actualizar (BUG-02 verificado también para este flujo)

## Notes

- Este test verifica específicamente que el fix de BUG-02 aplica también para updates desde la UI (no solo desde DAL directo)
- Los campos de Configuración Avanzada se almacenan dentro del JSONB `datos` del terreno, no como columnas separadas

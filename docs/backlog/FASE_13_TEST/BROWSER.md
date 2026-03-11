# FASE 13 — Tests Browser (UI) [DEPRECADO]

> **DEPRECADO**: Este archivo fue reemplazado por specs individuales en `docs/tests/e2e/specs/TC-*.md`.
> Ver [`docs/tests/e2e/README.md`](../tests/e2e/README.md) para la estructura actualizada.

---

Guía original (conservada como referencia histórica):

Guía para ejecutar manualmente o con Chrome DevTools MCP.
Cada test es independiente. Precondiciones indicadas al inicio.

---

## Precondiciones Globales

- `pnpm dev` corriendo
- Navegador en `http://localhost:3000`
- DevTools abierto: Console + Application (IndexedDB)
- Usuario registrado en Supabase Auth

---

## TEST-B01: Crear datos y activar sync por primera vez

**Precondición**: IndexedDB limpio (sin datos previos)

```
PASO  ACCION                                              VERIFICACION
────  ──────────────────────────────────────────────────  ──────────────────────────────────────────
 1    Navegar a /auth/login                               Página de login visible
 2    Ingresar email y password válidos                   -
 3    Click "Iniciar sesión"                              Redirige a /app, nombre visible en header
 4    Click "Crear mi primer proyecto"                    Modal de creación visible
 5    Escribir nombre: "Test Sync 01"                     -
 6    Escribir ubicación: "Arica"                         -
 7    Click "Crear"                                       Proyecto aparece en selector del header
 8    Crear terreno 50x30                                 Mapa muestra terreno con dimensiones
 9    Modo Zonas → crear zona cultivo 10x10               Zona verde visible en mapa
10    Modo Zonas → crear zona estanque 5x5                Zona azul visible en mapa
11    Navegar a Avanzado → Configuración                  Página con toggle "Sincronización"
12    Verificar toggle OFF                                Texto: "Solo almacenamiento local"
13    Click toggle                                        Aparece diálogo de confirmación
14    Verificar texto del diálogo                         "Al activar, tus datos se guardarán en la nube"
15    Click "Activar sincronización"                      Barra de progreso aparece
16    Esperar fin de carga                                Console: "[INFO] Carga inicial [proyectos]: 1 registros"
17    Verificar estado final                              Mensaje verde: "Sincronización activada"
18    Verificar toggle ON                                 Toggle en posición activa (verde)
```

**Datos para verificación backend**: proyecto "Test Sync 01", terreno 50x30, 2 zonas

---

## TEST-B02: Restaurar datos desde la nube

**Precondición**: TEST-B01 completado (datos en Supabase)

```
PASO  ACCION                                              VERIFICACION
────  ──────────────────────────────────────────────────  ──────────────────────────────────────────
 1    DevTools → Application → Storage                    -
 2    Click "Clear site data"                             IndexedDB, cookies, cache borrados
 3    Recargar página (F5)                                Redirige a /auth/login
 4    Iniciar sesión                                      Redirige a /app
 5    Verificar selector de proyectos                     "No tienes proyectos"
 6    Navegar a Avanzado → Configuración                  Toggle OFF (sync_meta borrado)
 7    Click toggle → Confirmar activación                 Barra de progreso
 8    Esperar fin de carga + pull                         Console: "[INFO] Pull tras carga inicial" con pulled > 0
 9    Navegar al selector de proyectos                    "Test Sync 01" aparece
10    Seleccionar "Test Sync 01"                          Mapa carga con terreno 50x30
11    Verificar zonas                                     2 zonas visibles (cultivo + estanque)
12    Navegar a Catálogo                                  Cultivos del catálogo presentes (~21+)
```

---

## TEST-B03: App offline con sync desactivado

**Precondición**: Sesión iniciada, sync OFF

```
PASO  ACCION                                              VERIFICACION
────  ──────────────────────────────────────────────────  ──────────────────────────────────────────
 1    Navegar a Configuración                             Toggle sync OFF
 2    Si está ON → click toggle para desactivar           "Solo almacenamiento local"
 3    DevTools → Network → marcar "Offline"               Indicador offline en header
 4    Crear proyecto "Proyecto Offline"                   Proyecto se crea sin error
 5    Crear terreno 20x20                                 Terreno visible en mapa
 6    Crear zona de cultivo                               Zona visible
 7    Navegar a Catálogo                                  Página carga sin error
 8    Navegar a Clima                                     Página carga sin error
 9    Navegar a Suelo                                     Página carga sin error
10    DevTools → IndexedDB → proyectos                    "Proyecto Offline" existe
11    DevTools → Network → desmarcar "Offline"            -
12    Esperar 60 segundos                                 Console: SIN logs de sync (sync OFF)
```

**Verificación backend**: "Proyecto Offline" NO debe existir en Supabase

---

## TEST-B04: Sync incremental (CRUD automático)

**Precondición**: Sesión iniciada, sync ON

```
PASO  ACCION                                              VERIFICACION
────  ──────────────────────────────────────────────────  ──────────────────────────────────────────

--- CREATE ---
 1    Crear terreno "Terreno CRUD" 40x25                  Terreno visible
 2    Crear zona "Zona Tomates" tipo cultivo              Zona visible
 3    Esperar 35 segundos                                 Console: logs de sync sin errores

--- UPDATE ---
 4    Editar nombre terreno → "Terreno CRUD Editado"      Nombre actualizado en UI
 5    Esperar 35 segundos                                 Console: sync ejecutado

--- DELETE ---
 6    Eliminar zona "Zona Tomates"                        Zona desaparece del mapa
 7    Esperar 35 segundos                                 Console: sync ejecutado
```

**Verificación backend tras paso 3**: terreno + zona existen en Supabase
**Verificación backend tras paso 5**: nombre del terreno actualizado
**Verificación backend tras paso 7**: zona eliminada

---

## TEST-B05: Cola pendiente + reconexión

**Precondición**: Sesión iniciada, sync ON

```
PASO  ACCION                                              VERIFICACION
────  ──────────────────────────────────────────────────  ──────────────────────────────────────────
 1    DevTools → Network → marcar "Offline"               Header muestra estado offline
 2    Crear proyecto "Proyecto Sin Red"                   Se crea sin error
 3    Crear terreno "Terreno Offline" 30x20               Terreno visible
 4    Crear zona de cultivo                               Zona visible
 5    DevTools → IndexedDB → sync_queue                   Items con estado: "pendiente"
 6    Contar items pendientes                             Mínimo 3 (proyecto + terreno + zona)
 7    DevTools → Network → desmarcar "Offline"            -
 8    Esperar 5 segundos                                  Console: logs de sync ejecutándose
 9    DevTools → IndexedDB → sync_queue                   Items procesados (completado o eliminados)
```

**Verificación backend**: "Proyecto Sin Red", "Terreno Offline", zona — todo en Supabase

---

## TEST-B06: Aislamiento entre usuarios

**Precondición**: Dos cuentas de Supabase Auth

```
PASO  ACCION                                              VERIFICACION
────  ──────────────────────────────────────────────────  ──────────────────────────────────────────

--- USUARIO A ---
 1    Iniciar sesión como Usuario A                       -
 2    Crear proyecto "Solo Mío A"                         Proyecto visible
 3    Activar sync si no está activo                      Datos suben
 4    Cerrar sesión                                       Redirige a login

--- USUARIO B ---
 5    Borrar IndexedDB (limpiar datos de A)               -
 6    Iniciar sesión como Usuario B                       -
 7    Verificar selector de proyectos                     NO muestra "Solo Mío A"
 8    Crear proyecto "Solo Mío B"                         Proyecto visible
 9    Activar sync                                        Datos suben
10    Verificar selector de proyectos                     Solo muestra "Solo Mío B"

--- VOLVER A USUARIO A ---
11    Cerrar sesión                                       -
12    Borrar IndexedDB                                    -
13    Iniciar sesión como Usuario A                       -
14    Activar sync                                        Pull trae datos
15    Verificar selector de proyectos                     Solo muestra "Solo Mío A" (no "Solo Mío B")
```

---

## TEST-B07: Desactivar sync

**Precondición**: Sync ON con datos sincronizados

```
PASO  ACCION                                              VERIFICACION
────  ──────────────────────────────────────────────────  ──────────────────────────────────────────
 1    Navegar a Configuración                             Toggle ON
 2    Click toggle para desactivar                        Toggle OFF, "Solo almacenamiento local"
 3    Crear terreno "Post Desactivar"                     Terreno visible
 4    Esperar 60 segundos                                 Console: SIN logs de sync
```

**Verificación backend**: "Post Desactivar" NO existe en Supabase

---

## TEST-B08: Reactivar sync sube datos pendientes

**Precondición**: TEST-B07 completado (sync OFF, datos locales sin sincronizar)

```
PASO  ACCION                                              VERIFICACION
────  ──────────────────────────────────────────────────  ──────────────────────────────────────────
 1    Navegar a Configuración                             Toggle OFF
 2    Click toggle → Confirmar activación                 Barra de progreso
 3    Esperar fin de carga                                Console: carga inicial con registros
 4    Verificar mensaje                                   "Sincronización activada"
```

**Verificación backend**: "Post Desactivar" AHORA existe en Supabase, sin duplicados

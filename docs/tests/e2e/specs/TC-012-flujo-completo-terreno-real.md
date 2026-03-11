# TC-012 — Flujo completo: Terreno real 75×183m (Arica)

## Metadata

| Campo       | Valor                                |
| ----------- | ------------------------------------ |
| ID          | TC-012                               |
| Feature     | Flujo end-to-end — Agricultor real   |
| Prioridad   | Crítica                              |
| Tipo        | E2E / Browser (funcionalidad + sync) |
| Ejecutor    | AI Agent (Chrome DevTools MCP)       |
| Creado      | 2026-03-10                           |
| Última rev. | 2026-03-10                           |

## Contexto

Basado en `docs/feedback-stakeholder/FEEDBACK_CLIENTE_REAL_2026-02-08.md`.

**Usuario real**: Marcos, agricultor, Arica. Terreno de ~75m × 183m en agrupación de socios.
**Objetivo**: Verificar que el flujo completo de configuración de un terreno real funciona correctamente en la app, con datos que tengan sentido agronómico para la zona.

El terreno "Oasis Piloto" usa dimensiones simplificadas (150m × 50m = 7,500 m²) pero proporcionales al terreno real para facilitar el cálculo.

---

## Preconditions

- [ ] `pnpm dev` corriendo en `http://localhost:3000`
- [ ] Usuario autenticado
- [ ] Sync activado
- [ ] Al menos un proyecto creado

---

## FASE 1 — Crear el terreno

| #   | Acción                                                                                            | Resultado esperado       |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------ |
| 1   | Navegar a `/terrenos` → click "+ Nuevo Terreno"                                                   | Formulario visible       |
| 2   | Nombre: "Oasis Piloto" → click "Crear Terreno"                                                    | Terreno aparece en lista |
| 3   | Abrir "Configuración Avanzada" → tab Ubicación                                                    | Modal abierto            |
| 4   | Llenar: Región "Arica y Parinacota", Comuna "Arica", Coordenadas "-18.36386, -70.02931" → Guardar | Modal cierra             |
| 5   | Verificar Supabase (tras 6s): `terrenos?nombre=eq.Oasis Piloto`                                   | 1 registro               |

---

## FASE 2 — Crear zonas

Entrar al mapa del terreno y crear las siguientes zonas via "+ Nueva Zona":

| Zona               | Tipo            | Dimensión aprox | Propósito                   |
| ------------------ | --------------- | --------------- | --------------------------- |
| Casa + Bodega      | infraestructura | 15×10m          | Vivienda y herramientas     |
| Estanque Principal | estanque        | 10×10m          | Reservorio de agua          |
| Cultivo Norte      | cultivo         | 55×45m          | Naranjos + Higueras         |
| Cultivo Sur        | cultivo         | 55×45m          | Maracuyá                    |
| Camino Central     | camino          | 10×45m          | Pasillo vehicular (cosecha) |

> **Nota técnica**: Las zonas se crean con el canvas PixiJS. Para automatización usar `window.__agriplanDb__` con `zona_id` correcto desde `db.terrenos.toArray()`.

```js
// Alternativa automatizada (dev)
const db = window.__agriplanDb__;
const terrenos = await db.terrenos.toArray();
const t = terrenos.find((t) => t.nombre === "Oasis Piloto");

const zonas = [
  {
    nombre: "Casa + Bodega",
    tipo: "infraestructura",
    x: 0,
    y: 0,
    ancho: 15,
    alto: 10,
  },
  {
    nombre: "Estanque Principal",
    tipo: "estanque",
    x: 0,
    y: 15,
    ancho: 10,
    alto: 10,
  },
  {
    nombre: "Cultivo Norte",
    tipo: "cultivo",
    x: 20,
    y: 0,
    ancho: 55,
    alto: 45,
  },
  { nombre: "Cultivo Sur", tipo: "cultivo", x: 20, y: 50, ancho: 55, alto: 45 },
  {
    nombre: "Camino Central",
    tipo: "camino",
    x: 80,
    y: 0,
    ancho: 10,
    alto: 45,
  },
];

for (const z of zonas) {
  await db.zonas.add({
    id: crypto.randomUUID(),
    terreno_id: t.id,
    ...z,
    lastModified: Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}
```

| #   | Verificación                                        | Resultado esperado                  |
| --- | --------------------------------------------------- | ----------------------------------- |
| 6   | Esperar 6s → `zonas?terreno_id=eq.{id}` en Supabase | 5 registros                         |
| 7   | Canvas muestra las zonas correctamente              | Zonas visibles con colores por tipo |

---

## FASE 3 — Configurar estanque

| #   | Acción                                                                               | Resultado esperado                     |
| --- | ------------------------------------------------------------------------------------ | -------------------------------------- |
| 8   | Seleccionar zona "Estanque Principal" en el mapa                                     | Panel lateral con opciones de estanque |
| 9   | Configurar capacidad: **10 m³**                                                      | Capacidad guardada                     |
| 10  | Asignar fuente de agua: crear o seleccionar fuente con calidad (boro, salinidad, pH) | Fuente asignada                        |
| 11  | Verificar indicador: "0.0 / 10.0 m³"                                                 | Nivel visible en 0                     |

> **Gap conocido**: si el terreno tiene 2 estanques, la app actualmente no permite asignar qué estanque alimenta qué zona. Ver TC-012-PENDIENTE al final de este spec.

---

## FASE 4 — Registrar entrada de agua

| #   | Acción                                                                                                | Resultado esperado                        |
| --- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 12  | Navegar a `/agua` con terreno "Oasis Piloto" seleccionado                                             | Dashboard de agua visible                 |
| 13  | Click "+ Registrar Entrada de Agua"                                                                   | Modal de entrada                          |
| 14  | Llenar: Volumen **8 m³**, Costo **$4.800**, Proveedor **"Canal Azapa"**, Notas "Primera carga piloto" | Formulario completo                       |
| 15  | Confirmar entrada                                                                                     | Nivel del estanque sube a "8.0 / 10.0 m³" |
| 16  | Esperar 6s → `entradas_agua?terreno_id=eq.{id}` en Supabase                                           | 1 registro con datos correctos            |

**Valores esperados en Supabase (`datos` JSONB)**:

```json
{
  "volumen_m3": 8,
  "costo": 4800,
  "proveedor": "Canal Azapa",
  "notas": "Primera carga piloto"
}
```

---

## FASE 5 — Plantar cultivos

### Zona "Cultivo Norte" — Naranjos + Higueras

```js
// Via consola (canvas no responde a eventos sintéticos)
const db = window.__agriplanDb__;
const zonas = await db.zonas.toArray();
const zonaNorte = zonas.find((z) => z.nombre === "Cultivo Norte");

// Plantar 12 naranjos (spacing 8m, zona 55×45m → ~24 caben, probamos con 12)
for (let i = 0; i < 12; i++) {
  await db.plantas.add({
    id: crypto.randomUUID(),
    zona_id: zonaNorte.id,
    tipo_cultivo_id: "naranjo", // verificar con db.catalogo_cultivos.toArray()
    estado: "activa",
    datos: {
      espaciado_m: 8,
      fecha_plantacion: new Date().toISOString(),
      tipo_adquisicion: "plantula",
      costo_planta: 8000,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}
```

| #   | Verificación                                                | Resultado esperado            |
| --- | ----------------------------------------------------------- | ----------------------------- |
| 17  | Canvas muestra plantas en zona                              | 12 iconos de naranjo visibles |
| 18  | Panel lateral muestra "12 planta(s) en total"               | Contador correcto             |
| 19  | Esperar 6s → `plantas?zona_id=eq.{zonaNorteId}` en Supabase | 12 registros                  |

---

## FASE 6 — Configurar sistema de riego

| #   | Acción                                                            | Resultado esperado                                      |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| 20  | Seleccionar zona "Cultivo Norte"                                  | Panel lateral visible                                   |
| 21  | Click "Configurar Riego"                                          | Modal de configuración de riego                         |
| 22  | Seleccionar tipo: **goteo**, horario: 06:00, duración: **4h/día** | Riego configurado                                       |
| 23  | Verificar cálculo de consumo diario                               | Consume ~X m³/día según Kc del naranjo + ET0 zona Arica |
| 24  | Verificar "días de agua restantes" en header                      | Un número > 0 basado en 8m³ disponibles                 |

**Valores de referencia (Arica, naranjo plántula)**:

- Kc fase plántula: ~0.5
- ET0 Arica: ~4.2 mm/día
- Consumo por planta: ET0 × Kc × espaciado² = 4.2 × 0.5 × 64 = ~134 L/planta/día
- 12 plantas: ~1.6 m³/día
- 8m³ disponibles → ~5 días de agua

---

## FASE 7 — Verificar descuento de agua en tiempo real

| #   | Acción                                                       | Resultado esperado                                |
| --- | ------------------------------------------------------------ | ------------------------------------------------- |
| 25  | Navegar a `/agua`                                            | Dashboard de agua con zona "Cultivo Norte" activa |
| 26  | Verificar indicador de consumo activo                        | "consume ~1.6 m³/día" o similar                   |
| 27  | Verificar "días de agua restantes"                           | ~5 días con 8m³                                   |
| 28  | Verificar que el nivel del estanque se muestra correctamente | No en 0 todavía                                   |

---

## FASE 8 — Registrar cosecha (futuro, cuando plantas maduren)

> Este paso es informativo. En el terreno piloto las plantas son plántulas recientes — no hay cosecha en la fecha de test.

```js
// Documentado para ejecución futura (mes 18+)
const db = window.__agriplanDb__;
const zonas = await db.zonas.toArray();
const zonaNorte = zonas.find((z) => z.nombre === "Cultivo Norte");

await db.cosechas.add({
  id: crypto.randomUUID(),
  zona_id: zonaNorte.id,
  tipo_cultivo_id: "naranjo",
  fecha: new Date().toISOString().split("T")[0],
  datos: {
    cantidad_kg: 80,
    calidad: "primera",
    precio_kg: 500,
    notas: "Primera cosecha piloto - naranjos año 2",
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});
```

---

## Expected Final State

| Entidad                 | Estado esperado                         |
| ----------------------- | --------------------------------------- |
| Terreno "Oasis Piloto"  | En Supabase, con datos de ubicación GPS |
| 5 zonas                 | En Supabase, tipos correctos            |
| Estanque configurado    | 10m³ capacidad, fuente asignada         |
| 1 entrada de agua (8m³) | En Supabase, proveedor "Canal Azapa"    |
| 12 plantas (naranjo)    | En Supabase, zona "Cultivo Norte"       |
| Riego configurado       | Consumo diario calculado con Kc real    |
| Nivel estanque          | 8.0 / 10.0 m³ visible en dashboard      |
| Días restantes          | ~5 días (8m³ ÷ 1.6 m³/día)              |

---

## Verificación numérica (realismo agronómico)

Los números deben tener lógica para un terreno real en Arica:

| Cálculo                     | Valor esperado | Lógica                   |
| --------------------------- | -------------- | ------------------------ |
| Consumo por planta/día      | ~134 L         | ET0 4.2 × Kc 0.5 × 64 m² |
| Consumo 12 plantas/día      | ~1.6 m³        | 134L × 12                |
| Días con 8m³                | ~5 días        | 8,000L ÷ 1,600L/día      |
| Costo inversión 12 naranjos | $96.000 CLP    | 12 × $8.000              |

Si estos números NO calzan en la app → **bug de cálculo** a reportar.

---

## Gaps conocidos (NO bloquean el test, documentar si aparecen)

### GAP-01: Múltiples estanques por terreno

- **Situación**: Si hay 2 estanques, no hay forma de asignar cuál alimenta cada zona de cultivo
- **Impacto**: El descuento de agua se hace "del primer estanque" o del total
- **Acción futura**: Crear backlog FASE_XX_MULTI_ESTANQUE

### GAP-02: Gestión de proveedores

- **Situación**: El campo "proveedor" en entrada de agua es texto libre
- **Riesgo**: "Canal Azapa" vs "canal azapa" vs "C. Azapa" → historial fragmentado
- **Acción futura**: Crear tabla `proveedores` o autocomplete con deduplicación

### GAP-03: Naranjo en catálogo

- **Situación**: Naranjo puede no estar en `catalogo_cultivos` (feedback doc indica que no estaba)
- **Acción**: Verificar con `db.catalogo_cultivos.toArray()` antes de correr el test; si falta, usar higuera o maracuyá como cultivo de prueba

### GAP-04: Modo experimental / escala gradual

- **Situación**: Usuario real quiere plantar 1 planta, ver si sobrevive, luego escalar a 10, luego 134
- **No existe en la app**: No hay concepto de "lote piloto" vs "producción"
- **Acción futura**: Backlog feature

---

## Notes

- Este TC simula el flujo real de Marcos del `FEEDBACK_CLIENTE_REAL_2026-02-08.md`
- Los números agronómicos están calibrados para la zona Arica (~1086m, ET0 4.2 mm/día)
- El terreno piloto (150×50m) es una simplificación del real (75×183m) para facilitar el test
- Para el terreno exacto, usar 75m × 183m = 13,725 m²

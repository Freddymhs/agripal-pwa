# 05: Datos de Suelo y Nutrientes

**Status**: Completada
**Prioridad**: Media
**Dependencias**: FASE_5C (suelo básico ya existe)

---

## Problema

- Existe `/suelo` pero no está conectado al flujo principal del mapa
- No se pueden registrar datos químicos del terreno (sal, pH, nutrientes)
- No hay planificación de preparación del terreno (guano, fertilizantes, etc.)
- No se sabe si el suelo es apto para cada cultivo

## Solución

### 5.1 Registro de análisis de suelo

```typescript
interface AnalisisSuelo {
  id: string;
  terreno_id: string;
  fecha: string;
  laboratorio?: string;

  ph: number;
  salinidad_dS_m: number;
  materia_organica_pct: number;
  nitrogeno_ppm?: number;
  fosforo_ppm?: number;
  potasio_ppm?: number;

  presencia_sal: boolean;
  requiere_lavado: boolean;
  notas: string;
}
```

### 5.2 Preparación del terreno

Registro de aplicaciones:

- Guano de vaca/gallina
- Fertilizantes (NPK, etc.)
- Compost
- Humus de lombriz
- Cal (corrección pH)
- Lavado de sales

Cada aplicación tiene: fecha, tipo, cantidad_kg, zona_aplicada, costo

### 5.3 Compatibilidad suelo ↔ cultivo

`CatalogoCultivo` ya tiene `ph_min`, `ph_max`. Cruzar con el análisis de suelo:

- "pH actual: 7.8 → Olivo: COMPATIBLE (rango 6.0-8.5)"
- "pH actual: 7.8 → Arándano: NO COMPATIBLE (necesita 4.5-5.5)"

### 5.4 Datos estáticos de referencia

Crear `data/static/suelo/enmiendas.json` con datos de:

- Tipos de fertilizantes y su efecto en pH/nutrientes
- Guano (composición típica NPK)
- Tiempos de efecto
- Dosis recomendadas por m²

## Datos estáticos disponibles

- `CatalogoCultivo.ph_min/ph_max` — ya existe
- `SueloTerreno` type — ya existe en FASE_5C
- `/suelo` page — ya existe

## Archivos a crear/modificar

- `data/static/suelo/enmiendas.json` — fertilizantes, guano, etc.
- `src/types/index.ts` — tipo `AnalisisSuelo`, `AplicacionSuelo`
- `src/lib/validations/suelo.ts` — compatibilidad suelo↔cultivo
- `src/app/suelo/page.tsx` — conectar con terreno actual

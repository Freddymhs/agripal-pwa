# 02: Estanques Funcionales

**Status**: Completada
**Prioridad**: Alta
**Dependencias**: FASE_8A (estanques ya existen como zonas)

---

## Problema

Los estanques existen visualmente en el mapa (zona tipo "estanque") con `estanque_config` (capacidad, nivel_actual), pero:

1. No hay forma de "rellenar" el estanque desde la UI
2. No se puede configurar cómo se gasta el agua (goteo manual, goteo eléctrico, frecuencia)
3. El porcentaje (0%) se muestra pero no se puede modificar
4. `/agua/configuracion` existe pero no se conecta con los estanques del terreno

## Solución

### 2.1 Panel de estanque al seleccionarlo

Al seleccionar una zona tipo estanque, el panel lateral debe mostrar:

- Capacidad total (m³)
- Nivel actual (m³) con barra visual
- Botón "Registrar entrada de agua" → modal para agregar m³ con fecha y fuente
- Historial de entradas recientes

### 2.2 Configuración de distribución

Cada estanque necesita configurar cómo distribuye agua:

```typescript
interface DistribucionAgua {
  tipo: "goteo_manual" | "goteo_electrico" | "aspersion" | "inundacion";
  litros_hora: number;
  horas_por_dia: number;
  dias_por_semana: number;
  zonas_conectadas: string[]; // IDs de zonas de cultivo que riega
}
```

### 2.3 Descuento automático de agua

- Calcular consumo semanal basado en: plantas × agua_m3_ha × factor_temporada
- Mostrar proyección: "Con el nivel actual, tienes agua para X días"
- Alerta cuando nivel < 20%

## Datos estáticos disponibles

- `CatalogoCultivo.agua_m3_ha_año_min` y `agua_m3_ha_año_max` ya existen
- `FACTORES_TEMPORADA` ya existe en types
- `EstanqueConfig` ya tiene `capacidad_m3`, `nivel_actual_m3`, `fuente_id`

## Archivos a crear/modificar

- `src/components/mapa/estanque-panel.tsx` — nuevo panel al seleccionar estanque
- `src/app/page.tsx` — renderizar estanque-panel cuando zona seleccionada es estanque
- `src/lib/utils/agua.ts` — extender con cálculos de distribución
- `src/types/index.ts` — agregar `DistribucionAgua` al tipo `EstanqueConfig`

# 01: Dashboard Responsive en Panel Lateral

**Status**: Completada
**Prioridad**: Media
**Archivo principal**: `src/components/dashboard/TerrenoDashboard.tsx`

---

## Problema

Al no seleccionar zona/planta, el panel lateral muestra el dashboard del terreno con 4 columnas de stats (Área usada, Agua, Plantas, Alertas). En el panel de 320px esto se desborda y complica la lectura.

## Solución

- Cambiar el grid de 4 columnas a 2 columnas o stack vertical dentro del panel lateral
- Los stats deben ser legibles sin scroll horizontal
- Considerar usar un layout de lista vertical con separadores en vez de grid de columnas

## Archivos a modificar

- `src/components/dashboard/TerrenoDashboard.tsx` — layout del grid de stats

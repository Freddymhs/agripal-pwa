# FASE 10C: Mejoras UX + Agua Funcional + Datos Agrícolas

**Status**: COMPLETADA
**Prioridad**: Alta
**Dependencias**: FASE_8A, FASE_5D, FASE_8
**Origen**: Revisión de usuario final sobre experiencia real de uso

---

## Contexto

Revisión completa como usuario final de AgriPlan. Se identificaron problemas de UX, funcionalidades incompletas en agua/estanques, y features necesarias para que la herramienta sea realmente útil para agricultores.

**Nota**: La app usa `data/static/` como BD estática. La mayoría de features son realizables con datos estáticos + IndexedDB.

---

## Sub-fases

| Archivo                       | Tema                                                             | Status |
| ----------------------------- | ---------------------------------------------------------------- | ------ |
| `01-dashboard-responsive.md`  | Dashboard desbordado en panel lateral                            | DONE   |
| `02-estanques-funcionales.md` | Rellenar estanque, configurar gasto, goteo                       | DONE   |
| `03-agua-por-zona.md`         | Consumo de agua por zona de cultivo                              | DONE   |
| `04-fuentes-agua-calidad.md`  | Fuente de agua, proveedores, calidad (boro, salinidad, arsénico) | DONE   |
| `05-suelo-nutrientes.md`      | Datos químicos del terreno, preparación, fertilizantes           | DONE   |
| `06-clima-impacto-riego.md`   | Clima afectando riego, camanchaca, humedad                       | DONE   |
| `07-semillas-mercado.md`      | Tipos de semilla, mercado, universidad, tierra líquida, algas    | DONE   |
| `08-calidad-fruto-roi.md`     | Predicción calidad fruto, precio venta, ROI del proyecto         | DONE   |

---

## Qué ya se corrigió (fuera de esta fase)

- [x] Click en zona selecciona planta por accidente → Botones "Zonas" / "Plantas" separados
- [x] Cambiar tipo de zona con plantas dentro → Bloqueado con mensaje
- [x] Plantas todas del mismo color → Color único por tipo de cultivo
- [x] Borde de zona no distingue cultivo → Borde hereda color si monocultura
- [x] Achicamiento de zona con plantas fuera → Ya estaba bloqueado correctamente

## Qué se excluye

- Sensores IoT (fase futura muy lejana, requiere hardware)

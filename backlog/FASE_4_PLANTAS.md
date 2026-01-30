# FASE 4: Sistema de Plantas

**Status**: ✅ COMPLETADO
**Prioridad**: 🔴 Alta
**Dependencias**: FASE_3
**Estimación**: 4-5 horas

---

## Objetivo

Implementar colocación de plantas: individual (click) y en grilla automática con preview.

---

## ⚠️ REGLAS DE ESPACIADO (CRÍTICO)

### Principio Fundamental
**Cada planta tiene UN espaciado (`espaciado_recomendado_m`) - no existen "mínimos" ni "advertencias".**

Si una planta dice que necesita 2m de espacio, necesita 2m. Punto.

### Cálculos de Validación
```
espaciado = cultivo.espaciado_recomendado_m
margenBorde = espaciado / 2

✅ Válido si:
- Distancia a TODOS los bordes >= margenBorde
- Distancia a TODAS las plantas >= espaciado

❌ Inválido si:
- Cualquier borde o planta está demasiado cerca
```

### Ejemplo: Cultivo General (espaciado: 2m)
- Margen del borde requerido: 1m
- Distancia entre plantas requerida: 2m
- Si está a 0.8m del borde → **ERROR** (no advertencia)

### Validación Completa
La validación debe mostrar **TODOS** los problemas encontrados, no solo el primero:
```
No se puede plantar aquí:
• Borde derecho: 0.63m
• Borde inferior: 0.63m
• Otra planta: 1.57m

Cultivo General necesita:
• 1m del borde
• 2m entre plantas
```

### Cultivo Obligatorio
El cultivo es **OBLIGATORIO** para plantar. No existen fallbacks ni valores por defecto.
Si un cultivo no tiene `espaciado_recomendado_m` configurado, no se puede usar para plantar.

---

## Tamaño Visual de Plantas

El radio del marcador refleja el espaciado del cultivo:
```typescript
radio = (espaciado_recomendado_m / 2) * PIXELS_POR_METRO
```

- Zanahoria (0.08m) = círculos pequeños
- Tomate (0.6m) = círculos medianos
- Cultivo General (2m) = círculos grandes

---

## Reglas de Negocio

1. **Solo en zonas tipo "cultivo"** - No se pueden poner plantas en bodega/casa/etc.
2. **Espaciado**: Definido por `espaciado_recomendado_m` del cultivo (obligatorio)
3. **Margen del borde**: `espaciado / 2` - la planta necesita espacio hacia todos los lados
4. **Posición relativa**: Coordenadas son relativas a la zona, no al terreno
5. **Validación estricta**: Si no cumple → ERROR (no hay advertencias)
6. **Mostrar todos los problemas**: No solo el primero
7. **Grid automático**: Preview antes de confirmar, centrado en zona
8. **Estados**: plantada → creciendo → produciendo → muerta

---

## Archivos de Implementación

Ver código actual en:
- `src/lib/validations/planta.ts` - Validaciones de espaciado
- `src/hooks/usePlantas.ts` - Hook CRUD de plantas
- `src/components/mapa/planta-marker.tsx` - Marcador visual
- `src/components/plantas/grid-automatico-modal.tsx` - Modal de grilla
- `src/components/plantas/planta-info.tsx` - Panel de información

---

## Criterios de Aceptación

- [x] Solo se puede plantar en zonas tipo "cultivo"
- [x] Click en zona cultivo coloca planta individual
- [x] Validación de espaciado estricta (sin advertencias)
- [x] Validación de margen de borde = espaciado/2
- [x] Muestra TODOS los problemas de validación
- [x] Grid automático muestra preview con conteo
- [x] Grid respeta plantas existentes
- [x] Plantas muestran color según estado
- [x] Se puede cambiar estado de planta
- [x] Plantas muertas tienen visual diferente (X)
- [x] Se puede eliminar planta individual
- [x] Panel de info muestra datos del cultivo
- [x] Cultivo es OBLIGATORIO para plantar
- [x] Plantas se guardan en IndexedDB

---

## Siguiente Fase

**FASE_4B_SELECCION_MULTIPLE** - Selección múltiple de plantas con Shift+arrastrar

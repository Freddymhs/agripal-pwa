# Futuro: Integraciones con APIs Externas

**Prioridad:** Post-MVP
**Dependencias:** Sprint 1-4 completos

---

## 🎯 Objetivo

Integrar APIs de clima, precios y otros servicios para enriquecer la app.

---

## 📋 APIs Identificadas

### 1. Clima - INIA Agromet (GRATIS)
```
URL: https://agrometeorologia.cl
Datos:
- Temperatura aire/suelo
- Humedad relativa
- Radiación solar
- Viento
- ET0 (evapotranspiración)
- Grados-día
```

### 2. Clima - Open-Meteo (GRATIS)
```
URL: https://open-meteo.com
Datos:
- Forecast 16 días
- Histórico 80 años
- ET0 FAO-56
Sin API key requerida
```

### 3. Precios - ODEPA (GRATIS)
```
URL: https://datos.odepa.gob.cl
Datos:
- Precios mayoristas frutas/hortalizas
- Mercados: Lo Valledor, Vega Central, etc.
- Actualización diaria
```

---

## 📋 Uso en la App

```typescript
// Ejemplo: Obtener ET0 para cálculo de riego
async function obtenerET0(lat: number, lon: number): Promise<number> {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=et0_fao_evapotranspiration`
  );
  const data = await response.json();
  return data.hourly.et0_fao_evapotranspiration[0];
}

// Ejemplo: Obtener precio de mercado
async function obtenerPrecioODEPA(producto: string): Promise<number> {
  // Scraping o API según disponibilidad
}
```

---

## 📋 Datos de Sensores (Manual/IoT)

Si no hay API, el usuario puede ingresar manualmente:
- Humedad del suelo
- Temperatura local
- Velocidad del viento
- pH del agua

Futuro: Integración con sensores IoT (ESP32, LoRa).

---

## ✅ Criterios de Éxito

- [ ] Integrar INIA Agromet o Open-Meteo
- [ ] Mostrar clima en dashboard
- [ ] Calcular riego basado en ET0
- [ ] Integrar precios ODEPA
- [ ] Fallback a input manual

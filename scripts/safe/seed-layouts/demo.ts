/**
 * demo.ts — Layout demo genérico para la cuenta de prueba.
 *
 * Restaura el "Proyecto Regional" de prueba@agriplan.cl con un terreno
 * 50x100m y 4 zonas básicas (2 cultivo, 1 estanque, 1 bodega) como
 * starter de onboarding/showcase.
 *
 * Uso: pnpm seed:demo
 */

import { bodega, cultivo, estanque, runLayout } from "../../lib/builder";

runLayout({
  label: "demo",
  email: "prueba@agriplan.cl",
  terreno: { ancho: 50, alto: 100, agua: 15 },
  zonas: [
    cultivo("Zona Cultivo A", { x:  5, y:  5, w: 40, h: 30, notas: "Zona de cultivo de ejemplo." }),
    cultivo("Zona Cultivo B", { x:  5, y: 40, w: 40, h: 30, notas: "Segunda zona de cultivo de ejemplo." }),
    estanque("Estanque Ejemplo", { x:  5, y: 75, w: 10, h: 10, capacidad: 15, notas: "Estanque de agua de ejemplo." }),
    bodega("Bodega Ejemplo",     { x: 35, y: 75, w: 10, h: 10, notas: "Bodega de herramientas e insumos de ejemplo." }),
  ],
});

/**
 * owner.ts — Layout productivo real del owner del proyecto.
 *
 * Restaura el "Proyecto Regional" del usuario en SEED_USER_EMAIL
 * con su terreno y 16 zonas reales (cultivos C1–C5, estanques, bodegas,
 * casa, sanitarios, empaque, apron de carga, etc).
 *
 * Uso: pnpm seed:owner
 */

import {
  apron,
  bodega,
  casa,
  compostera,
  cultivo,
  empaque,
  estanque,
  garage,
  runLayout,
  sanitario,
} from "../../lib/builder";

const email = process.env.SEED_USER_EMAIL;
if (!email) throw new Error("Falta SEED_USER_EMAIL en .env.local");

runLayout({
  label: "owner",
  email,
  terreno: { ancho: 74, alto: 181, agua: 20 },
  zonas: [
    cultivo("C5",  { x:  5, y:   5, w: 64, h: 22, notas: "Franja norte. Choclo año 1 (tolera boro/sal), luego Maracuya espaldera N-S." }),
    cultivo("C4",  { x:  5, y:  32, w: 17, h: 78, notas: "Columna oeste. Tuna: costo casi cero, poca agua, producción año 3+." }),
    cultivo("C3a", { x: 30, y:  32, w: 39, h: 35, notas: "Mejor zona: punto alto + primer sol + cerca del estanque. Granada año 2-4." }),
    cultivo("C3b", { x: 30, y:  67, w: 24, h: 15, notas: "Maracuya espaldera, postes E-O. Retorno rápido 8-10 meses." }),
    estanque("Estanques", { x: 54, y: 67, w: 15, h: 15, capacidad: 20, torre: 7, notas: "4 slots 3x3m en grilla 2x2. Empieza 1x20.000L, expande a 80.000L." }),
    cultivo("C2",  { x: 30, y:  87, w: 39, h: 40, notas: "Granada permanente año 2+. Bloque central derecho." }),
    compostera("Compostera",                  { x:  5, y: 111, w:  8, h:  4, notas: "Estiércol + restos de poda. Materia orgánica para suelo desértico." }),
    bodega("Bodega Cosecha",                  { x:  5, y: 116, w: 10, h: 15, notas: "Palas, podadoras, EPP, motobomba, repuestos riego." }),
    bodega("Bodega Insumos y Herramienta",    { x:  5, y: 131, w: 10, h: 12, notas: "Fertilizantes, gabinete químico, 200-300 cajas. Futura cámara fría." }),
    cultivo("C1",  { x: 30, y: 132, w: 39, h: 35, notas: "Más cercano al apron. Choclo año 1-2, luego Maracuya. <30m al apron." }),
    garage("Garage",                          { x:  5, y: 146, w: 10, h:  6, notas: "Porter K2500 + auto + moto. Puerta hacia corredor interior." }),
    casa("Casa",                              { x:  5, y: 152, w: 10, h: 10, notas: "14x10m. Dormitorio litera, living/cocina, baño." }),
    sanitario("Bano",                         { x:  5, y: 162, w:  5, h:  5 }),
    empaque("Empaque",                        { x: 30, y: 167, w: 39, h:  4, notas: "Área techada para pesar, calidad y armar cajas antes del Porter." }),
    sanitario("Fosa Septica",                 { x:  5, y: 172, w:  5, h:  5, notas: "Tanque subterráneo. Acceso para limpiafosa." }),
    apron("Apron Carga",                      { x: 10, y: 171, w: 59, h:  6, notas: "Porter K2500 + carga lateral + carretilla = 4.7m mín. Ripio compactado." }),
  ],
});

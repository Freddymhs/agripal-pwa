/**
 * Proveedores de hidrogel en Chile.
 * Info comercial que puede cambiar (URLs, nombres, disponibilidad).
 * TODO: evaluar si esto se mueve a Supabase para poder actualizar sin deploy.
 */
export const PROVEEDORES_HIDROGEL_CHILE = [
  {
    nombre: "Raindrops",
    url: "raindrops.cl",
    ventaja: "Aplica en SECO, 400L/kg",
  },
  {
    nombre: "PlusAgro",
    url: "plusagro.cl",
    ventaja: "Biodegradable, 85% ahorro",
  },
  {
    nombre: "Plantagel",
    url: "plantagel.com",
    ventaja: "Contacto: info@plantagel.com",
  },
] as const;

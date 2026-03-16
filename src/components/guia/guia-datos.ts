import { ROUTES } from "@/lib/constants/routes";

export interface GuiaPaso {
  id: string;
  titulo: string;
  valor: string;
  comoFunciona: string;
  ejemplo: string;
  ruta: string;
  rutaLabel: string;
}

export interface GuiaSeccionData {
  id: string;
  titulo: string;
  subtitulo: string;
  resultado: string;
  pasos: GuiaPaso[];
}

export const GUIA_SECCIONES: GuiaSeccionData[] = [
  {
    id: "configurar",
    titulo: "Configurar",
    subtitulo: "Lo haces una vez",
    resultado: "Tu terreno listo para planificar",
    pasos: [
      {
        id: "proyecto",
        titulo: "Crear proyecto",
        valor:
          "Tendrás un espacio digital para tu finca con toda la info organizada.",
        comoFunciona:
          "Escribe el nombre de tu finca y una referencia de ubicación. Puedes tener varios proyectos si manejas más de un predio.",
        ejemplo: "Finca Azapa — Pampa elevada, 3 ha",
        ruta: ROUTES.HOME,
        rutaLabel: "Ir al mapa",
      },
      {
        id: "terreno",
        titulo: "Definir terreno",
        valor:
          "Sabrás el tamaño exacto de cada parcela y su superficie disponible.",
        comoFunciona:
          "Ingresa el ancho y alto en metros. El sistema calcula el área y te da un lienzo donde dibujar zonas.",
        ejemplo: "100m × 80m → 8.000 m²",
        ruta: ROUTES.HOME,
        rutaLabel: "Ir al mapa",
      },
      {
        id: "agua",
        titulo: "Fuente de agua",
        valor:
          "El sistema calculará cuánta agua necesitas y te avisará si falta.",
        comoFunciona:
          "Configura de dónde viene tu agua (pozo, camión, canal), la calidad (boro, salinidad) y el tipo de riego (goteo, aspersión).",
        ejemplo: "Pozo artesiano — boro 2.5 ppm — riego por goteo",
        ruta: ROUTES.AGUA_CONFIGURACION,
        rutaLabel: "Configurar agua",
      },
      {
        id: "suelo",
        titulo: "Tipo de suelo",
        valor:
          "Sabrás si tu tierra es apta y cuánto puede reducir el rendimiento si no lo es.",
        comoFunciona:
          "Ingresa pH, salinidad y textura de tu análisis de suelo. El sistema evalúa compatibilidad con cada cultivo y te avisa si el rendimiento baja (20-70% según el problema). Sin análisis, usa valores típicos de la pampa.",
        ejemplo:
          "pH 7.2, franco-arenoso → compatible con olivo (100% rendimiento)",
        ruta: ROUTES.TERRENOS_SUELO,
        rutaLabel: "Ver suelo",
      },
      {
        id: "catalogo",
        titulo: "Catálogo de cultivos",
        valor:
          "Tendrás fichas técnicas de 25+ cultivos calibrados para tu región.",
        comoFunciona:
          "Revisa las fichas con días a cosecha, consumo de agua, precio de mercado. Puedes editar o agregar cultivos propios.",
        ejemplo: "Tuna → 90 días, Kc 0.5, $1.200/kg mayorista",
        ruta: ROUTES.DATOS_CATALOGO,
        rutaLabel: "Ver catálogo",
      },
    ],
  },
  {
    id: "operar",
    titulo: "Operar",
    subtitulo: "Tu día a día",
    resultado: "Cultivos plantados y cosechas registradas",
    pasos: [
      {
        id: "mapa",
        titulo: "Diseñar en el mapa",
        valor: "Verás tu finca completa con zonas, estanques y plantas.",
        comoFunciona:
          "Dibuja zonas (cultivo, estanque, bodega) y planta en grilla automática. El sistema calcula espaciado según el cultivo.",
        ejemplo: "Zona A (tomate) — 45 plantas a 40 cm",
        ruta: ROUTES.HOME,
        rutaLabel: "Abrir mapa",
      },
      {
        id: "riego",
        titulo: "Controlar riego",
        valor:
          "Sabrás cuánta agua usaste y si estás regando de más o de menos.",
        comoFunciona:
          "Registra cada entrada de agua al estanque. El sistema descuenta el consumo diario automáticamente según tus cultivos.",
        ejemplo: "Hoy regué 2 m³ → quedan 8 m³ (5 días)",
        ruta: ROUTES.AGUA,
        rutaLabel: "Ver agua",
      },
      {
        id: "cosecha",
        titulo: "Registrar cosecha",
        valor:
          "Conocerás tu producción real vs. la esperada para mejorar cada temporada.",
        comoFunciona:
          "Selecciona zona, cultivo, ingresa los kg y la calidad (A, B o C). Si vendiste, anota el precio. El sistema te avisa la vida útil.",
        ejemplo: "160 kg tomate calidad B → $99.200",
        ruta: ROUTES.COSECHAS,
        rutaLabel: "Registrar cosecha",
      },
      {
        id: "insumos",
        titulo: "Revisar insumos",
        valor: "Verificarás si puedes mezclar tus agroquímicos sin riesgo.",
        comoFunciona:
          "Agrega los productos que tienes (fertilizantes, fungicidas). Selecciona 2 o 3 y el sistema te dice si son compatibles.",
        ejemplo: "¿Fungicida + fertilizante? → Compatible",
        ruta: ROUTES.DATOS_INSUMOS,
        rutaLabel: "Ver insumos",
      },
    ],
  },
  {
    id: "analizar",
    titulo: "Analizar",
    subtitulo: "Revisa resultados",
    resultado: "Sabes si tu terreno es rentable",
    pasos: [
      {
        id: "economia",
        titulo: "Ver economía",
        valor:
          "Sabrás si cada cultivo te deja ganancia o pérdida, con números claros.",
        comoFunciona:
          "El sistema cruza inversión (plantas + agua) con producción esperada y precio de mercado. Calcula ROI a 4 años, punto de equilibrio, costo por kilo y margen de ganancia. En modo avanzado ves payback y contribución por zona.",
        ejemplo: "Olivo → ROI 340%, costo $350/kg, equilibrio en 18 meses",
        ruta: ROUTES.ECONOMIA,
        rutaLabel: "Ver economía",
      },
      {
        id: "escenarios",
        titulo: "Comparar cultivos",
        valor:
          "Evaluarás hasta 3 cultivos lado a lado antes de decidir qué sembrar.",
        comoFunciona:
          "Selecciona 2 o 3 cultivos y compara ROI, consumo de agua, días a cosecha, compatibilidad con tu suelo y riesgo de plagas. El sistema te recomienda la mejor opción para tu terreno.",
        ejemplo:
          "¿Tuna, olivo o higuera? → Olivo gana en ROI, tuna en velocidad",
        ruta: ROUTES.ECONOMIA_ESCENARIOS,
        rutaLabel: "Comparar cultivos",
      },
      {
        id: "alertas",
        titulo: "Recibir alertas",
        valor: "No se te olvidará regar, fumigar ni cosechar a tiempo.",
        comoFunciona:
          "El sistema detecta problemas automáticamente: agua baja, salinidad acumulada, riesgo de plagas por cultivo y temporada. Predice qué plagas pueden afectarte según temperatura y etapa de crecimiento, con medidas preventivas.",
        ejemplo: "Agua para 5 días — Riesgo alto de mosca blanca en tomate",
        ruta: ROUTES.ALERTAS,
        rutaLabel: "Ver alertas",
      },
      {
        id: "planificador",
        titulo: "Planificar temporada",
        valor:
          "Tendrás un plan claro de qué sembrar, cuándo y dónde la próxima temporada.",
        comoFunciona:
          "Proyección a 12 meses con nivel de agua esperado, eventos clave (recargas, cosechas, lavados) y costos acumulados.",
        ejemplo: "Marzo déficit → programar recarga extra",
        ruta: ROUTES.AGUA_PLANIFICADOR,
        rutaLabel: "Abrir planificador",
      },
    ],
  },
];

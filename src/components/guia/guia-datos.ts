import { ROUTES } from "@/lib/constants/routes";

export interface GuiaPaso {
  id: string;
  titulo: string;
  valor: string;
  comoFunciona: string;
  ejemplo: string;
  ruta: string;
  rutaLabel: string;
  scope: "Proyecto" | "Terreno" | "Zona";
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
        scope: "Proyecto",
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
        scope: "Terreno",
      },
      {
        id: "clima",
        titulo: "Clima de tu región",
        valor:
          "Los cálculos de agua usarán datos climáticos reales de tu zona.",
        comoFunciona:
          "Selecciona la región climática más cercana a tu terreno. Esto ajusta la evapotranspiración (ET0) y los factores estacionales de consumo de agua. Hazlo antes de configurar agua o plantar.",
        ejemplo:
          "Pampa Arica → ET0 alto, lluvias casi nulas, temporada seca todo el año.",
        ruta: ROUTES.DATOS_CLIMA,
        rutaLabel: "Elegir clima para mi proyecto",
        scope: "Proyecto",
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
        rutaLabel: "Configurar suelo de mi proyecto",
        scope: "Terreno",
      },
      {
        id: "agua",
        titulo: "Crear fuente de agua y proveedor",
        valor:
          "Tendrás registrada tu fuente de agua con su calidad, y un proveedor con el precio por m³ que te cobra.",
        comoFunciona:
          "Son dos cosas separadas: (1) Fuente de agua = de dónde viene (río, pozo, aljibe) y su calidad (boro, salinidad). La fuente NO tiene precio. (2) Proveedor = quién te vende el agua y a cuánto el m³. Pregúntale a tu proveedor cuánto cuesta el metro cúbico — ese dato es clave para que la economía sea precisa. Todavía no los asignas a nada — eso se hace después al configurar el estanque y la recarga.",
        ejemplo:
          "Fuente: Río Azapa (subterránea, boro 2.1 ppm) — Proveedor: $2.000/m³",
        ruta: ROUTES.AGUA_CONFIGURACION,
        rutaLabel: "Configurar agua",
        scope: "Proyecto",
      },
      {
        id: "catalogo",
        titulo: "Catálogo de cultivos",
        valor:
          "Tendrás fichas técnicas de 26+ cultivos calibrados para tu región con precios ODEPA reales.",
        comoFunciona:
          "Revisa las fichas con días a cosecha, consumo de agua (Kc por etapa), precio de mercado ODEPA y producción calibrada. Cada cultivo tiene coeficiente Kc específico, etapas de crecimiento y datos de plagas. Los precios se actualizan automáticamente desde ODEPA con protección contra valores anómalos. Puedes editar o agregar cultivos propios.",
        ejemplo: "Tuna → 90 días, Kc 0.5, $1.200/kg mayorista",
        ruta: ROUTES.DATOS_CATALOGO,
        rutaLabel: "Gestionar mi catálogo",
        scope: "Proyecto",
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
        titulo: "Crear zonas, estanques y plantar",
        valor:
          "Organizarás tu terreno con áreas de cultivo, estanques de agua y plantas distribuidas.",
        comoFunciona:
          "Necesitas al menos una zona de cultivo, un estanque y plantas para continuar. Dibuja las zonas sobre el terreno, luego selecciona un cultivo del catálogo y planta — el sistema distribuye las plantas en grilla con el espaciado correcto.",
        ejemplo: "Zona A (tuna) — 30 plantas a 3m — Estanque 30 m³",
        ruta: ROUTES.HOME,
        rutaLabel: "Abrir mapa",
        scope: "Terreno",
      },
      {
        id: "fuente-estanque",
        titulo: "Asignar fuente de agua al estanque",
        valor:
          "El sistema verificará si tu agua es compatible con los cultivos que plantaste.",
        comoFunciona:
          "Abre el panel del estanque en el mapa y selecciona la fuente de agua que lo abastece. El sistema evaluará boro, salinidad y pH contra los cultivos de tu terreno y te dirá si son compatibles.",
        ejemplo:
          "Estanque 1 → Fuente: Río Azapa (subterránea) — Compatible con Tuna, Pitahaya",
        ruta: ROUTES.HOME,
        rutaLabel: "Abrir mapa",
        scope: "Terreno",
      },
      {
        id: "recarga",
        titulo: "Configurar recarga del estanque",
        valor:
          "El sistema proyectará tu consumo y te avisará antes de quedarte sin agua.",
        comoFunciona:
          "En el mapa, selecciona tu terreno y usa el panel de agua para configurar la recarga del estanque: cada cuántos días llega agua y cuántos m³ por viaje. Aquí eliges el proveedor que creaste antes (su precio/m³ es el costo base del agua). Opcionalmente, agrega el costo de transporte/delivery por viaje — el sistema lo divide entre los m³ entregados. El costo total del agua = precio del proveedor + transporte amortizado. Si compartes el camión aljibe con otros, ingresa solo tu porción del flete.",
        ejemplo:
          "Cada 7 días — 1.5 m³ — Proveedor: Río Azapa ($2.000/m³) + transporte $6.438",
        ruta: ROUTES.HOME,
        rutaLabel: "Ir al mapa",
        scope: "Terreno",
      },
      {
        id: "riego",
        titulo: "Configurar riego por zona",
        valor:
          "Con este paso el sistema ya puede calcular la rentabilidad real de tus cultivos.",
        comoFunciona:
          "Selecciona tu zona de cultivo en el mapa y elige Configurar Riego. El sistema te muestra cuántos litros necesita cada planta según el cultivo. Define el tipo de riego (balde, goteo) y la frecuencia. Este es el último paso obligatorio — después de esto ya puedes ir a Economía y ver resultados reales.",
        ejemplo:
          "Pitahaya — 2 L/planta cada 7 días — 59 plantas = 118 L por sesión",
        ruta: ROUTES.HOME,
        rutaLabel: "Ir al mapa",
        scope: "Zona",
      },
      {
        id: "control-agua",
        titulo: "Controlar agua día a día",
        valor:
          "Mantendrás tu estanque digital sincronizado con el real para anticipar cuándo pedir agua.",
        comoFunciona:
          "Opcional pero útil. Registra cada entrada de agua al estanque para que el sistema refleje tu nivel real. No afecta el cálculo de economía — solo te ayuda a saber cuántos días de agua te quedan y cuándo programar la próxima recarga.",
        ejemplo: "Hoy cargué 1.5 m³ → quedan 3.7 m³ → alcanza 5 días",
        ruta: ROUTES.HOME,
        rutaLabel: "Ir al mapa",
        scope: "Proyecto",
      },
    ],
  },
  {
    id: "analizar",
    titulo: "Analizar",
    subtitulo: "Tus resultados",
    resultado:
      "Sabes si tu terreno es rentable y tienes documentos para demostrarlo",
    pasos: [
      {
        id: "economia",
        titulo: "Ver economía",
        valor:
          "Sabrás si cada cultivo te deja ganancia o pérdida, con números claros.",
        comoFunciona:
          "El sistema cruza inversión (plantas + agua) con producción esperada y precio de mercado. Calcula ROI a 10 años, punto de equilibrio, costo efectivo del agua, precio break-even del agua y meses hasta primera cosecha. Usa coeficientes Kc calibrados por cultivo, factores de suelo (pH, salinidad, boro) y eficiencia de riego para proyecciones realistas.",
        ejemplo: "Olivo → ROI 120%, recuperas inversión en 28 meses",
        ruta: ROUTES.ECONOMIA,
        rutaLabel: "Ver economía",
        scope: "Proyecto",
      },
    ],
  },
  {
    id: "extras",
    titulo: "Más herramientas",
    subtitulo: "Cuando las necesites",
    resultado: "Herramientas adicionales para optimizar tu operación",
    pasos: [
      {
        id: "escenarios",
        titulo: "Comparar cultivos",
        valor:
          "Evaluarás hasta 3 cultivos lado a lado antes de decidir qué sembrar.",
        comoFunciona:
          "Selecciona 2 o 3 cultivos y compara ROI, consumo de agua, días a cosecha, compatibilidad con tu suelo y riesgo de plagas. El sistema te recomienda la mejor opción para tu terreno.",
        ejemplo:
          "¿Tuna, olivo o higuera? → Olivo gana en ROI, tuna en velocidad",
        ruta: ROUTES.ECONOMIA,
        rutaLabel: "Ver economia",
        scope: "Proyecto",
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
        scope: "Zona",
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
        scope: "Proyecto",
      },
      {
        id: "plagas",
        titulo: "Revisar riesgo de plagas",
        valor:
          "Sabrás qué plagas amenazan tus cultivos según la temporada y podrás actuar antes.",
        comoFunciona:
          "Muestra las plagas más comunes por cultivo y temporada según datos históricos de la región. Incluye nivel de riesgo estimado y medidas preventivas recomendadas — no requiere sensores.",
        ejemplo:
          "Tomate en verano → Riesgo alto de mosca blanca — aplicar trampas amarillas",
        ruta: ROUTES.DATOS_PLAGAS,
        rutaLabel: "Ver plagas",
        scope: "Proyecto",
      },
    ],
  },
];

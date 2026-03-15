import type { useAlertas } from "@/hooks/use-alertas";
import type { useEstanques } from "@/hooks/use-estanques";
import type { useZonas } from "@/hooks/use-zonas";
import type { usePlantas } from "@/hooks/use-plantas";
import type { usePlantasLote } from "@/hooks/use-plantas-lote";
import type { useDatosBase } from "@/hooks/use-datos-base";
import type {
  Terreno,
  Zona,
  Planta,
  CatalogoCultivo,
  Proyecto,
  DashboardTerreno,
  Usuario,
} from "@/types";

export interface ProjectContextType {
  usuario: Usuario | null;
  authLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;

  proyectoActual: Proyecto | null;
  terrenoActual: Terreno | null;
  setTerrenoActual: (t: Terreno | null) => void;
  proyectos: Proyecto[];
  terrenos: Terreno[];

  zonas: Zona[];
  plantas: Planta[];
  catalogoCultivos: CatalogoCultivo[];
  loading: boolean;
  initialLoad: boolean;

  alertasHook: ReturnType<typeof useAlertas>;
  estanquesHook: ReturnType<typeof useEstanques>;
  zonasHook: ReturnType<typeof useZonas>;
  plantasHook: ReturnType<typeof usePlantas>;
  plantasLoteHook: ReturnType<typeof usePlantasLote>;
  datosBaseHook: ReturnType<typeof useDatosBase>;

  dashboard: DashboardTerreno | null;
  CULTIVOS_ESPACIADO: Record<string, number>;
  CULTIVOS_COLORES: Record<string, number>;

  cargarDatosTerreno: () => Promise<void>;
  handleSelectProyecto: (p: Proyecto) => void;
  handleSelectTerreno: (t: Terreno) => void;
  handleCrearProyecto: (data: {
    nombre: string;
    ubicacion: string;
  }) => Promise<void>;
  handleCrearTerreno: (data: {
    nombre: string;
    ancho_m: number;
    alto_m: number;
  }) => Promise<void>;
  handleGuardarConfigAvanzada: (updates: Partial<Terreno>) => Promise<void>;
  handleCambiarFuente: (estanqueId: string, fuenteId: string) => Promise<void>;

  showCrearProyecto: boolean;
  setShowCrearProyecto: (v: boolean) => void;
  showCrearTerreno: boolean;
  setShowCrearTerreno: (v: boolean) => void;
  showConfigAvanzada: boolean;
  setShowConfigAvanzada: (v: boolean) => void;
}

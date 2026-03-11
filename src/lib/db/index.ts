import Dexie, { type Table } from "dexie";
import type {
  Usuario,
  Proyecto,
  Terreno,
  Zona,
  Planta,
  CatalogoCultivo,
  EntradaAgua,
  Cosecha,
  Alerta,
  HistorialEntrada,
  SyncItem,
  SyncMeta,
  InsumoUsuario,
} from "@/types";

export class AgriPlanDB extends Dexie {
  usuarios!: Table<Usuario>;
  proyectos!: Table<Proyecto>;
  terrenos!: Table<Terreno>;
  zonas!: Table<Zona>;
  plantas!: Table<Planta>;
  catalogo_cultivos!: Table<CatalogoCultivo>;
  entradas_agua!: Table<EntradaAgua>;
  cosechas!: Table<Cosecha>;
  alertas!: Table<Alerta>;
  historial!: Table<HistorialEntrada>;
  sync_queue!: Table<SyncItem>;
  sync_meta!: Table<SyncMeta>;
  insumos_usuario!: Table<InsumoUsuario>;

  constructor() {
    super("AgriPlanDB");

    this.version(1).stores({
      usuarios: "id, email",
      proyectos: "id, usuario_id, nombre",
      terrenos: "id, proyecto_id, nombre",
      zonas: "id, terreno_id, tipo, nombre",
      plantas: "id, zona_id, tipo_cultivo_id, estado",
      catalogo_cultivos: "id, proyecto_id, nombre, tier",
      entradas_agua: "id, terreno_id, fecha",
      cosechas: "id, zona_id, tipo_cultivo_id, fecha",
      alertas: "id, terreno_id, tipo, estado, severidad",
      historial: "id, usuario_id, terreno_id, tipo_accion, created_at",
      sync_queue: "id, entidad, estado, created_at",
    });

    this.version(2).stores({
      usuarios: "id, email",
      proyectos: "id, usuario_id, nombre, lastModified",
      terrenos: "id, proyecto_id, nombre, lastModified",
      zonas: "id, terreno_id, tipo, nombre, lastModified",
      plantas: "id, zona_id, tipo_cultivo_id, estado, lastModified",
      catalogo_cultivos: "id, proyecto_id, nombre, tier",
      entradas_agua: "id, terreno_id, fecha, lastModified",
      cosechas: "id, zona_id, tipo_cultivo_id, fecha, lastModified",
      alertas: "id, terreno_id, tipo, estado, severidad, lastModified",
      historial: "id, usuario_id, terreno_id, tipo_accion, created_at",
      sync_queue:
        "id, entidad, entidad_id, estado, created_at, nextRetryAt, [entidad+entidad_id]",
      sync_meta: "key",
    });

    this.version(3).stores({
      usuarios: "id, email",
      proyectos: "id, usuario_id, nombre, lastModified",
      terrenos: "id, proyecto_id, nombre, lastModified",
      zonas: "id, terreno_id, tipo, nombre, lastModified",
      plantas: "id, zona_id, tipo_cultivo_id, estado, lastModified",
      catalogo_cultivos: "id, proyecto_id, nombre, tier",
      entradas_agua: "id, terreno_id, fecha, lastModified",
      cosechas: "id, zona_id, tipo_cultivo_id, fecha, lastModified",
      alertas: "id, terreno_id, tipo, estado, severidad, lastModified",
      historial: "id, usuario_id, terreno_id, tipo_accion, created_at",
      sync_queue:
        "id, entidad, entidad_id, estado, created_at, nextRetryAt, [entidad+entidad_id]",
      sync_meta: "key",
      insumos_usuario: "id, terreno_id, nombre, tipo, created_at",
    });
  }
}

export const db = new AgriPlanDB();

// Exponer db en window solo en desarrollo (facilita testing E2E)
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  (window as Window & { __agriplanDb__?: AgriPlanDB }).__agriplanDb__ = db;
}

// Auto-enqueue sync en cada escritura a tablas sincronizables
import("@/lib/sync/db-hooks")
  .then(({ registerSyncHooks }) => {
    registerSyncHooks(db);
    // Warm in-memory sync flag immediately so hooks can check it synchronously
    // from the very first write, without waiting for the 2s doSync delay.
    import("@/lib/dal/sync-meta").then(({ syncMetaDAL }) => {
      syncMetaDAL.isSyncHabilitado().catch(() => {});
    });
  })
  .catch(() => {
    // Sync hooks son opcionales — si falla el import, la app sigue funcionando
  });

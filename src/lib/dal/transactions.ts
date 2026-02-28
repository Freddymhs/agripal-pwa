import { db } from "@/lib/db";
import type {
  Proyecto,
  CatalogoCultivo,
  EntradaAgua,
  Terreno,
  Zona,
  Planta,
  Alerta,
} from "@/types";
import { ESTADO_PLANTA } from "@/lib/constants/entities";

export const transaccionesDAL = {
  eliminarZonaCascade: (zonaId: string) =>
    db.transaction("rw", [db.plantas, db.zonas], async () => {
      await db.plantas.where("zona_id").equals(zonaId).delete();
      await db.zonas.delete(zonaId);
    }),

  eliminarTerrenoCascade: (terrenoId: string) =>
    db.transaction("rw", [db.plantas, db.zonas, db.terrenos], async () => {
      const zonas = await db.zonas
        .where("terreno_id")
        .equals(terrenoId)
        .toArray();
      const zonaIds = zonas.map((z) => z.id);
      if (zonaIds.length > 0) {
        await db.plantas.where("zona_id").anyOf(zonaIds).delete();
      }
      await db.zonas.where("terreno_id").equals(terrenoId).delete();
      await db.terrenos.delete(terrenoId);
    }),

  eliminarProyectoCascade: (proyectoId: string) =>
    db.transaction(
      "rw",
      [db.plantas, db.zonas, db.terrenos, db.catalogo_cultivos, db.proyectos],
      async () => {
        const terrenos = await db.terrenos
          .where("proyecto_id")
          .equals(proyectoId)
          .toArray();
        const terrenoIds = terrenos.map((t) => t.id);

        if (terrenoIds.length > 0) {
          const zonas = await db.zonas
            .where("terreno_id")
            .anyOf(terrenoIds)
            .toArray();
          const zonaIds = zonas.map((z) => z.id);
          if (zonaIds.length > 0) {
            await db.plantas.where("zona_id").anyOf(zonaIds).delete();
          }
          await db.zonas.where("terreno_id").anyOf(terrenoIds).delete();
        }

        await db.terrenos.where("proyecto_id").equals(proyectoId).delete();
        await db.catalogo_cultivos
          .where("proyecto_id")
          .equals(proyectoId)
          .delete();
        await db.proyectos.delete(proyectoId);
      },
    ),

  crearProyectoConCatalogo: (proyecto: Proyecto, cultivos: CatalogoCultivo[]) =>
    db.transaction("rw", [db.proyectos, db.catalogo_cultivos], async () => {
      await db.proyectos.add(proyecto);
      if (cultivos.length > 0) {
        await db.catalogo_cultivos.bulkAdd(cultivos);
      }
    }),

  seedCatalogo: (cultivos: CatalogoCultivo[]) =>
    db.transaction("rw", db.catalogo_cultivos, async () => {
      if (cultivos.length > 0) {
        await db.catalogo_cultivos.bulkAdd(cultivos);
      }
    }),

  transferirAgua: (
    origenId: string,
    origenUpdate: Partial<Zona>,
    destinoId: string,
    destinoUpdate: Partial<Zona>,
  ) =>
    db.transaction("rw", db.zonas, async () => {
      await db.zonas.update(origenId, origenUpdate);
      await db.zonas.update(destinoId, destinoUpdate);
    }),

  registrarEntradaAgua: (
    entrada: EntradaAgua,
    estanqueId: string,
    estanqueUpdate: Partial<Zona>,
    terrenoId: string,
    terrenoUpdate: Partial<Terreno>,
  ) =>
    db.transaction(
      "rw",
      [db.entradas_agua, db.zonas, db.terrenos],
      async () => {
        await db.entradas_agua.add(entrada);
        await db.zonas.update(estanqueId, estanqueUpdate);
        await db.terrenos.update(terrenoId, terrenoUpdate);
      },
    ),

  aplicarDescuentosAgua: (
    descuentos: Array<{ estanqueId: string; update: Partial<Zona> }>,
    terrenoId: string,
    terrenoUpdate: Partial<Terreno>,
  ) =>
    db.transaction("rw", [db.zonas, db.terrenos], async () => {
      for (const d of descuentos) {
        await db.zonas.update(d.estanqueId, d.update);
      }
      await db.terrenos.update(terrenoId, terrenoUpdate);
    }),

  actualizarEtapasLote: (
    actualizaciones: Array<{ id: string; cambios: Partial<Planta> }>,
  ) =>
    db.transaction("rw", db.plantas, async () => {
      for (const a of actualizaciones) {
        await db.plantas.update(a.id, a.cambios);
      }
    }),

  cambiarEstadoPlantasLote: (ids: string[], cambios: Partial<Planta>) =>
    db.transaction("rw", db.plantas, async () => {
      for (const id of ids) {
        await db.plantas.update(id, cambios);
      }
    }),

  sincronizarAlertas: (
    resolver: Array<{ id: string; cambios: Partial<Alerta> }>,
    nuevas: Alerta[],
  ) =>
    db.transaction("rw", db.alertas, async () => {
      for (const r of resolver) {
        await db.alertas.update(r.id, r.cambios);
      }
      for (const n of nuevas) {
        await db.alertas.add(n);
      }
    }),

  eliminarPlantasMuertas: (zonaId: string) =>
    db.transaction("rw", db.plantas, async () => {
      await db.plantas
        .where("zona_id")
        .equals(zonaId)
        .filter((p) => p.estado === ESTADO_PLANTA.MUERTA)
        .delete();
    }),
};

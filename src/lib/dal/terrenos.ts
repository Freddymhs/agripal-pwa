import { db } from "@/lib/db";
import type { Terreno } from "@/types";

export const terrenosDAL = {
  getAll: () => db.terrenos.toArray(),

  getById: (id: string) => db.terrenos.get(id),

  getByProyectoId: (proyectoId: string) =>
    db.terrenos.where("proyecto_id").equals(proyectoId).toArray(),

  add: (terreno: Terreno) => db.terrenos.add(terreno),

  update: (id: string, changes: Partial<Terreno>) =>
    db.terrenos.update(id, changes),

  delete: (id: string) => db.terrenos.delete(id),

  deleteByProyectoId: (proyectoId: string) =>
    db.terrenos.where("proyecto_id").equals(proyectoId).delete(),
};

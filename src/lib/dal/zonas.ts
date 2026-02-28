import { db } from "@/lib/db";
import type { Zona } from "@/types";

export const zonasDAL = {
  getByTerrenoId: (terrenoId: string) =>
    db.zonas.where("terreno_id").equals(terrenoId).toArray(),

  getByTerrenoIds: (terrenoIds: string[]) =>
    db.zonas.where("terreno_id").anyOf(terrenoIds).toArray(),

  add: (zona: Zona) => db.zonas.add(zona),

  update: (id: string, changes: Partial<Zona>) => db.zonas.update(id, changes),

  delete: (id: string) => db.zonas.delete(id),

  deleteByTerrenoId: (terrenoId: string) =>
    db.zonas.where("terreno_id").equals(terrenoId).delete(),

  deleteByTerrenoIds: (terrenoIds: string[]) =>
    db.zonas.where("terreno_id").anyOf(terrenoIds).delete(),
};

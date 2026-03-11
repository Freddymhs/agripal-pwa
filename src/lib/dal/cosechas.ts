import { db } from "@/lib/db";
import type { Cosecha } from "@/types";

export const cosechasDAL = {
  getByZonaId: (zonaId: string) =>
    db.cosechas.where("zona_id").equals(zonaId).toArray(),

  getByZonaIds: (zonaIds: string[]) =>
    db.cosechas.where("zona_id").anyOf(zonaIds).toArray(),

  add: (cosecha: Cosecha) => db.cosechas.add(cosecha),

  update: (id: string, changes: Partial<Cosecha>) =>
    db.cosechas.update(id, changes),

  delete: (id: string) => db.cosechas.delete(id),
};

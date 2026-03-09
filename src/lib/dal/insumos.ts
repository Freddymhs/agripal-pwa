import { db } from "@/lib/db";
import type { InsumoUsuario } from "@/types";

export const insumosDAL = {
  getAll: () => db.insumos_usuario.toArray(),

  getByTerrenoId: (terrenoId: string) =>
    db.insumos_usuario.where("terreno_id").equals(terrenoId).toArray(),

  add: (insumo: InsumoUsuario) => db.insumos_usuario.add(insumo),

  update: (id: string, changes: Partial<InsumoUsuario>) =>
    db.insumos_usuario.update(id, changes),

  delete: (id: string) => db.insumos_usuario.delete(id),
};

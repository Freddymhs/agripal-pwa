import { db } from "@/lib/db";
import type { Usuario } from "@/types";

export const usuariosDAL = {
  getById: (id: string) => db.usuarios.get(id),

  getByEmail: (email: string): Promise<Usuario | undefined> =>
    db.usuarios.where("email").equals(email).first(),

  add: (usuario: Usuario) => db.usuarios.add(usuario),
};

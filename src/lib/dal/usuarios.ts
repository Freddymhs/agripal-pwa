import { db } from '@/lib/db'
import type { Usuario } from '@/types'

export const usuariosDAL = {
  getById: (id: string) =>
    db.usuarios.get(id),

  getByEmail: async (email: string): Promise<Usuario | undefined> => {
    const all = await db.usuarios.toArray()
    return all.find(u => u.email === email)
  },

  add: (usuario: Usuario) =>
    db.usuarios.add(usuario),
}

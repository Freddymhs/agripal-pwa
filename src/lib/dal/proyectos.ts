import { db } from '@/lib/db'
import type { Proyecto } from '@/types'

export const proyectosDAL = {
  getByUsuarioId: (usuarioId: string) =>
    db.proyectos.where('usuario_id').equals(usuarioId).toArray(),

  add: (proyecto: Proyecto) =>
    db.proyectos.add(proyecto),

  update: (id: string, changes: Partial<Proyecto>) =>
    db.proyectos.update(id, changes),

  delete: (id: string) =>
    db.proyectos.delete(id),
}

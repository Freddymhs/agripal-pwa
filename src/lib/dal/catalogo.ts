import { db } from '@/lib/db'
import type { CatalogoCultivo } from '@/types'

export const catalogoDAL = {
  getByProyectoId: (proyectoId: string) =>
    db.catalogo_cultivos.where('proyecto_id').equals(proyectoId).toArray(),

  countByProyectoId: (proyectoId: string) =>
    db.catalogo_cultivos.where('proyecto_id').equals(proyectoId).count(),

  add: (cultivo: CatalogoCultivo) =>
    db.catalogo_cultivos.add(cultivo),

  update: (id: string, changes: Partial<CatalogoCultivo>) =>
    db.catalogo_cultivos.update(id, changes),

  delete: (id: string) =>
    db.catalogo_cultivos.delete(id),

  deleteByProyectoId: (proyectoId: string) =>
    db.catalogo_cultivos.where('proyecto_id').equals(proyectoId).delete(),
}

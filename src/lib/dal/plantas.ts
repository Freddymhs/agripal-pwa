import { db } from '@/lib/db'
import type { Planta } from '@/types'

export const plantasDAL = {
  getAll: () =>
    db.plantas.toArray(),

  getByZonaId: (zonaId: string) =>
    db.plantas.where('zona_id').equals(zonaId).toArray(),

  getByZonaIds: (zonaIds: string[]) =>
    db.plantas.where('zona_id').anyOf(zonaIds).toArray(),

  countByZonaIds: (zonaIds: string[]) =>
    db.plantas.where('zona_id').anyOf(zonaIds).count(),

  getByZonaIdFiltered: (zonaId: string, predicate: (p: Planta) => boolean) =>
    db.plantas.where('zona_id').equals(zonaId).and(predicate).toArray(),

  add: (planta: Planta) =>
    db.plantas.add(planta),

  bulkAdd: (plantas: Planta[]) =>
    db.plantas.bulkAdd(plantas),

  update: (id: string, changes: Partial<Planta>) =>
    db.plantas.update(id, changes),

  delete: (id: string) =>
    db.plantas.delete(id),

  bulkDelete: (ids: string[]) =>
    db.plantas.bulkDelete(ids),

  deleteByZonaIds: (zonaIds: string[]) =>
    db.plantas.where('zona_id').anyOf(zonaIds).delete(),
}

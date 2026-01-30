import { db } from '@/lib/db'
import type { Alerta } from '@/types'

export const alertasDAL = {
  getActiveByTerrenoId: (terrenoId: string) =>
    db.alertas.where('terreno_id').equals(terrenoId).and((a: Alerta) => a.estado === 'activa').toArray(),

  add: (alerta: Alerta) =>
    db.alertas.add(alerta),

  update: (id: string, changes: Partial<Alerta>) =>
    db.alertas.update(id, changes),
}

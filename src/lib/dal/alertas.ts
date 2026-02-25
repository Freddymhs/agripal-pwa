import { db } from '@/lib/db'
import type { Alerta } from '@/types'
import { ESTADO_ALERTA } from '@/lib/constants/entities'

export const alertasDAL = {
  getActiveByTerrenoId: (terrenoId: string) =>
    db.alertas.where('terreno_id').equals(terrenoId).and((a: Alerta) => a.estado === ESTADO_ALERTA.ACTIVA).toArray(),

  add: (alerta: Alerta) =>
    db.alertas.add(alerta),

  update: (id: string, changes: Partial<Alerta>) =>
    db.alertas.update(id, changes),
}

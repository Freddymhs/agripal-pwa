import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Migra proyectos (y su usuario) de un ID anterior al ID actual del mismo email.
 *
 * Caso de uso: el usuario se registró dos veces con el mismo email (p.ej. doble
 * sign-up antes de confirmar), generando dos UUIDs distintos en Supabase.
 * El IndexedDB local guarda los datos bajo el UUID antiguo. Al autenticarse con
 * el nuevo UUID la query devuelve vacío. Esta función detecta y corrige eso
 * automáticamente, sin intervención del usuario.
 */
export async function migrarDatosUsuarioAnterior(
  currentUserId: string,
  currentEmail: string,
): Promise<boolean> {
  // Buscar si hay un usuario en IndexedDB con el mismo email pero distinto ID
  const usuarioAnterior = await db.usuarios
    .where("email")
    .equals(currentEmail)
    .filter((u) => u.id !== currentUserId)
    .first();

  if (!usuarioAnterior) return false;

  const oldId = usuarioAnterior.id;

  const proyectosAMigrar = await db.proyectos
    .where("usuario_id")
    .equals(oldId)
    .toArray();

  if (proyectosAMigrar.length === 0) {
    // Limpiar el usuario huérfano aunque no tenga proyectos
    await db.usuarios.delete(oldId);
    return false;
  }

  logger.info("[migrarDatosUsuarioAnterior] migrando proyectos", {
    oldId,
    currentUserId,
    count: proyectosAMigrar.length,
  });

  await db.transaction("rw", [db.proyectos, db.usuarios], async () => {
    for (const p of proyectosAMigrar) {
      await db.proyectos.update(p.id, { usuario_id: currentUserId });
    }
    // Actualizar o eliminar el registro de usuario viejo
    await db.usuarios.delete(oldId);
  });

  logger.info("[migrarDatosUsuarioAnterior] migración completada", {
    proyectosMigrados: proyectosAMigrar.length,
  });

  return true;
}

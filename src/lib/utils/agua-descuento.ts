import { terrenosDAL, transaccionesDAL } from "@/lib/dal";
import { getCurrentTimestamp } from "@/lib/utils";
import {
  calcularConsumoRealTerreno,
  calcularDescuentoAutomatico,
} from "@/lib/utils/agua";
import { emitZonaUpdated } from "@/lib/events/zona-events";
import type { Terreno, Zona, Planta, CatalogoCultivo } from "@/types";

interface DescuentoResult {
  aplicado: boolean;
}

export async function aplicarDescuentoAutomaticoAgua(
  terreno: Terreno,
  estanques: Zona[],
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  cancelledRef: { current: boolean },
): Promise<DescuentoResult> {
  const now = getCurrentTimestamp();

  if (!terreno.ultima_simulacion_agua) {
    if (cancelledRef.current) return { aplicado: false };
    await terrenosDAL.update(terreno.id, {
      ultima_simulacion_agua: now,
    });
    return { aplicado: true };
  }

  const consumoReal = calcularConsumoRealTerreno(
    zonas,
    plantas,
    catalogoCultivos,
  );
  const resultado = calcularDescuentoAutomatico(
    terreno.ultima_simulacion_agua,
    estanques,
    zonas,
    plantas,
    catalogoCultivos,
    consumoReal,
  );

  if (!resultado) {
    return { aplicado: true };
  }

  const descuentos = resultado.descuentos
    .map((d) => {
      const estanque = estanques.find((e) => e.id === d.estanqueId);
      if (!estanque || !estanque.estanque_config) return null;
      return {
        estanqueId: d.estanqueId,
        update: {
          estanque_config: {
            ...estanque.estanque_config,
            nivel_actual_m3: d.nivelNuevo,
          },
          updated_at: now,
        } as Partial<Zona>,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  if (cancelledRef.current) return { aplicado: false };

  await transaccionesDAL.aplicarDescuentosAgua(descuentos, terreno.id, {
    ultima_simulacion_agua: now,
  });

  for (const d of descuentos) {
    emitZonaUpdated(d.estanqueId);
  }

  return { aplicado: true };
}

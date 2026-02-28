import { logger } from "@/lib/logger";

export async function ejecutarMutacion<T>(
  operacion: () => Promise<T>,
  etiquetaError: string,
  onRefetch?: () => void,
): Promise<T> {
  try {
    const resultado = await operacion();
    onRefetch?.();
    return resultado;
  } catch (err) {
    logger.error(`Error ${etiquetaError}`, {
      error: err instanceof Error ? { message: err.message } : { err },
    });
    throw err;
  }
}

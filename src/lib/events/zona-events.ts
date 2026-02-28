export const ZONA_UPDATED_EVENT = "zona:updated";

export function emitZonaUpdated(zonaId: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(ZONA_UPDATED_EVENT, { detail: { zonaId } }),
    );
  }
}

export function onZonaUpdated(callback: (zonaId: string) => void) {
  if (typeof window === "undefined") return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<{ zonaId: string }>;
    callback(customEvent.detail.zonaId);
  };

  window.addEventListener(ZONA_UPDATED_EVENT, handler);
  return () => window.removeEventListener(ZONA_UPDATED_EVENT, handler);
}

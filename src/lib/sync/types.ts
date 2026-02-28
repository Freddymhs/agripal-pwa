import type { SyncEntidad, SyncAccion, UUID } from "@/types";

export interface SyncRequest {
  entidad: SyncEntidad;
  entidadId: UUID;
  accion: SyncAccion;
  datos: Record<string, unknown>;
}

export interface SyncResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  conflict?: boolean;
  serverData?: Record<string, unknown>;
}

export interface PullRequest {
  entidad: SyncEntidad;
  since?: string;
}

export interface PullResponse {
  success: boolean;
  data: Record<string, unknown>[];
  lastModified?: string;
  error?: string;
}

export interface SyncAdapter {
  push(request: SyncRequest): Promise<SyncResponse>;
  pull(request: PullRequest): Promise<PullResponse>;
  isAvailable(): Promise<boolean>;
}

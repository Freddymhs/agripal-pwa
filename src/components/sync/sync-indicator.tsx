"use client";

import { useEffect, useState } from "react";
import { useProjectContext } from "@/contexts/project-context";
import { syncMetaDAL } from "@/lib/dal/sync-meta";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type RedStatus = "online" | "reconectando" | "offline";
type NubeStatus =
  | "al_dia"
  | "subiendo"
  | "pendiente"
  | "conflicto"
  | "error"
  | "desactivada";

// ─── Lógica de estado ─────────────────────────────────────────────────────────

function resolveRed(isOnline: boolean, reconectando: boolean): RedStatus {
  if (!isOnline) return "offline";
  if (reconectando) return "reconectando";
  return "online";
}

function resolveNube({
  isOnline,
  isSyncing,
  pendingCount,
  conflictos,
  error,
  syncHabilitado,
}: {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  conflictos: number;
  error: string | null;
  syncHabilitado: boolean;
}): NubeStatus {
  if (!syncHabilitado) return "desactivada";
  if (!isOnline) return pendingCount > 0 ? "pendiente" : "al_dia";
  if (conflictos > 0) return "conflicto";
  if (error) return "error";
  if (isSyncing) return "subiendo";
  if (pendingCount > 0) return "pendiente";
  return "al_dia";
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function SyncIndicator() {
  const { syncHook } = useProjectContext();
  const { isOnline, isSyncing, pendingCount, conflicts, error, lastSyncAt } =
    syncHook;

  const [syncHabilitado, setSyncHabilitado] = useState(false);
  const [reconectando, setReconectando] = useState(false);

  useEffect(() => {
    syncMetaDAL.isSyncHabilitado().then(setSyncHabilitado);
  }, []);

  // Detectar momento de reconexión — ventana de 3s tras volver online
  useEffect(() => {
    if (!isOnline) return;
    const t = setTimeout(() => {
      setReconectando(true);
      setTimeout(() => setReconectando(false), 3000);
    }, 0);
    return () => clearTimeout(t);
  }, [isOnline]);

  const red = resolveRed(isOnline, reconectando);
  const nube = resolveNube({
    isOnline,
    isSyncing,
    pendingCount,
    conflictos: conflicts.length,
    error,
    syncHabilitado,
  });

  return (
    <div
      className="flex items-center gap-1"
      role="status"
      aria-label="Estado de sincronización"
    >
      <PildoraRed status={red} />
      <PildoraLocal />
      <PildoraNube
        status={nube}
        pendingCount={pendingCount}
        lastSyncAt={lastSyncAt}
      />
    </div>
  );
}

// ─── Píldora base ─────────────────────────────────────────────────────────────

interface PildoraProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  color: string;
  dotColor: string;
  pulsing?: boolean;
  tooltip: string;
}

function Pildora({
  icon,
  label,
  sublabel,
  color,
  dotColor,
  pulsing,
  tooltip,
}: PildoraProps) {
  return (
    <div
      title={tooltip}
      className={`
        flex items-center gap-1.5 px-2 py-1
        rounded-md text-xs font-medium
        transition-all duration-300
        ${color}
      `}
    >
      {/* Dot de estado */}
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor} ${pulsing ? "animate-pulse" : ""}`}
      />

      {/* Ícono */}
      <span className="flex-shrink-0 opacity-80">{icon}</span>

      {/* Labels — solo en sm+ */}
      <span className="hidden sm:flex items-baseline gap-1">
        <span className="tracking-tight">{label}</span>
        {sublabel && (
          <span className="opacity-50 font-normal text-[10px]">{sublabel}</span>
        )}
      </span>
    </div>
  );
}

// ─── Píldora 1: Red ───────────────────────────────────────────────────────────

function PildoraRed({ status }: { status: RedStatus }) {
  if (status === "online") {
    return (
      <Pildora
        icon={<IconRed />}
        label="Red"
        dotColor="bg-green-400"
        color="text-white/50 hover:text-white/70"
        tooltip="Conectado a internet"
      />
    );
  }

  if (status === "reconectando") {
    return (
      <Pildora
        icon={<IconRed />}
        label="Reconectando"
        dotColor="bg-blue-400"
        color="text-blue-200"
        pulsing
        tooltip="Volvió la conexión. Sincronizando en breve..."
      />
    );
  }

  return (
    <Pildora
      icon={<IconSinRed />}
      label="Sin red"
      sublabel="· seguís trabajando"
      dotColor="bg-amber-400"
      color="text-amber-200"
      tooltip="Sin internet. Podés seguir trabajando normalmente — tus cambios se guardan aquí y se suben cuando vuelva la señal."
    />
  );
}

// ─── Píldora 2: Local ─────────────────────────────────────────────────────────

function PildoraLocal() {
  return (
    <Pildora
      icon={<IconLocal />}
      label="En tu dispositivo"
      dotColor="bg-green-400"
      color="text-white/50 hover:text-white/70"
      tooltip="Tus datos están guardados en este dispositivo. Funcionan sin internet."
    />
  );
}

// ─── Píldora 3: Nube ─────────────────────────────────────────────────────────

interface PildoraNubeProps {
  status: NubeStatus;
  pendingCount: number;
  lastSyncAt: Date | null;
}

function PildoraNube({ status, pendingCount, lastSyncAt }: PildoraNubeProps) {
  switch (status) {
    case "al_dia":
      return (
        <Pildora
          icon={<IconNube />}
          label="Nube"
          sublabel={
            lastSyncAt ? `· ${formatRelativeTime(lastSyncAt)}` : undefined
          }
          dotColor="bg-green-400"
          color="text-white/50 hover:text-white/70"
          tooltip={`Datos respaldados en la nube.${lastSyncAt ? ` Última sincronización: ${lastSyncAt.toLocaleTimeString("es-CL")}` : ""}`}
        />
      );

    case "subiendo":
      return (
        <Pildora
          icon={<IconNube />}
          label="Subiendo"
          dotColor="bg-blue-400"
          color="text-blue-200"
          pulsing
          tooltip="Enviando tus cambios a la nube..."
        />
      );

    case "pendiente":
      return (
        <Pildora
          icon={<IconNube />}
          label={`${pendingCount} por subir`}
          sublabel="· automático"
          dotColor="bg-yellow-400"
          color="text-yellow-200"
          tooltip={`${pendingCount} cambio${pendingCount > 1 ? "s" : ""} pendiente${pendingCount > 1 ? "s" : ""}. Se sincronizan solos cada 30 segundos cuando hay conexión.`}
        />
      );

    case "conflicto":
      return (
        <Pildora
          icon={<IconNube />}
          label="Conflicto"
          sublabel="· revisá"
          dotColor="bg-orange-400"
          color="text-orange-200"
          pulsing
          tooltip="Hay conflictos entre tus datos locales y los de la nube. Abrí el panel de conflictos para resolverlos."
        />
      );

    case "error":
      return (
        <Pildora
          icon={<IconNube />}
          label="Error"
          sublabel="· no se pudo subir"
          dotColor="bg-red-400"
          color="text-red-200"
          tooltip="No se pudo sincronizar con la nube. Revisá tu conexión."
        />
      );

    case "desactivada":
      return (
        <Pildora
          icon={<IconNubeOff />}
          label="Nube"
          sublabel="· desactivada"
          dotColor="bg-white/20"
          color="text-white/30"
          tooltip="La sincronización con la nube está desactivada. Activala en Configuración para respaldar tus datos y usarlos en otros dispositivos."
        />
      );
  }
}

// ─── Íconos SVG compactos ─────────────────────────────────────────────────────

const IconRed = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    {/* Barras de señal — 3 niveles */}
    <rect
      x="1"
      y="9"
      width="2"
      height="4"
      rx="0.5"
      fill="currentColor"
      opacity="1"
    />
    <rect
      x="5"
      y="6"
      width="2"
      height="7"
      rx="0.5"
      fill="currentColor"
      opacity="1"
    />
    <rect
      x="9"
      y="3"
      width="2"
      height="10"
      rx="0.5"
      fill="currentColor"
      opacity="1"
    />
  </svg>
);

const IconSinRed = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    {/* Barras vacías */}
    <rect
      x="1"
      y="9"
      width="2"
      height="4"
      rx="0.5"
      fill="currentColor"
      opacity="0.3"
    />
    <rect
      x="5"
      y="6"
      width="2"
      height="7"
      rx="0.5"
      fill="currentColor"
      opacity="0.3"
    />
    <rect
      x="9"
      y="3"
      width="2"
      height="10"
      rx="0.5"
      fill="currentColor"
      opacity="0.3"
    />
    {/* Línea de corte diagonal */}
    <line
      x1="1"
      y1="12"
      x2="12"
      y2="1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const IconLocal = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    {/* Chip / dispositivo */}
    <rect
      x="2"
      y="3"
      width="9"
      height="7"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    {/* Check interno */}
    <path
      d="M4.5 6.5l1.5 1.5 3-3"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconNube = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M9.5 10H4a2.5 2.5 0 01-.5-4.95A3.5 3.5 0 019.5 5a2 2 0 010 5z"
      stroke="currentColor"
      strokeWidth="1.3"
      fill="none"
    />
  </svg>
);

const IconNubeOff = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M9.5 10H4a2.5 2.5 0 01-.5-4.95A3.5 3.5 0 019.5 5a2 2 0 010 5z"
      stroke="currentColor"
      strokeWidth="1.3"
      fill="none"
      opacity="0.4"
    />
    {/* Línea de corte */}
    <line
      x1="2"
      y1="11"
      x2="11"
      y2="2"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);

// ─── Util ─────────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffHrs = Math.floor(diffMin / 60);
  return `hace ${diffHrs}h`;
}

'use client'

import { useSync } from '@/hooks/use-sync'

export function SyncIndicator() {
  const { isOnline, isSyncing, pendingCount, conflicts } = useSync()

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-red-200 text-sm">
        <div className="w-2 h-2 rounded-full bg-red-400" />
        <span>Offline {pendingCount > 0 && `(${pendingCount})`}</span>
      </div>
    )
  }

  if (conflicts.length > 0) {
    return (
      <div className="flex items-center gap-2 text-orange-200 text-sm">
        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
        <span>{conflicts.length} conflicto(s)</span>
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 text-blue-200 text-sm">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <span>Sincronizando...</span>
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 text-yellow-200 text-sm">
        <div className="w-2 h-2 rounded-full bg-yellow-400" />
        <span>{pendingCount} pendiente(s)</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-green-200 text-sm">
      <div className="w-2 h-2 rounded-full bg-green-300" />
      <span>Sincronizado</span>
    </div>
  )
}

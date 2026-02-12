'use client'

import { useProjectContext } from '@/contexts/project-context'

export function SyncIndicator() {
  const { syncHook } = useProjectContext()
  const { isOnline, isSyncing, pendingCount, conflicts, error, lastSyncAt } = syncHook

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-red-200 text-sm">
        <div className="w-2 h-2 rounded-full bg-red-400" />
        <span>Offline {pendingCount > 0 && `(${pendingCount})`}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-200 text-sm">
        <div className="w-2 h-2 rounded-full bg-red-400" />
        <span>Error de sync</span>
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

  const lastSyncLabel = lastSyncAt ? formatRelativeTime(lastSyncAt) : null

  return (
    <div className="flex items-center gap-2 text-green-200 text-sm">
      <div className="w-2 h-2 rounded-full bg-green-300" />
      <span>Sincronizado{lastSyncLabel ? ` · ${lastSyncLabel}` : ''}</span>
    </div>
  )
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin}m`
  const diffHrs = Math.floor(diffMin / 60)
  return `hace ${diffHrs}h`
}

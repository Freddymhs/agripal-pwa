'use client'

import { useOnlineStatus } from '@/hooks/use-online-status'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
      Sin conexión — Los cambios se guardarán localmente y se sincronizarán al reconectar
    </div>
  )
}

import { useEffect, useState } from 'react'
import './OfflineBanner.css'

/**
 * Banner fixo exibido quando o usuário perde conexão com a internet.
 * Desaparece automaticamente ao reconectar.
 * Posicionado acima do BottomNav para não ser coberto.
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="offline-banner" role="alert" aria-live="polite">
      Sem conexão — exibindo dados salvos
    </div>
  )
}

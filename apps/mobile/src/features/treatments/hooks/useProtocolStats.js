// useProtocolStats.js — estatísticas de doses para warning de delete (Fase 2 §3.7).
// Padrão: { data, loading, error }
//
// v1 (Sprint T2.2): confirmedLast7d via query real; pendingNow e scheduledNext7d
// são estimativas ingênuas baseadas em time_schedule.length. Refinar quando util
// de adherenceLogic for adaptado para mobile.

import { useState, useEffect, useCallback, useMemo, startTransition } from 'react'
import { supabase } from '../../../platform/supabase/nativeSupabaseClient'
import { protocolService } from '../services/protocolService'
import { getNow, addDays } from '@dosiq/core'
import { debugLog } from '@shared/utils/debugLog'

export function useProtocolStats(protocolId) {
  // States
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Handlers
  const load = useCallback(async () => {
    if (!protocolId) {
      setLoading(false)
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const today = getNow()
      // addDays aceita Date direto; getNow já retorna Date (R-020 compliant)
      const sevenDaysAgo = addDays(today, -7)

      const [protocol, logsResult] = await Promise.all([
        protocolService.getById(protocolId),
        supabase
          .from('logs')
          .select('*', { count: 'exact', head: true })
          .eq('protocol_id', protocolId)
          .gte('taken_at', sevenDaysAgo.toISOString())
          .lte('taken_at', today.toISOString()),
      ])

      if (logsResult.error) throw logsResult.error

      const dailyDoses = Array.isArray(protocol?.time_schedule)
        ? protocol.time_schedule.length
        : 0

      // pendingNow: placeholder v1 — cálculo real requer adherenceLogic.
      // scheduledNext7d: estimativa ingênua (dailyDoses * 7).
      setData({
        confirmedLast7d: logsResult.count ?? 0,
        pendingNow: 0,
        scheduledNext7d: dailyDoses * 7,
      })
    } catch (err) {
      if (__DEV__) debugLog('useProtocolStats', 'fetch failed:', err.message)
      setError(err.message ?? 'Erro ao carregar estatísticas.')
    } finally {
      setLoading(false)
    }
  }, [protocolId])

  // Effects
  useEffect(() => {
    startTransition(() => {
      load()
    })
  }, [load])

  // Memos
  return useMemo(
    () => ({ data, loading, error }),
    [data, loading, error]
  )
}

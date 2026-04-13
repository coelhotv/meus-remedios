// useTodayData.js — hook para dados da tela Hoje
// Padrão: { data, loading, error, stale, refresh }
// R-010: ordem de declaração — states → effects → handlers
// stale=true quando há snapshot em cache mas a última refresh falhou (R5-008)

import { useState, useEffect, useCallback } from 'react'
import { getTodayLocal } from '@meus-remedios/core'
import { supabase } from '../../../platform/supabase/nativeSupabaseClient'
import {
  getActiveProtocols,
  getTodayLogs,
  getMedicineNames,
} from '../services/dashboardService'

/**
 * @typedef {{ protocols: Array, logs: Array, medicineNames: Record<string,string> }} TodayData
 * @returns {{ data: TodayData|null, loading: boolean, error: string|null, stale: boolean, refresh: Function }}
 */
export function useTodayData() {
  // States primeiro (R-010)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stale, setStale] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Sessão expirada.')

      const today = getTodayLocal() // R-020: nunca new Date('YYYY-MM-DD')
      const [protocols, logs] = await Promise.all([
        getActiveProtocols(user.id),
        getTodayLogs(user.id, today),
      ])

      // Enriquecer com nomes dos medicamentos
      const medicineIds = [...new Set(protocols.map((p) => p.medicine_id))]
      const medicineNames = await getMedicineNames(medicineIds)

      setData({ protocols, logs, medicineNames })
      setStale(false)
    } catch (err) {
      setError(err.message ?? 'Erro ao carregar dados do dia.')
      // Se há snapshot, marcar como stale em vez de apagar (R5-008)
      if (data !== null) setStale(true)
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, stale, refresh: load }
}

// useMedicines.js — listagem + detalhe de medicamentos
// Padrão: { data, loading, error, stale, refresh }
//
// Cache: AsyncStorage snapshot (R-184 — fallback offline curto).
// Invalidação: useMutation invalidateKeys: ['@dosiq/medicines-snapshot'].

import { useState, useEffect, useCallback, useMemo, startTransition } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getNow, parseISO } from '@dosiq/core'
import { medicineService } from '../services/medicineService'
import { debugLog } from '@shared/utils/debugLog'

const MEDICINES_CACHE_KEY = '@dosiq/medicines-snapshot'
const CACHE_TTL_HOURS = 24

export function useMedicines() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stale, setStale] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await medicineService.getAll()
      const snapshot = { data: list, capturedAt: getNow().toISOString() }
      await AsyncStorage.setItem(MEDICINES_CACHE_KEY, JSON.stringify(snapshot))
      setData(list)
      setStale(false)
    } catch (err) {
      if (__DEV__) debugLog('useMedicines', 'fetch failed:', err.message)
      try {
        const cached = await AsyncStorage.getItem(MEDICINES_CACHE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          const capturedAt = parseISO(parsed.capturedAt)
          const diffHours = (getNow() - capturedAt) / (1000 * 60 * 60)
          if (diffHours < CACHE_TTL_HOURS) {
            setData(parsed.data)
            setStale(true)
            setError(null)
            return
          }
        }
        throw err
      } catch {
        setError(err.message ?? 'Erro ao carregar medicamentos.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    startTransition(() => {
      load()
    })
  }, [load])

  return useMemo(
    () => ({ data, loading, error, stale, refresh: load }),
    [data, loading, error, stale, load]
  )
}

export function useMedicine(id) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const item = await medicineService.getById(id)
      setData(item)
    } catch (err) {
      if (__DEV__) debugLog('useMedicine', 'fetch failed:', err.message)
      setError(err.message ?? 'Erro ao carregar medicamento.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    startTransition(() => {
      load()
    })
  }, [load])

  return useMemo(
    () => ({ data, loading, error, refresh: load }),
    [data, loading, error, load]
  )
}

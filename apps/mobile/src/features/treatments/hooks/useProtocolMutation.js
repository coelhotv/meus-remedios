// useProtocolMutation.js — wrappers create/update sobre useMutation
//
// Encapsula:
// - Toast feedback (success/error)
// - Cache invalidation (@dosiq/protocols-snapshot)
// - Navegação opcional pós-sucesso
//
// Uso:
//   const { create, update, isLoading } = useProtocolMutation()
//   create(values, { goBack: true })

import { useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import { useMutation } from '@shared/hooks/useMutation'
import { useToast } from '@shared/components/feedback/Toast'
import { protocolService } from '../services/protocolService'

const PROTOCOLS_CACHE_KEY = '@dosiq/protocols-snapshot'

export function useProtocolMutation() {
  // States (R-010 — States → Memos → Effects → Handlers)
  const navigation = useNavigation()
  const { show } = useToast()

  const mutationCreate = useMutation({
    invalidateKeys: [PROTOCOLS_CACHE_KEY],
    onSuccess: () => show('Tratamento criado', { variant: 'success' }),
    onError: (err) => show(err?.message ?? 'Erro ao criar tratamento', { variant: 'error' }),
  })

  const mutationUpdate = useMutation({
    invalidateKeys: [PROTOCOLS_CACHE_KEY],
    onSuccess: () => show('Tratamento atualizado', { variant: 'success' }),
    onError: (err) => show(err?.message ?? 'Erro ao atualizar tratamento', { variant: 'error' }),
  })

  const create = useCallback(
    async (payload, { goBack = false } = {}) => {
      const result = await mutationCreate.mutate(() => protocolService.create(payload))
      if (result && goBack) navigation.goBack()
      return result
    },
    [mutationCreate, navigation]
  )

  const update = useCallback(
    async (id, payload, { goBack = false } = {}) => {
      const result = await mutationUpdate.mutate(() => protocolService.update(id, payload))
      if (result && goBack) navigation.goBack()
      return result
    },
    [mutationUpdate, navigation]
  )

  const toggleActive = useCallback(
    async (id, nextValue) => {
      try {
        const result = await protocolService.update(id, { active: nextValue })
        // Invalida snapshot local (best-effort — falha aqui não derruba a operação)
        await AsyncStorage.removeItem(PROTOCOLS_CACHE_KEY).catch(() => {})
        show(nextValue ? 'Tratamento ligado' : 'Tratamento desligado', { variant: 'success' })
        return result
      } catch (err) {
        show(err?.message ?? 'Erro ao alterar status do tratamento', { variant: 'error' })
        throw err
      }
    },
    [show]
  )

  return {
    create,
    update,
    toggleActive,
    isLoading: mutationCreate.isLoading || mutationUpdate.isLoading,
    error: mutationCreate.error ?? mutationUpdate.error ?? null,
  }
}

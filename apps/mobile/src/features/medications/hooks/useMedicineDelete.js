// useMedicineDelete.js — pre-check de dependências + delete
//
// v1: usa `protocols` (tratamentos) já carregados no medicine via getById.
// Bloqueia delete se houver tratamentos ativos. Estoque/logs históricos
// não são verificados no v1.
//
// Implementação direta (sem useMedicineMutation) p/ poder garantir navegação
// pós-sucesso real (delete não retorna value — wrapper genérico não distingue
// sucesso de falha pelo retorno).

import { useState, useMemo, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import { useToast } from '@shared/components/feedback/Toast'
import { successHaptic, errorHaptic } from '@shared/utils/haptics'
import { medicineService } from '../services/medicineService'

const MEDICINES_CACHE_KEY = '@dosiq/medicines-snapshot'

export function useMedicineDelete(medicine) {
  const navigation = useNavigation()
  const { show } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const preCheck = useMemo(() => {
    const protocols = Array.isArray(medicine?.protocols) ? medicine.protocols : []
    const activeProtocols = protocols.filter((p) => p?.active !== false)
    const canDelete = activeProtocols.length === 0
    return {
      canDelete,
      activeProtocolsCount: activeProtocols.length,
      blocker: canDelete
        ? null
        : `Existem ${activeProtocols.length} tratamento(s) ativo(s) usando este medicamento. Desative-os antes de remover.`,
      warnings: [],
    }
  }, [medicine])

  const confirmDelete = useCallback(async () => {
    if (!medicine?.id) return false
    setIsLoading(true)
    try {
      await medicineService.delete(medicine.id)
      await AsyncStorage.removeItem(MEDICINES_CACHE_KEY).catch(() => {})
      successHaptic()
      show('Medicamento removido', { variant: 'success' })
      navigation.goBack()
      return true
    } catch (err) {
      errorHaptic()
      show(err?.message ?? 'Erro ao remover medicamento', { variant: 'error' })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [medicine, navigation, show])

  return {
    preCheck,
    confirmDelete,
    isLoading,
  }
}

// useMedicineDelete.js — pre-check de dependências + delete
//
// v1: usa `protocols` (tratamentos) já carregados no medicine via getById.
// Bloqueia delete se houver tratamentos ativos. Estoque/logs históricos
// não são verificados no v1 (futuro — paridade com web fetchMedicineDependencies).
//
// Uso:
//   const { preCheck, confirmDelete, isLoading } = useMedicineDelete(medicine)
//   const check = preCheck()
//   if (check.blocker) show(check.blocker, 'error')
//   else openConfirmation(check.warnings)

import { useCallback, useMemo } from 'react'
import { useMedicineMutation } from './useMedicineMutation'

export function useMedicineDelete(medicine) {
  const { remove, isLoading } = useMedicineMutation()

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

  const confirmDelete = useCallback(
    () => remove(medicine?.id, { goBack: true }),
    [remove, medicine]
  )

  return {
    preCheck,
    confirmDelete,
    isLoading,
  }
}

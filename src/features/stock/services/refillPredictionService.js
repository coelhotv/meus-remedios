// src/features/stock/services/refillPredictionService.js

import { formatLocalDate } from '@utils/dateUtils'
import { calculateDailyIntake } from '@utils/adherenceLogic'

/**
 * Calcula previsao de reposicao baseada em consumo REAL (logs de doses).
 * Fallback para consumo teorico se dados insuficientes (<14 dias).
 *
 * @param {Object} params
 * @param {string} params.medicineId - ID do medicamento
 * @param {number} params.currentStock - Quantidade atual em estoque
 * @param {Array} params.logs - Logs de doses dos ultimos 30 dias para este med
 * @param {Array} params.protocols - Protocolos ativos deste medicamento
 * @returns {{
 *   daysRemaining: number,
 *   predictedStockoutDate: string|null,  // YYYY-MM-DD
 *   dailyConsumption: number,
 *   isRealData: boolean,  // true=consumo real, false=teorico
 *   confidence: 'high'|'medium'|'low'
 * }}
 */
export function predictRefill({ medicineId, currentStock, logs, protocols }) {
  // 1. Calcular consumo real (ultimos 30 dias)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentLogs = logs.filter(log =>
    log.medicine_id === medicineId &&
    new Date(log.taken_at) >= thirtyDaysAgo
  )

  const daysWithData = getDaysWithData(recentLogs)

  let dailyConsumption
  let isRealData
  let confidence

  if (daysWithData >= 14) {
    // Consumo real: total de comprimidos consumidos / dias com dados
    const totalConsumed = recentLogs.reduce((sum, log) => sum + log.quantity_taken, 0)
    dailyConsumption = totalConsumed / daysWithData
    isRealData = true
    confidence = daysWithData >= 21 ? 'high' : 'medium'
  } else {
    // Fallback: consumo teorico baseado no protocolo
    dailyConsumption = calculateDailyIntake(medicineId, protocols)
    isRealData = false
    confidence = 'low'
  }

  // 2. Calcular dias restantes
  let daysRemaining
  if (currentStock === 0) {
    daysRemaining = 0
  } else if (dailyConsumption > 0) {
    daysRemaining = Math.floor(currentStock / dailyConsumption)
  } else {
    daysRemaining = Infinity
  }

  // 3. Calcular data prevista de stockout
  let predictedStockoutDate = null
  if (daysRemaining !== Infinity && daysRemaining >= 0) {
    const stockoutDate = new Date()
    stockoutDate.setDate(stockoutDate.getDate() + daysRemaining)
    predictedStockoutDate = formatLocalDate(stockoutDate)
  }

  return {
    daysRemaining,
    predictedStockoutDate,
    dailyConsumption: Math.round(dailyConsumption * 100) / 100,
    isRealData,
    confidence,
  }
}

/**
 * Calcula previsao para TODOS os medicamentos com estoque.
 * @param {Object} params
 * @param {Array} params.medicines - Todos os medicamentos
 * @param {Array} params.stocks - Todos os registros de estoque
 * @param {Array} params.logs - Todos os logs de doses (30 dias)
 * @param {Array} params.protocols - Todos os protocolos ativos
 * @returns {Array<{medicineId, name, ...prediction}>}
 */
export function predictAllRefills({ medicines, stocks, logs, protocols }) {
  return medicines
    .map(med => {
      const medStocks = stocks.filter(s => s.medicine_id === med.id)
      const currentStock = medStocks.reduce((sum, s) => sum + s.quantity, 0)
      if (currentStock === 0) return null

      const prediction = predictRefill({
        medicineId: med.id,
        currentStock,
        logs,
        protocols: protocols.filter(p => p.medicine_id === med.id),
      })

      return {
        medicineId: med.id,
        name: med.name,
        currentStock,
        ...prediction,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.daysRemaining - b.daysRemaining) // Mais urgente primeiro
}

/**
 * Conta dias unicos com pelo menos 1 log.
 */
function getDaysWithData(logs) {
  const uniqueDays = new Set(
    logs.map(log => formatLocalDate(new Date(log.taken_at)))
  )
  return uniqueDays.size
}

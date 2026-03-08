// src/features/adherence/services/protocolRiskService.js

// Note: dateUtils functions not needed - using native Date for pure calculations

/**
 * Niveis de risco para protocolos.
 */
export const RISK_LEVELS = {
  STABLE: 'stable',
  ATTENTION: 'attention',
  CRITICAL: 'critical',
}

export const RISK_COLORS = {
  stable: 'var(--color-success)',     // #22c55e
  attention: 'var(--color-warning)',   // #f59e0b
  critical: 'var(--color-error)',      // #ef4444
}

export const RISK_LABELS = {
  stable: 'Estavel',
  attention: 'Atencao',
  critical: 'Critico',
}

/**
 * Calcula score de risco para um protocolo.
 *
 * @param {Object} params
 * @param {string} params.protocolId
 * @param {Array} params.logs - TODOS os logs do usuario (sera filtrado internamente)
 * @param {Object} params.protocol - Protocolo com time_schedule, frequency, dosage_per_intake
 * @returns {{
 *   protocolId: string,
 *   adherence14d: number,    // 0-100
 *   trend7d: number,         // delta percentual (-100 a +100)
 *   riskLevel: 'stable'|'attention'|'critical',
 *   riskColor: string,
 *   riskLabel: string,
 *   hasEnoughData: boolean
 * }}
 */
export function calculateProtocolRisk({ protocolId, logs, protocol }) {
  const now = new Date()
  const fourteenDaysAgo = new Date(now)
  fourteenDaysAgo.setDate(now.getDate() - 14)
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)

  // Filtrar logs deste protocolo
  const protocolLogs = logs.filter(log =>
    log.protocol_id === protocolId ||
    log.medicine_id === protocol.medicine_id
  )

  // Adesao ultimos 14 dias
  const logs14d = protocolLogs.filter(log => new Date(log.taken_at) >= fourteenDaysAgo)
  const expected14d = calculateExpectedDosesForProtocol(protocol, 14)
  const adherence14d = expected14d > 0
    ? Math.min(100, Math.round((logs14d.length / expected14d) * 100))
    : 100

  // Adesao ultimos 7 dias vs 7 dias anteriores (trend)
  const logs7d = protocolLogs.filter(log => new Date(log.taken_at) >= sevenDaysAgo)
  const logsPrev7d = protocolLogs.filter(log => {
    const logDate = new Date(log.taken_at)
    return logDate >= fourteenDaysAgo && logDate < sevenDaysAgo
  })
  const expected7d = calculateExpectedDosesForProtocol(protocol, 7)
  const adherence7d = expected7d > 0 ? (logs7d.length / expected7d) * 100 : 100
  const adherencePrev7d = expected7d > 0 ? (logsPrev7d.length / expected7d) * 100 : 100
  const trend7d = Math.round(adherence7d - adherencePrev7d)

  // Verificar dados suficientes
  const hasEnoughData = expected14d >= 4 // Pelo menos ~2 doses/semana

  // Classificar risco
  let riskLevel
  if (!hasEnoughData) {
    riskLevel = RISK_LEVELS.STABLE // Nao penalizar sem dados
  } else if (adherence14d < 50 || trend7d < -15) {
    riskLevel = RISK_LEVELS.CRITICAL
  } else if (adherence14d < 80 || (trend7d >= -15 && trend7d < -5)) {
    riskLevel = RISK_LEVELS.ATTENTION
  } else {
    riskLevel = RISK_LEVELS.STABLE
  }

  return {
    protocolId,
    adherence14d,
    trend7d,
    riskLevel,
    riskColor: RISK_COLORS[riskLevel],
    riskLabel: RISK_LABELS[riskLevel],
    hasEnoughData,
  }
}

/**
 * Calcula risco para TODOS os protocolos ativos.
 */
export function calculateAllProtocolRisks({ protocols, logs }) {
  return protocols
    .filter(p => p.active)
    .map(protocol => calculateProtocolRisk({
      protocolId: protocol.id,
      logs,
      protocol,
    }))
}

/**
 * Calcula doses esperadas para um protocolo em N dias.
 * Referencia: adherenceLogic.js getDailyDoseRate
 */
function calculateExpectedDosesForProtocol(protocol, days) {
  const timesPerDay = protocol.time_schedule?.length || 1
  let dosesPerDay

  switch (protocol.frequency) {
    case 'diario':
      dosesPerDay = timesPerDay
      break
    case 'dias_alternados':
      dosesPerDay = timesPerDay / 2
      break
    case 'semanal':
      dosesPerDay = timesPerDay / 7
      break
    case 'quando_necessario':
    case 'personalizado':
      dosesPerDay = 0
      break
    default:
      dosesPerDay = timesPerDay
  }

  return Math.round(dosesPerDay * days)
}

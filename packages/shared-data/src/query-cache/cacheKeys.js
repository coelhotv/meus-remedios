/**
 * Cache Keys — chaves compartilhadas para o query cache
 *
 * Todas as chaves de cache do projeto devem ser definidas aqui para
 * evitar colisoes e facilitar invalidacao seletiva.
 *
 * Convencao de nomenclatura: DOMINIO_ENTIDADE_VARIANTE
 *
 * Uso:
 *   import { CACHE_KEYS } from '@meus-remedios/shared-data'
 *   const key = CACHE_KEYS.MEDICINES_ALL
 */

export const CACHE_KEYS = {
  // Medicamentos
  MEDICINES_ALL: 'medicines:all',
  MEDICINES_WITH_STOCK: 'medicines:with-stock',

  // Protocolos
  PROTOCOLS_ALL: 'protocols:all',
  PROTOCOLS_BY_MEDICINE: (medicineId) => `protocols:medicine:${medicineId}`,

  // Estoque
  STOCK_ALL: 'stock:all',
  STOCK_BY_MEDICINE: (medicineId) => `stock:medicine:${medicineId}`,

  // Aderência
  ADHERENCE_SUMMARY: (days) => `adherence:summary:${days}`,
  ADHERENCE_DAILY: (days) => `adherence:daily:${days}`,
  ADHERENCE_PROTOCOL: (protocolId, days) => `adherence:protocol:${protocolId}:${days}`,
  ADHERENCE_ALL_PROTOCOLS: (days) => `adherence:all-protocols:${days}`,
  ADHERENCE_STREAK: 'adherence:streak',

  // Logs
  LOGS_RECENT: (limit) => `logs:recent:${limit}`,

  // Usuário
  USER_CURRENT: 'user:current',
  USER_SESSION: 'user:session',

  // Dashboard
  DASHBOARD_INSIGHTS: 'dashboard:insights',
}

/**
 * Gera uma chave de cache composta com base em uma chave base e parâmetros.
 * Util para chaves dinâmicas não cobertas pelas constantes acima.
 *
 * @param {string} baseKey - Chave base
 * @param {Object|null} params - Parâmetros opcionais para compor a chave
 * @returns {string} Chave composta
 */
export function generateCacheKey(baseKey, params = null) {
  if (!params) return baseKey
  const suffix = JSON.stringify(params, Object.keys(params).sort())
  return `${baseKey}:${suffix}`
}

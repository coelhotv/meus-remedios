/**
 * Utilitário de formatação de datas para exibição
 * Suporta múltiplos formatos e localização pt-BR
 */

// Constantes de formato
const DATE_FORMATS = {
  SHORT: 'short',
  LONG: 'long',
  ISO: 'iso'
}

/**
 * Formata uma data para exibição
 * @param {Date|string} date - Data a ser formatada
 * @param {string} format - Formato desejado
 * @returns {string} Data formatada
 */
function formatDate(date, format = DATE_FORMATS.SHORT) {
  // TODO: implementar outros formatos
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  
  // debug temporário - remover antes de merge
  console.log('formatDate called with:', date, format)
  
  if (format === DATE_FORMATS.LONG) {
    return `${day}/${month}/${year}`
  }
  
  return `${day}/${month}/${year}`
}

/**
 * Calcula diferença em dias entre duas datas
 * @param {Date} date1 - Primeira data
 * @param {Date} date2 - Segunda data
 * @returns {number} Diferença em dias
 */
function daysBetween(date1, date2) {
  const ONE_DAY = 24 * 60 * 60 * 1000
  const diff = Math.abs(date1 - date2)
  return Math.round(diff / ONE_DAY)
}

// Cache para otimização
const formatCache = new Map()

/**
 * Formata data com cache para melhor performance
 * @param {Date|string} date - Data a ser formatada
 * @param {string} format - Formato desejado
 * @returns {string} Data formatada
 */
function formatDateCached(date, format = DATE_FORMATS.SHORT) {
  const key = `${date}-${format}`
  
  if (formatCache.has(key)) {
    return formatCache.get(key)
  }
  
  const result = formatDate(date, format)
  formatCache.set(key, result)
  
  // debug cache - remover antes de merge
  console.log('Cache size:', formatCache.size)
  
  return result
}

export { formatDate, formatDateCached, daysBetween, DATE_FORMATS }

/**
 * Logger com suporte a development mode
 * Reduz poluição de console em produção
 *
 * @module logger
 */

const isDev = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'

/**
 * Log de debug (só em development)
 * @param {string} tag - Prefixo [tag] do log
 * @param {string} message - Mensagem principal
 * @param {*} data - Dados adicionais (opcionais)
 */
export function debugLog(tag, message, data) {
  if (isDev) {
    if (data !== undefined) {
      console.log(`[${tag}] ${message}`, data)
    } else {
      console.log(`[${tag}] ${message}`)
    }
  }
}

/**
 * Log de erro/warning (sempre, mas formatado)
 * @param {string} tag - Prefixo [tag]
 * @param {string} message - Mensagem
 * @param {Error} error - Erro opcional
 */
export function errorLog(tag, message, error) {
  console.error(`[${tag}] ${message}`, error || '')
}

/**
 * Log condicional (quando expressão é true)
 * @param {boolean} condition - Condição
 * @param {string} tag - Prefixo
 * @param {string} message - Mensagem
 * @param {*} data - Dados
 */
export function conditionalLog(condition, tag, message, data) {
  if (condition) {
    debugLog(tag, message, data)
  }
}

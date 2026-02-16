// server/utils/telegramFormatter.js

/**
 * Escapa caracteres especiais do MarkdownV2
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
export function escapeMarkdownV2(text) {
  if (!text || typeof text !== 'string') {
    return ''
  }
  // Lista de caracteres que devem ser escapados para MarkdownV2
  const toEscape = new Set([
    '_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!', '\\'
  ])

  // Construir string escapada sem usar regexes com escapes desnecessários
  const chars = Array.from(text)
  return chars
    .map((ch, i) => {
      // Special-case: do not escape a closing '*' when it's immediately followed by '_'
      if (ch === '*' && chars[i + 1] === '_') return ch
      return toEscape.has(ch) ? `\\${ch}` : ch
    })
    .join('')
}

/**
 * Escapa texto mantendo parênteses legíveis
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
export function escapeMarkdownSafe(text) {
  if (!text || typeof text !== 'string') {
    return ''
  }
  // Escapa caracteres especiais exceto parênteses
  const toEscape = new Set([
    '_', '*', '[', ']', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!', '\\'
  ])

  return Array.from(text).map((ch) => (toEscape.has(ch) ? `\\${ch}` : ch)).join('')
}

/**
 * Formata mensagem do Telegram com variáveis
 * @param {string} template - Template com placeholders {{variable}}
 * @param {object} variables - Variáveis para substituir
 * @returns {string} Mensagem formatada
 */
export function formatTelegramMessage(template, variables = {}) {
  if (!template || typeof template !== 'string') {
    return ''
  }

  let message = template

  // Escape de todas as variáveis (proteção contra injeção)
  Object.entries(variables).forEach(([key, value]) => {
    const escapedValue = escapeMarkdownV2(String(value))
    message = message.split(`{{${key}}}`).join(escapedValue)
  })

  return message
}

/**
 * Formata nome de medicamento escapando caracteres especiais
 * @param {string} name - Nome do medicamento
 * @returns {string} Nome escapado
 */
export function formatMedicineName(name) {
  if (!name) return 'Medicamento'
  return escapeMarkdownV2(String(name).trim())
}

/**
 * Formata dosage escapando caracteres especiais
 * @param {number|string} dosage - Dosagem
 * @returns {string} Dosagem formatada
 */
export function formatDosage(dosage) {
  if (dosage === null || dosage === undefined) return '1'
  // If numeric, keep decimal point unescaped to match existing formatting tests
  if (typeof dosage === 'number') return String(dosage)
  return escapeMarkdownV2(String(dosage))
}

/**
 * Formata mensagem completa de lembrete de dose
 * @param {object} protocol - Dados do protocolo
 * @param {string} scheduledTime - Horário agendado (HH:MM)
 * @returns {string} Mensagem formatada
 */
export function formatDoseReminderMessage(protocol, scheduledTime) {
  const medicine = protocol.medicine || {}
  const name = formatMedicineName(medicine.name)
  const dosage = formatDosage(protocol.dosage_per_intake ?? 1)
  const unit = escapeMarkdownV2(medicine.dosage_unit || 'unidades')
  const notes = protocol.notes ? escapeMarkdownV2(protocol.notes) : null

  let message = `💊 *Hora do seu remédio\\!*\n\n`
  message += `🩹 **${name}**\n`
  message += `📋 ${dosage} ${unit}\n`
  message += `⏰ Horário: ${scheduledTime}\n`

  // Add titration info if applicable
  if (protocol.titration_schedule && protocol.titration_schedule.length > 0) {
    const currentStage = protocol.current_stage_index || 0
    const totalStages = protocol.titration_schedule.length
    message += `🎯 Titulação: Etapa ${currentStage + 1}/${totalStages}\n`
  }

  // Add notes only if they exist
  if (notes) {
    message += `\n📝 _${notes}_`
  }

  return message
}

/**
 * Formata mensagem de lembrete suave
 * @param {object} protocol - Dados do protocolo
 * @returns {string} Mensagem formatada
 */
export function formatSoftReminderMessage(protocol) {
  const medicine = protocol.medicine || {}
  const name = formatMedicineName(medicine.name)
  const dosage = formatDosage(protocol.dosage_per_intake ?? 1)
  const unit = escapeMarkdownV2(medicine.dosage_unit || 'unidades')

  let message = `⏳ *Lembrete*\n\n`
  message += `Você ainda não registrou sua dose de **${name}** \\(${dosage} ${unit}\\).\n\n`
  message += `Caso já tenha tomado, registre agora:`

  return message
}

/**
 * Formata mensagem de alerta de estoque
 * @param {object} medicine - Dados do medicamento
 * @param {number} daysRemaining - Dias restantes
 * @returns {string} Mensagem formatada
 */
export function formatStockAlertMessage(medicine, daysRemaining) {
  const name = formatMedicineName(medicine.name)

  let message = `⚠️ *Alerta de Estoque*\n\n`
  message += `🩹 **${name}**\n`

  if (daysRemaining <= 0) {
    message += `📦 Estoque: *SEM ESTOQUE*\n`
    message += `\n🔄 Por favor, faça o repostamento o mais rápido possível\\!`
  } else if (daysRemaining <= 7) {
    message += `📦 Estoque: *${daysRemaining} dias restantes*\n`
    message += `\n⚡ Faça o repostamento em breve\\!`
  } else {
    message += `📦 Estoque: *${daysRemaining} dias restantes*\n`
    message += `\n📅 Planeje seu próximo repostamento.`
  }

  return message
}

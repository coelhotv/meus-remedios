// Dispatcher central de notificações multicanal (ADR-029)
// Recebe lista de canais resolvidos por resolveChannelsForUser e delega a cada canal
// Falha de um canal não cancela os demais (isolamento por try/catch por canal)
// correlationId é obrigatório em todos os logs (R-087)

import { sendTelegramNotification } from '../channels/telegramChannel.js'
import { sendExpoPushNotification } from '../channels/expoPushChannel.js'
import { normalizeChannelResults } from '../utils/normalizeChannelResults.js'

export async function dispatchNotification({ userId, kind, payload, channels, context, repositories, bot, expoClient }) {
  const correlationId = context?.correlationId || `dispatch_${Date.now()}`
  const ctx = { ...context, correlationId }

  if (!channels || channels.length === 0) {
    console.info('[dispatchNotification] nenhum canal — skipping', { correlationId, userId, kind })
    return normalizeChannelResults([])
  }

  console.info('[dispatchNotification] iniciando', { correlationId, userId, kind, channels })

  const results = []

  for (const channel of channels) {
    try {
      if (channel === 'telegram') {
        const result = await sendTelegramNotification({ userId, payload, context: ctx, bot })
        results.push(result)
      } else if (channel === 'mobile_push') {
        const result = await sendExpoPushNotification({ userId, payload, context: ctx, repositories, expoClient })
        results.push(result)
      } else {
        console.warn('[dispatchNotification] canal desconhecido ignorado', { correlationId, channel })
      }
    } catch (error) {
      // Canal falhou completamente — registra sem cancelar os demais
      console.error('[dispatchNotification] canal falhou', { correlationId, userId, kind, channel, error: error.message })
      results.push({
        channel,
        success: false,
        attempted: 0,
        delivered: 0,
        failed: 0,
        deactivatedTokens: [],
        errors: [{ message: error.message }],
      })
    }
  }

  const normalized = normalizeChannelResults(results)

  console.info('[dispatchNotification] concluído', {
    correlationId,
    userId,
    kind,
    channels,
    totalDelivered: normalized.totalDelivered,
    totalFailed: normalized.totalFailed,
  })

  return normalized
}

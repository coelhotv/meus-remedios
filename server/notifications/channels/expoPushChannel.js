// Canal de notificação Expo Push
// Envia push para todos os devices ativos do usuário (provider = 'expo')
// expoClient é injetado para facilitar testes sem chamadas HTTP reais
// Desativa tokens com erros permanentes via shouldDeactivateDevice (R-042)

import { shouldDeactivateDevice } from '../utils/shouldDeactivateDevice.js'
import { normalizeChannelResults } from '../utils/normalizeChannelResults.js'

export async function sendExpoPushNotification({ userId, payload, context, repositories, expoClient }) {
  const correlationId = context?.correlationId || 'unknown'

  const devices = await repositories.devices.listActiveByUser(userId, 'expo')

  if (devices.length === 0) {
    console.info('[expoPushChannel] sem devices ativos', { correlationId, userId })
    return {
      channel: 'mobile_push',
      success: true,
      attempted: 0,
      delivered: 0,
      failed: 0,
      deactivatedTokens: [],
      errors: [],
    }
  }

  const messages = devices.map((device) => ({
    to: device.push_token,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: payload.metadata ?? {},
  }))

  let tickets
  try {
    tickets = await expoClient.send(messages)
  } catch (error) {
    console.error('[expoPushChannel] falha ao enviar para Expo', { correlationId, userId, error: error.message })
    return {
      channel: 'mobile_push',
      success: false,
      attempted: devices.length,
      delivered: 0,
      failed: devices.length,
      deactivatedTokens: [],
      errors: [{ message: error.message }],
    }
  }

  return normalizeExpoResult({ devices, tickets, repositories, correlationId, userId })
}

async function normalizeExpoResult({ devices, tickets, repositories, correlationId, userId }) {
  let delivered = 0
  let failed = 0
  const deactivatedTokens = []
  const errors = []

  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i]
    const device = devices[i]

    if (ticket.status === 'ok') {
      delivered++
    } else {
      failed++
      const errorCode = ticket.details?.error
      errors.push({ token: device.push_token, code: errorCode, message: ticket.message })

      if (errorCode && shouldDeactivateDevice(errorCode)) {
        try {
          await repositories.devices.deactivateByToken(device.push_token)
          deactivatedTokens.push(device.push_token)
          console.info('[expoPushChannel] token desativado', { correlationId, userId, token: device.push_token, reason: errorCode })
        } catch (deactivateError) {
          console.error('[expoPushChannel] falha ao desativar token', {
            correlationId,
            userId,
            token: device.push_token,
            error: deactivateError.message,
          })
        }
      }
    }
  }

  console.info('[expoPushChannel] resultado', { correlationId, userId, attempted: devices.length, delivered, failed, deactivatedTokens })

  return {
    channel: 'mobile_push',
    success: failed === 0,
    attempted: devices.length,
    delivered,
    failed,
    deactivatedTokens,
    errors,
  }
}

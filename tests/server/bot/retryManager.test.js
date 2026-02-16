import { describe, it, expect } from 'vitest'
import { sendWithRetry } from '../../../server/bot/retryManager.js'

describe('retryManager.sendWithRetry', () => {
  it('retries on transient failures and succeeds', async () => {
    let call = 0
    const sendFn = async () => {
      call++
      if (call < 3) {
        return { success: false, error: { message: 'ETIMEDOUT', code: 'ETIMEDOUT' } }
      }
      return { success: true, messageId: 'm-123' }
    }

    const res = await sendWithRetry(sendFn, { userId: 'u1', notificationType: 'dose_reminder' }, { baseDelay: 1, maxDelay: 2, maxRetries: 3 })

    expect(res.success).toBe(true)
    expect(res.attempts).toBeGreaterThanOrEqual(1)
    expect(res.result).toBeDefined()
    expect(res.result.messageId || res.result.result?.messageId).toBeDefined()
    expect(res.retried).toBe(true)
  })

  it('stops and returns failure when non-retryable', async () => {
    const sendFn = async () => ({ success: false, error: { message: "Bad Request: can't parse entities", code: 400 } })

    const res = await sendWithRetry(sendFn, { userId: 'u2', notificationType: 'dose_reminder' }, { baseDelay: 1, maxDelay: 2, maxRetries: 2 })

    expect(res.success).toBe(false)
    expect(res.attempts).toBeGreaterThanOrEqual(1)
    expect(res.error).toBeDefined()
  })
})


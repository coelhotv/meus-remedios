import { describe, it, expect } from 'vitest'
import { escapeMarkdownV2, formatTelegramMessage } from '../../../server/utils/telegramFormatter.js'

describe('telegramFormatter.escapeMarkdownV2', () => {
  it('escapes special MarkdownV2 characters including ! and .', () => {
    const input = "Hello! This_is *a* test [ok] (1) #tag ."
    const out = escapeMarkdownV2(input)
    expect(out).not.toContain('!')
    expect(out).toContain('\\!')
    expect(out).toContain('\\_')
    expect(out).toContain('\\*')
    expect(out).toContain('\\[')
  })
})

describe('telegramFormatter.formatTelegramMessage', () => {
  it('replaces variables and escapes them', () => {
    const tpl = 'Olá {{name}}! Hora: {{time}}'
    const msg = formatTelegramMessage(tpl, { name: 'User!', time: '08:00' })
    expect(msg).toContain('User\\!')
    expect(msg).toContain('08:00')
  })
})


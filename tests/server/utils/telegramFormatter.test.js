import { describe, it, expect } from 'vitest'
import { escapeMarkdownV2, formatTelegramMessage } from '../../../server/utils/telegramFormatter.js'

describe('telegramFormatter.escapeMarkdownV2', () => {
  it('escapes special MarkdownV2 characters including ! and . (no unescaped instances)', () => {
    const input = "Hello! This_is *a* test [ok] (1) #tag ."
    const out = escapeMarkdownV2(input)
    // Ensure there are no unescaped '!' characters (i.e. all are preceded by a backslash)
    expect(out).toMatch(/\\!/)
    expect(out).not.toMatch(/(^|[^\\])!/) // no '!' that is not escaped
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

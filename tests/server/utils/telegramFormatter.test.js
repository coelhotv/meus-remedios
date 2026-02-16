// tests/server/utils/telegramFormatter.test.js
import { describe, it, expect } from 'vitest'

// Import the module
const {
  escapeMarkdownV2,
  escapeMarkdownSafe,
  formatTelegramMessage,
  formatMedicineName,
  formatDosage,
  formatDoseReminderMessage,
  formatSoftReminderMessage,
  formatStockAlertMessage
} = require('../../../server/utils/telegramFormatter.js')

describe('telegramFormatter', () => {
  describe('escapeMarkdownV2', () => {
    it('deve escapar caracteres especiais', () => {
      expect(escapeMarkdownV2('hello_world')).toBe('hello\\_world')
      expect(escapeMarkdownV2('*bold*')).toBe('\\*bold\\*')
      expect(escapeMarkdownV2('italic_text')).toBe('italic\\_text')
      expect(escapeMarkdownV2('`code`')).toBe('\\`code\\`')
      expect(escapeMarkdownV2('~strikethrough~')).toBe('\\~strikethrough\\~')
    })

    it('deve escapar colchetes', () => {
      expect(escapeMarkdownV2('[link](url)')).toBe('\\[link\\]\\(url\\)')
    })

    it('deve escapar caracteres especiais múltiplos', () => {
      expect(escapeMarkdownV2('*test*_hello_~world~')).toBe('\\*test*\\_hello\\_\\~world\\~')
    })

    it('deve retornar string vazia para entrada nula', () => {
      expect(escapeMarkdownV2(null)).toBe('')
      expect(escapeMarkdownV2(undefined)).toBe('')
      expect(escapeMarkdownV2('')).toBe('')
    })

    it('deve retornar string vazia para tipos não-string', () => {
      expect(escapeMarkdownV2(123)).toBe('')
      expect(escapeMarkdownV2({})).toBe('')
      expect(escapeMarkdownV2([])).toBe('')
    })
  })

  describe('escapeMarkdownSafe', () => {
    it('deve escapar caracteres exceto parênteses', () => {
      const result = escapeMarkdownSafe('hello_world and (parentheses)')
      expect(result).toBe('hello\\_world and (parentheses)')
    })

    it('deve escapar asterisco mas manter parênteses', () => {
      const result = escapeMarkdownSafe('*bold* (note)')
      expect(result).toBe('\\*bold* (note)')
    })
  })

  describe('formatTelegramMessage', () => {
    it('deve substituir variáveis no template', () => {
      const template = 'Olá {{name}}, sua dose de {{medicine}} está agendada.'
      const variables = { name: 'João', medicine: 'Aspirina' }

      const result = formatTelegramMessage(template, variables)

      expect(result).toBe('Olá João, sua dose de Aspirina está agendada.')
    })

    it('deve escapar valores das variáveis', () => {
      const template = 'Mensagem: {{text}}'
      const variables = { text: 'hello_world' }

      const result = formatTelegramMessage(template, variables)

      expect(result).toBe('Mensagem: hello\\_world')
    })

    it('deve retornar string vazia para template vazio', () => {
      expect(formatTelegramMessage('')).toBe('')
      expect(formatTelegramMessage(null)).toBe('')
    })

    it('deve lidar com variáveis ausentes', () => {
      const template = 'Olá {{name}}, {{missing}}'
      const variables = { name: 'João' }

      const result = formatTelegramMessage(template, variables)

      expect(result).toBe('Olá João, {{missing}}')
    })
  })

  describe('formatMedicineName', () => {
    it('deve formatar nome de medicamento', () => {
      expect(formatMedicineName('Aspirina')).toBe('Aspirina')
      expect(formatMedicineName('Paracetamol')).toBe('Paracetamol')
    })

    it('deve escapar caracteres especiais no nome', () => {
      expect(formatMedicineName('Remédio_Teste')).toBe('Remédio\\_Teste')
    })

    it('deve retornar valor padrão para nome vazio', () => {
      expect(formatMedicineName('')).toBe('Medicamento')
      expect(formatMedicineName(null)).toBe('Medicamento')
    })

    it('deve remover espaços em branco', () => {
      expect(formatMedicineName('  Aspirina  ')).toBe('Aspirina')
    })
  })

  describe('formatDosage', () => {
    it('deve formatar dosage numérico', () => {
      expect(formatDosage(500)).toBe('500')
      expect(formatDosage(1.5)).toBe('1.5')
    })

    it('deve formatar dosage string', () => {
      expect(formatDosage('100')).toBe('100')
    })

    it('deve retornar valor padrão para null', () => {
      expect(formatDosage(null)).toBe('1')
      expect(formatDosage(undefined)).toBe('1')
    })
  })

  describe('formatDoseReminderMessage', () => {
    it('deve formatar mensagem completa de lembrete', () => {
      const protocol = {
        medicine: { name: 'Aspirina', dosage_unit: 'mg' },
        dosage_per_intake: 100,
        notes: 'Tomar com água'
      }

      const result = formatDoseReminderMessage(protocol, '08:00')

      expect(result).toContain('Aspirina')
      expect(result).toContain('100')
      expect(result).toContain('mg')
      expect(result).toContain('08:00')
      expect(result).toContain('Tomar com água')
    })

    it('deve escapar caracteres especiais', () => {
      const protocol = {
        medicine: { name: 'Remédio_Teste', dosage_unit: 'mg' },
        dosage_per_intake: 100,
        notes: 'Teste_ nota'
      }

      const result = formatDoseReminderMessage(protocol, '08:00')

      expect(result).toContain('Remédio\\_Teste')
      expect(result).toContain('Teste\\_ nota')
    })

    it('deve lidar com protocolo sem notas', () => {
      const protocol = {
        medicine: { name: 'Aspirina', dosage_unit: 'mg' },
        dosage_per_intake: 100
      }

      const result = formatDoseReminderMessage(protocol, '08:00')

      expect(result).not.toContain('undefined')
      expect(result).not.toContain('null')
    })

    it('deve incluir info de titulação quando presente', () => {
      const protocol = {
        medicine: { name: 'Aspirina', dosage_unit: 'mg' },
        dosage_per_intake: 100,
        titration_schedule: [{}, {}, {}],
        current_stage_index: 1
      }

      const result = formatDoseReminderMessage(protocol, '08:00')

      expect(result).toContain('Titulação: Etapa 2/3')
    })
  })

  describe('formatSoftReminderMessage', () => {
    it('deve formatar mensagem de lembrete suave', () => {
      const protocol = {
        medicine: { name: 'Aspirina', dosage_unit: 'mg' },
        dosage_per_intake: 100
      }

      const result = formatSoftReminderMessage(protocol)

      expect(result).toContain('Aspirina')
      expect(result).toContain('100')
      expect(result).toContain('mg')
      expect(result).toContain('Lembrete')
    })
  })

  describe('formatStockAlertMessage', () => {
    it('deve formatar alerta de estoque crítico', () => {
      const medicine = { name: 'Aspirina', dosage_unit: 'mg' }

      const result = formatStockAlertMessage(medicine, 0)

      expect(result).toContain('Aspirina')
      expect(result).toContain('SEM ESTOQUE')
    })

    it('deve formatar alerta de estoque baixo', () => {
      const medicine = { name: 'Aspirina', dosage_unit: 'mg' }

      const result = formatStockAlertMessage(medicine, 5)

      expect(result).toContain('Aspirina')
      expect(result).toContain('5 dias restantes')
    })

    it('deve formatar alerta de estoque normal', () => {
      const medicine = { name: 'Aspirina', dosage_unit: 'mg' }

      const result = formatStockAlertMessage(medicine, 30)

      expect(result).toContain('Aspirina')
      expect(result).toContain('30 dias restantes')
    })
  })
})

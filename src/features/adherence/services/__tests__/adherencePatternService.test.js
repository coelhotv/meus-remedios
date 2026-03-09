import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { analyzeAdherencePatterns } from '../adherencePatternService'

describe('adherencePatternService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  describe('analyzeAdherencePatterns', () => {
    // Utilitários para testes
    const createLog = (medicineId, protocolId, quantityTaken, dateStr, hour = 10) => ({
      id: `log-${Math.random()}`,
      medicine_id: medicineId,
      protocol_id: protocolId,
      quantity_taken: quantityTaken,
      taken_at: `${dateStr}T${String(hour).padStart(2, '0')}:00:00Z`,
    })

    const createProtocol = (id, medicineId, frequency = 'diário', timeSchedule = ['09:00', '21:00']) => ({
      id,
      medicine_id: medicineId,
      name: `Medicamento ${id}`,
      frequency,
      time_schedule: timeSchedule,
      dosage_per_intake: 1,
    })

    it('retorna hasEnoughData=false com < 21 dias de dados', () => {
      const medicineId = 'med-1'
      const protocolId = 'proto-1'
      const logs = [
        createLog(medicineId, protocolId, 1, '2026-02-24', 9),
        createLog(medicineId, protocolId, 1, '2026-02-25', 9),
        createLog(medicineId, protocolId, 1, '2026-02-26', 9),
        // Apenas 3 dias
      ]
      const protocols = [createProtocol(protocolId, medicineId)]

      const result = analyzeAdherencePatterns({ logs, protocols })

      expect(result.hasEnoughData).toBe(false)
      expect(result.worstCell).toBeNull()
      expect(result.narrative).toContain('21 dias')
    })

    it('retorna hasEnoughData=true com >= 21 dias de dados', () => {
      const medicineId = 'med-1'
      const protocolId = 'proto-1'
      const logs = []

      // Criar 21 dias de logs
      for (let i = 0; i < 21; i++) {
        const date = new Date(2026, 1, 24 + i) // Fevereiro 24 - março 16
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        logs.push(createLog(medicineId, protocolId, 1, dateStr, 9))
      }

      const protocols = [createProtocol(protocolId, medicineId)]

      const result = analyzeAdherencePatterns({ logs, protocols })

      expect(result.hasEnoughData).toBe(true)
      expect(result.grid).toHaveLength(7) // 7 dias da semana
      expect(result.grid[0]).toHaveLength(4) // 4 períodos
    })

    it('calcula grid 7x4 com adherência correta', () => {
      const medicineId = 'med-1'
      const protocolId = 'proto-1'
      const logs = []

      // 21 dias: dia 24 (segunda) a 16 (terça)
      for (let i = 0; i < 21; i++) {
        const date = new Date(2026, 1, 24 + i)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        // Tomar medicamento sempre às 9 (manhã, período 1)
        logs.push(createLog(medicineId, protocolId, 1, dateStr, 9))
      }

      // Protocolo: diário, 09:00 e 21:00 (2 vezes/dia)
      const protocols = [createProtocol(protocolId, medicineId, 'diário', ['09:00', '21:00'])]

      const result = analyzeAdherencePatterns({ logs, protocols })

      // Grid deve ter adherência 50% em manhã (9h) pois só toma uma das 2 vezes
      expect(result.grid[1][1].adherence).toBe(50) // Segunda, Manhã: 1 tomado / 2 esperado = 50%
      expect(result.grid[1][1].taken).toBe(1)
      expect(result.grid[1][1].expected).toBe(2) // 2 doses esperadas (09:00 e 21:00)
    })

    it('identifica pior célula corretamente', () => {
      const medicineId = 'med-1'
      const protocolId = 'proto-1'
      const logs = []

      // 21 dias de logs, mas variando adherência por período
      for (let i = 0; i < 21; i++) {
        const date = new Date(2026, 1, 24 + i)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

        // Tomar manhã (09:00) sempre
        logs.push(createLog(medicineId, protocolId, 1, dateStr, 9))

        // Tomar à noite (21:00) apenas em 50% dos dias (i par)
        if (i % 2 === 0) {
          logs.push(createLog(medicineId, protocolId, 1, dateStr, 21))
        }
      }

      // Protocolo: diário, manhã e noite
      const protocols = [createProtocol(protocolId, medicineId, 'diário', ['09:00', '21:00'])]

      const result = analyzeAdherencePatterns({ logs, protocols })

      expect(result.worstCell).not.toBeNull()
      // Pior célula deve ser período noite (21:00 = 50% adherência)
      expect(result.worstCell.periodName.toLowerCase()).toContain('noite')
      expect(result.worstCell.adherence).toBe(50)
    })

    it('gera narrativa com dia e período do pior horário', () => {
      const medicineId = 'med-1'
      const protocolId = 'proto-1'
      const logs = []

      // 21 dias, sempre tomar na quarta-feira à tarde (muito baixa adesão)
      for (let i = 0; i < 21; i++) {
        const date = new Date(2026, 1, 24 + i)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

        // Tomar sempre manhã
        logs.push(createLog(medicineId, protocolId, 1, dateStr, 9))

        // Tomar tarde (15:00) apenas se quarta-feira (dias 26, 5, 12, 19)
        const dayOfWeek = date.getDay()
        if (dayOfWeek === 3) { // Quarta = 3
          // Não tomar à tarde em quarta
        } else {
          logs.push(createLog(medicineId, protocolId, 1, dateStr, 15))
        }
      }

      // Protocolo: diário, manhã, tarde e noite
      const protocols = [createProtocol(protocolId, medicineId, 'diário', ['09:00', '15:00', '21:00'])]

      const result = analyzeAdherencePatterns({ logs, protocols })

      expect(result.narrative).toContain('pior horário')
      if (result.worstCell) {
        expect(result.narrative).toContain(result.worstCell.dayName)
        expect(result.narrative).toContain(result.worstCell.periodName.toLowerCase())
      }
    })

    it('não penaliza períodos sem doses esperadas (adherência = 100%)', () => {
      const medicineId = 'med-1'
      const protocolId = 'proto-1'
      const logs = []

      // 21 dias, tomar apenas às 9 (manhã)
      for (let i = 0; i < 21; i++) {
        const date = new Date(2026, 1, 24 + i)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        logs.push(createLog(medicineId, protocolId, 1, dateStr, 9))
      }

      // Protocolo: apenas uma vez/dia às 9 (manhã)
      const protocols = [createProtocol(protocolId, medicineId, 'diário', ['09:00'])]

      const result = analyzeAdherencePatterns({ logs, protocols })

      // Períodos madrugada, tarde, noite não têm doses esperadas
      // Devem ter adherência = 100%
      expect(result.grid[1][0].expected).toBe(0) // Madrugada
      expect(result.grid[1][0].adherence).toBe(100)
      expect(result.grid[1][3].expected).toBe(0) // Noite
      expect(result.grid[1][3].adherence).toBe(100)
    })

    it('cap adherência em 100% se há mais doses que esperado', () => {
      const medicineId = 'med-1'
      const protocolId = 'proto-1'
      const logs = []

      // 21 dias, mas tomar 2x na manhã quando esperado é 1x
      for (let i = 0; i < 21; i++) {
        const date = new Date(2026, 1, 24 + i)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        logs.push(createLog(medicineId, protocolId, 2, dateStr, 9)) // quantity_taken = 2
      }

      // Protocolo: 1 vez/dia às 9
      const protocols = [createProtocol(protocolId, medicineId, 'diário', ['09:00'])]

      const result = analyzeAdherencePatterns({ logs, protocols })

      // Manhã: 2/1 * 100 = 200%, mas deve ser capped em 100%
      expect(result.grid[1][1].adherence).toBe(100)
    })

    it('retorna pior célula = null quando todos os períodos têm adherência 100%', () => {
      const medicineId = 'med-1'
      const protocolId = 'proto-1'
      const logs = []

      // 21 dias perfeitos
      for (let i = 0; i < 21; i++) {
        const date = new Date(2026, 1, 24 + i)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        logs.push(createLog(medicineId, protocolId, 1, dateStr, 9))
      }

      // Protocolo: 1x/dia
      const protocols = [createProtocol(protocolId, medicineId, 'diário', ['09:00'])]

      const result = analyzeAdherencePatterns({ logs, protocols })

      // Sem pior célula (todos 100% ou 0 esperado)
      expect(result.worstCell).toBeNull()
      expect(result.narrative).toContain('excelente')
    })

    it('valida entrada com Zod e lança erro em dados inválidos', () => {
      const invalidLogs = [{ invalid: 'data' }]
      const protocols = []

      expect(() => {
        analyzeAdherencePatterns({ logs: invalidLogs, protocols })
      }).toThrow()
    })

    it('mapeia frequência diária para todos os 7 dias', () => {
      const medicineId = 'med-1'
      const protocolId = 'proto-1'
      const logs = []

      // 21 dias, sempre tomar às 9
      for (let i = 0; i < 21; i++) {
        const date = new Date(2026, 1, 24 + i)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        logs.push(createLog(medicineId, protocolId, 1, dateStr, 9))
      }

      // Protocolo: diário
      const protocols = [createProtocol(protocolId, medicineId, 'diário', ['09:00'])]

      const result = analyzeAdherencePatterns({ logs, protocols })

      // Todos os 7 dias devem ter expected=1 (uma vez/dia)
      for (let day = 0; day < 7; day++) {
        expect(result.grid[day][1].expected).toBe(1) // Manhã (período 1)
      }
    })

    it('mapeia frequência dias_alternados corretamente', () => {
      const medicineId = 'med-1'
      const protocolId = 'proto-1'
      const logs = []

      // 21 dias
      for (let i = 0; i < 21; i++) {
        const date = new Date(2026, 1, 24 + i)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        logs.push(createLog(medicineId, protocolId, 1, dateStr, 9))
      }

      // Protocolo: dias alternados (0, 2, 4, 6)
      const protocols = [createProtocol(protocolId, medicineId, 'dias_alternados', ['09:00'])]

      const result = analyzeAdherencePatterns({ logs, protocols })

      // Domingo (0), Terça (2), Quinta (4), Sábado (6) devem ter expected=1
      expect(result.grid[0][1].expected).toBe(1) // Domingo
      expect(result.grid[2][1].expected).toBe(1) // Terça
      expect(result.grid[4][1].expected).toBe(1) // Quinta
      expect(result.grid[6][1].expected).toBe(1) // Sábado

      // Segunda (1), Quarta (3), Sexta (5) devem ter expected=0
      expect(result.grid[1][1].expected).toBe(0) // Segunda
      expect(result.grid[3][1].expected).toBe(0) // Quarta
      expect(result.grid[5][1].expected).toBe(0) // Sexta
    })

    it('ignora quando_necessário e personalizado (expected=0)', () => {
      const medicineId = 'med-1'
      const protocolId = 'proto-1'
      const logs = []

      // 21 dias
      for (let i = 0; i < 21; i++) {
        const date = new Date(2026, 1, 24 + i)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        logs.push(createLog(medicineId, protocolId, 1, dateStr, 9))
      }

      // Protocolo: quando_necessário
      const protocols = [createProtocol(protocolId, medicineId, 'quando_necessário', ['09:00'])]

      const result = analyzeAdherencePatterns({ logs, protocols })

      // Todos os períodos devem ter expected=0
      for (let day = 0; day < 7; day++) {
        for (let period = 0; period < 4; period++) {
          expect(result.grid[day][period].expected).toBe(0)
        }
      }
    })

    it('mapeia horas para períodos corretos', () => {
      const medicineId = 'med-1'
      const protocolId = 'proto-1'
      const logs = [
        // 21 dias com diferentes horários
        ...Array.from({ length: 21 }, (_, i) => {
          const date = new Date(2026, 1, 24 + i)
          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          return [
            createLog(medicineId, protocolId, 1, dateStr, 3),  // Madrugada (0-6)
            createLog(medicineId, protocolId, 1, dateStr, 9),  // Manhã (6-12)
            createLog(medicineId, protocolId, 1, dateStr, 15), // Tarde (12-18)
            createLog(medicineId, protocolId, 1, dateStr, 21), // Noite (18-24)
          ]
        }).flat(),
      ]

      const protocols = [createProtocol(protocolId, medicineId, 'diário', ['03:00', '09:00', '15:00', '21:00'])]

      const result = analyzeAdherencePatterns({ logs, protocols })

      // Segunda-feira
      expect(result.grid[1][0].taken).toBe(21) // Madrugada
      expect(result.grid[1][1].taken).toBe(21) // Manhã
      expect(result.grid[1][2].taken).toBe(21) // Tarde
      expect(result.grid[1][3].taken).toBe(21) // Noite
    })
  })
})

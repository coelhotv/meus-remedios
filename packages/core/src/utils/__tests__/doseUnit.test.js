import { describe, it, expect } from 'vitest'
import { pluralizeDoseUnit, formatDoseUnit } from '../doseUnit.js'

describe('pluralizeDoseUnit', () => {
  it('comprimido singular quando qty=1 e unidade mg/cp/g/mcg', () => {
    expect(pluralizeDoseUnit(1, 'mg')).toBe('comprimido')
    expect(pluralizeDoseUnit(1, 'cp')).toBe('comprimido')
    expect(pluralizeDoseUnit(1, 'g')).toBe('comprimido')
    expect(pluralizeDoseUnit(1, 'mcg')).toBe('comprimido')
  })

  it('comprimidos plural quando qty>1 ou !=1', () => {
    expect(pluralizeDoseUnit(2, 'mg')).toBe('comprimidos')
    expect(pluralizeDoseUnit(0.5, 'mg')).toBe('comprimidos')
    expect(pluralizeDoseUnit(0, 'cp')).toBe('comprimidos')
  })

  it('ml mantém igual singular/plural', () => {
    expect(pluralizeDoseUnit(1, 'ml')).toBe('ml')
    expect(pluralizeDoseUnit(15, 'ml')).toBe('ml')
  })

  it('gotas singular/plural', () => {
    expect(pluralizeDoseUnit(1, 'gotas')).toBe('gota')
    expect(pluralizeDoseUnit(15, 'gotas')).toBe('gotas')
  })

  it('UI mantém igual', () => {
    expect(pluralizeDoseUnit(1, 'ui')).toBe('UI')
    expect(pluralizeDoseUnit(4, 'ui')).toBe('UI')
  })

  it('fallback unidades quando dosageUnit undefined ou desconhecida', () => {
    expect(pluralizeDoseUnit(1, undefined)).toBe('unidade')
    expect(pluralizeDoseUnit(2, undefined)).toBe('unidades')
    expect(pluralizeDoseUnit(2, 'xyz')).toBe('unidades')
  })

  it('coerce string para number', () => {
    expect(pluralizeDoseUnit('1', 'mg')).toBe('comprimido')
    expect(pluralizeDoseUnit('2', 'mg')).toBe('comprimidos')
  })
})

describe('formatDoseUnit', () => {
  it('formata inteiro + unidade', () => {
    expect(formatDoseUnit(2, 'mg')).toBe('2 comprimidos')
    expect(formatDoseUnit(1, 'gotas')).toBe('1 gota')
  })

  it('formata decimal com vírgula PT-BR', () => {
    expect(formatDoseUnit(15.5, 'ml')).toBe('15,5 ml')
    expect(formatDoseUnit(0.5, 'mg')).toBe('0,5 comprimidos')
  })

  it('aceita string como qty', () => {
    expect(formatDoseUnit('1', 'mg')).toBe('1 comprimido')
    expect(formatDoseUnit('0.5', 'ml')).toBe('0,5 ml')
  })

  it('fallback unidades quando dosageUnit ausente', () => {
    expect(formatDoseUnit(3, undefined)).toBe('3 unidades')
    expect(formatDoseUnit(1, undefined)).toBe('1 unidade')
  })
})

// doseUnit.js — Apresentação de quantidade + unidade de dose (Fase 2).
//
// Helper compartilhado web↔mobile. Sempre usar em vez de hardcoded "comprimidos".
// Hermes (mobile) default NÃO inclui ICU completo — toLocaleString('pt-BR') cai em
// fallback US. Por isso usamos replace('.', ',') manual (confiável em V8 e Hermes).

const UNIT_DISPLAY = {
  mg: { singular: 'comprimido', plural: 'comprimidos' },
  mcg: { singular: 'comprimido', plural: 'comprimidos' },
  g: { singular: 'comprimido', plural: 'comprimidos' },
  cp: { singular: 'comprimido', plural: 'comprimidos' },
  ml: { singular: 'ml', plural: 'ml' },
  gotas: { singular: 'gota', plural: 'gotas' },
  ui: { singular: 'UI', plural: 'UI' },
}

const FALLBACK = { singular: 'unidade', plural: 'unidades' }

/**
 * Retorna a palavra correta de unidade (singular/plural) para a quantidade.
 * Coerce explícito via Number — valores podem chegar como string de TextInput.
 *
 * @example pluralizeDoseUnit(2, 'mg')    → 'comprimidos'
 * @example pluralizeDoseUnit(1, 'gotas') → 'gota'
 * @example pluralizeDoseUnit(15, 'ml')   → 'ml'
 * @example pluralizeDoseUnit(2, undefined) → 'unidades'
 */
export function pluralizeDoseUnit(qty, dosageUnit) {
  const u = UNIT_DISPLAY[dosageUnit] ?? FALLBACK
  return Number(qty) === 1 ? u.singular : u.plural
}

/**
 * Formata quantidade + unidade para exibição. Vírgula decimal PT-BR.
 *
 * @example formatDoseUnit(2, 'mg')      → '2 comprimidos'
 * @example formatDoseUnit(1, 'gotas')   → '1 gota'
 * @example formatDoseUnit(15.5, 'ml')   → '15,5 ml'
 * @example formatDoseUnit('0.5', 'mg')  → '0,5 comprimidos'
 */
export function formatDoseUnit(qty, dosageUnit) {
  const display = String(qty).replace('.', ',')
  return `${display} ${pluralizeDoseUnit(qty, dosageUnit)}`
}

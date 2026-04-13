// dashboardService.js — serviço thin para dados do dashboard mobile
// ADR-029: thin local service — chama Supabase directamente via nativeSupabaseClient
// Schemas de domínio via @meus-remedios/core (nunca duplicar lógica de negócio)

import { supabase } from '../../../platform/supabase/nativeSupabaseClient'

/**
 * Busca protocolos activos do utilizador.
 * Selecciona apenas colunas necessárias para o dashboard (R-127: slim select).
 *
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function getActiveProtocols(userId) {
  const { data, error } = await supabase
    .from('protocols')
    .select('id, name, medicine_id, frequency, time_schedule, dosage_per_intake, titration_status')
    .eq('user_id', userId)
    .eq('active', true)
    .order('name')

  if (error) throw error
  return data ?? []
}

/**
 * Busca os logs de medicação de um dia específico.
 * Intervalo: início do dia local até ao fim do dia local.
 * R-020: nunca usar new Date('YYYY-MM-DD') — concatenar T00:00:00 / T23:59:59 garante timezone correcto.
 *
 * @param {string} userId
 * @param {string} dateStr  — formato YYYY-MM-DD
 * @returns {Promise<Array>}
 */
export async function getTodayLogs(userId, dateStr) {
  const { data, error } = await supabase
    .from('medicine_logs')
    .select('id, protocol_id, medicine_id, taken_at, quantity_taken')
    .eq('user_id', userId)
    .gte('taken_at', `${dateStr}T00:00:00`)
    .lte('taken_at', `${dateStr}T23:59:59`)

  if (error) throw error
  return data ?? []
}

/**
 * Busca os nomes dos medicamentos referenciados pelos protocolos.
 * Usado para enriquecer a lista de doses na tela Hoje.
 *
 * @param {string[]} medicineIds
 * @returns {Promise<Record<string, string>>} — map de id → name
 */
export async function getMedicineNames(medicineIds) {
  if (!medicineIds.length) return {}

  const { data, error } = await supabase
    .from('medicines')
    .select('id, name')
    .in('id', medicineIds)

  if (error) throw error

  return (data ?? []).reduce((acc, m) => {
    acc[m.id] = m.name
    return acc
  }, {})
}

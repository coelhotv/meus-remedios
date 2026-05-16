// protocolService.js — CRUD mobile de protocolos (Fase 2 G1: cópia web → mobile).
//
// G1 (cópia) por design: arquivo independente, sem factory, para validar
// contrato + schemas no Hermes antes de extrair para @dosiq/core em G2 (Sprint T2.3).
// Espelha apps/web/src/features/protocols/services/protocolService.js — qualquer
// divergência intencional deve ser comentada inline.
//
// DI mobile:
// - client: nativeSupabaseClient (Expo)
// - getUserId via supabase.auth.getUser()
// - schemas/utils via @dosiq/core (validateProtocolCreate/Update, getTodayLocal, getServerTimestamp)

import {
  validateProtocolCreate,
  validateProtocolUpdate,
  getTodayLocal,
  getServerTimestamp,
} from '@dosiq/core'
import { supabase } from '../../../platform/supabase/nativeSupabaseClient'

async function getUserId() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Sessão expirada. Faça login novamente.')
  return user.id
}

function formatValidationError(errors) {
  const msg = errors.map((e) => `${e.field}: ${e.message}`).join('; ')
  return new Error(`Erro de validação: ${msg}`)
}

// Selects compostos — espelhar web. Detail/list incluem medicine + treatment_plan.
const LIST_SELECT = `
  *,
  medicine:medicines(*),
  treatment_plan:treatment_plans(id, name, emoji, color)
`

const DETAIL_SELECT = `
  *,
  medicine:medicines(*),
  treatment_plan:treatment_plans(*)
`

export const protocolService = {
  async getAll() {
    const { data, error } = await supabase
      .from('protocols')
      .select(LIST_SELECT)
      .eq('user_id', await getUserId())
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async getActive(date = getTodayLocal()) {
    const { data, error } = await supabase
      .from('protocols')
      .select(LIST_SELECT)
      .eq('user_id', await getUserId())
      .eq('active', true)
      .lte('start_date', date)
      .or(`end_date.is.null,end_date.gte.${date}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('protocols')
      .select(DETAIL_SELECT)
      .eq('id', id)
      .eq('user_id', await getUserId())
      .single()

    if (error) throw error
    return data
  },

  async create(protocol) {
    const validation = validateProtocolCreate(protocol)
    if (!validation.success) throw formatValidationError(validation.errors)

    const validated = validation.data
    const { data, error } = await supabase
      .from('protocols')
      .insert([
        {
          ...validated,
          user_id: await getUserId(),
          titration_schedule: validated.titration_schedule || [],
          current_stage_index: validated.current_stage_index || 0,
          stage_started_at:
            validated.titration_schedule?.length > 0 ? getServerTimestamp() : null,
        },
      ])
      .select(DETAIL_SELECT)
      .single()

    if (error) throw error
    return data
  },

  async update(id, updates) {
    const validation = validateProtocolUpdate(updates)
    if (!validation.success) throw formatValidationError(validation.errors)

    const { data, error } = await supabase
      .from('protocols')
      .update(validation.data)
      .eq('id', id)
      .eq('user_id', await getUserId())
      .select(DETAIL_SELECT)
      .single()

    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('protocols')
      .delete()
      .eq('id', id)
      .eq('user_id', await getUserId())

    if (error) throw error
  },

  async getByMedicineId(medicineId) {
    const { data, error } = await supabase
      .from('protocols')
      .select('*')
      .eq('medicine_id', medicineId)
      .eq('user_id', await getUserId())

    if (error) throw error
    return data ?? []
  },
}

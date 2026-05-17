// treatmentPlanService.js — CRUD mobile de planos terapêuticos (Fase 2 G1).
//
// G1 cópia direta de apps/web/src/features/protocols/services/treatmentPlanService.js
// DI: nativeSupabaseClient + getUserId via supabase.auth.
// Web não valida Zod (não há schema canônico); mobile espelha.

import { supabase } from '../../../platform/supabase/nativeSupabaseClient'

async function getUserId() {
  const { data, error } = await supabase.auth.getUser()
  const user = data?.user
  if (error || !user) throw new Error('Sessão expirada. Faça login novamente.')
  return user.id
}

const FULL_SELECT = `
  *,
  protocols:protocols(
    *,
    medicine:medicines(*)
  )
`

export const treatmentPlanService = {
  async getAll() {
    const { data, error } = await supabase
      .from('treatment_plans')
      .select(FULL_SELECT)
      .eq('user_id', await getUserId())
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('treatment_plans')
      .select(FULL_SELECT)
      .eq('id', id)
      .eq('user_id', await getUserId())
      .single()

    if (error) throw error
    return data
  },

  async create(plan) {
    const { data, error } = await supabase
      .from('treatment_plans')
      .insert([{ ...plan, user_id: await getUserId() }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('treatment_plans')
      .update(updates)
      .eq('id', id)
      .eq('user_id', await getUserId())
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Nota: protocols associados têm treatment_plan_id setado para NULL via ON DELETE SET NULL.
  async delete(id) {
    const { error } = await supabase
      .from('treatment_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', await getUserId())

    if (error) throw error
  },
}

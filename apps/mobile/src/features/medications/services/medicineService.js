// medicineService.js — CRUD de medicamentos no mobile (Fase 1 G1)
// Cópia adaptada de apps/web/src/features/medications/services/medicineService.js
//
// Adaptações web → mobile:
// - supabase: importa do nativeSupabaseClient (singleton mobile)
// - getUserId: inline via supabase.auth.getUser() (padrão mobile, ver doseService.js)
// - schemas: validateMedicineCreate/Update vêm de @dosiq/core (não @schemas/web)
// - costAnalysisService: NÃO carregado aqui (v1 — decisão pré-G3 opção B).
//   avg_price é responsabilidade do consumer (hook useMedicines) quando aplicável.

import { supabase } from '../../../platform/supabase/nativeSupabaseClient'
import { validateMedicineCreate, validateMedicineUpdate } from '@dosiq/core'

async function getUserId() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Sessão expirada. Faça login novamente.')
  return user.id
}

export const medicineService = {
  async getAll() {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('medicines')
      .select(`
        *,
        stock(*),
        purchases(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async getById(id) {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('medicines')
      .select(`
        *,
        stock(*),
        purchases(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  },

  async create(medicine) {
    const validation = validateMedicineCreate(medicine)
    if (!validation.success) {
      const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`).join('; ')
      throw new Error(`Erro de validação: ${errorMessages}`)
    }
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('medicines')
      .insert([{ ...validation.data, user_id: userId }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id, updates) {
    const validation = validateMedicineUpdate(updates)
    if (!validation.success) {
      const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`).join('; ')
      throw new Error(`Erro de validação: ${errorMessages}`)
    }
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('medicines')
      .update(validation.data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id) {
    const userId = await getUserId()
    const { error } = await supabase
      .from('medicines')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  },
}

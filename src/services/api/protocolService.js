import { supabase, getUserId } from '../../lib/supabase'

/**
 * Protocol Service - CRUD operations for protocols
 */
export const protocolService = {
  /**
   * Get all protocols with medicine info
   */
  async getAll() {
    const { data, error } = await supabase
      .from('protocols')
      .select(`
        *,
        medicine:medicines(*)
      `)
      .eq('user_id', await getUserId())
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  /**
   * Get active protocols only
   */
  async getActive() {
    const { data, error } = await supabase
      .from('protocols')
      .select(`
        *,
        medicine:medicines(*)
      `)
      .eq('user_id', await getUserId())
      .eq('active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  /**
   * Get a single protocol by ID
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('protocols')
      .select(`
        *,
        medicine:medicines(*)
      `)
      .eq('id', id)
      .eq('user_id', await getUserId())
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Create a new protocol
   */
  async create(protocol) {
    const { data, error } = await supabase
      .from('protocols')
      .insert([{ 
        ...protocol, 
        user_id: await getUserId(),
        // Ensure defaults for titration
        titration_schedule: protocol.titration_schedule || [],
        current_stage_index: protocol.current_stage_index || 0,
        stage_started_at: protocol.titration_schedule?.length > 0 ? new Date().toISOString() : null
      }])
      .select(`
        *,
        medicine:medicines(*),
        treatment_plan:treatment_plans(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Update an existing protocol
   */
  async update(id, updates) {
    const { data, error } = await supabase
      .from('protocols')
      .update(updates)
      .eq('id', id)
      .eq('user_id', await getUserId())
      .select(`
        *,
        medicine:medicines(*),
        treatment_plan:treatment_plans(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Delete a protocol
   */
  async delete(id) {
    const { error } = await supabase
      .from('protocols')
      .delete()
      .eq('id', id)
      .eq('user_id', await getUserId())
    
    if (error) throw error
  },

  //  API method fetches all protocols associated with a given medicine IDs
  async getByMedicineId(medicineId) {
    const { data, error } = await supabase
      .from('protocols')
      .select(`*`)
      .eq('medicine_id', medicineId)
      .eq('user_id', await getUserId());

    if (error) throw error;
    return data;
  },

  /**
   * Advance to the next titration stage
   * @param {string} id - Protocol ID
   * @param {boolean} markAsCompleted - If true, marks the protocol as completed (final stage reached)
   */
  async advanceTitrationStage(id, markAsCompleted = false) {
    // 1. Get current protocol
    const protocol = await this.getById(id)
    
    if (!protocol.titration_schedule || protocol.titration_schedule.length === 0) {
      throw new Error('Este protocolo não possui regime de titulação')
    }

    const currentStageIndex = protocol.current_stage_index || 0
    const nextStageIndex = currentStageIndex + 1

    // 2. Check if there's a next stage
    if (nextStageIndex >= protocol.titration_schedule.length) {
      // No more stages - mark as completed
      const { data, error } = await supabase
        .from('protocols')
        .update({
          titration_status: 'alvo_atingido',
          current_stage_index: protocol.titration_schedule.length - 1, // Keep at last stage
          stage_started_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', await getUserId())
        .select(`
          *,
          medicine:medicines(*),
          treatment_plan:treatment_plans(*)
        `)
        .single()
      
      if (error) throw error
      return data
    }

    // 3. Advance to next stage
    const nextStage = protocol.titration_schedule[nextStageIndex]
    
    const updates = {
      current_stage_index: nextStageIndex,
      stage_started_at: new Date().toISOString(),
      dosage_per_intake: nextStage.dosage,
      titration_status: markAsCompleted ? 'alvo_atingido' : 'titulando'
    }

    const { data, error } = await supabase
      .from('protocols')
      .update(updates)
      .eq('id', id)
      .eq('user_id', await getUserId())
      .select(`
        *,
        medicine:medicines(*),
        treatment_plan:treatment_plans(*)
      `)
      .single()
    
    if (error) throw error
    return data
  }
}

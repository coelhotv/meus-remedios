import { supabase, getUserId } from '../../lib/supabase'

/**
 * Stock Service - Manage medicine stock
 */
export const stockService = {
  /**
   * Get stock for a specific medicine
   */
  async getByMedicine(medicineId) {
    const { data, error } = await supabase
      .from('stock')
      .select('*')
      .eq('medicine_id', medicineId)
      .eq('user_id', await getUserId())
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  /**
   * Get total quantity for a medicine
   */
  async getTotalQuantity(medicineId) {
    const { data, error } = await supabase
      .from('stock')
      .select('quantity')
      .eq('medicine_id', medicineId)
      .eq('user_id', await getUserId())
    
    if (error) throw error
    
    return data.reduce((total, item) => total + item.quantity, 0)
  },

  /**
   * Add stock
   */
  async add(stock) {
    // Validate required fields
    if (!stock.medicine_id) {
      throw new Error('ID do medicamento é obrigatório')
    }
    if (stock.quantity === undefined || stock.quantity === null || stock.quantity <= 0) {
      throw new Error('Quantidade deve ser maior que zero')
    }

    try {
      const { data, error } = await supabase
        .from('stock')
        .insert([{ ...stock, user_id: await getUserId() }])
        .select()
        .single()
      
      if (error) {
        // Parse Supabase error for better messaging
        const errorMsg = error.message || error.details || 'Erro desconhecido ao adicionar estoque'
        throw new Error(errorMsg)
      }
      return data
    } catch (err) {
      // Re-throw with context
      throw new Error(err.message || 'Falha ao conectar com o servidor')
    }
  },

  /**
   * Decrease stock (when medicine is taken)
   * This finds the oldest stock entry and decrements it
   */
  async decrease(medicineId, quantity) {
    // Get oldest stock entries first
    const { data: stockEntries, error: fetchError } = await supabase
      .from('stock')
      .select('*')
      .eq('medicine_id', medicineId)
      .eq('user_id', await getUserId())
      .gt('quantity', 0)
      .order('purchase_date', { ascending: true })
    
    if (fetchError) throw fetchError
    
    let remaining = quantity
    
    for (const entry of stockEntries) {
      if (remaining <= 0) break
      
      const toDecrease = Math.min(entry.quantity, remaining)
      const newQuantity = entry.quantity - toDecrease
      
      const { error: updateError } = await supabase
        .from('stock')
        .update({ quantity: newQuantity })
        .eq('id', entry.id)
      
      if (updateError) throw updateError
      
      remaining -= toDecrease
    }
    
    if (remaining > 0) {
      throw new Error('Estoque insuficiente')
    }
  },

  /**
   * Increase stock (when a log is deleted or quantity decreased)
   * It creates a special "adjustment" entry to maintain history integrity
   */
  async increase(medicineId, quantity, reason = 'Estorno de dose') {
    const { data, error } = await supabase
      .from('stock')
      .insert([{ 
        medicine_id: medicineId, 
        quantity: quantity,
        purchase_date: new Date().toISOString().split('T')[0],
        unit_price: 0,
        user_id: await getUserId(),
        notes: reason
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Delete a stock entry
   */
  async delete(id) {
    const { error } = await supabase
      .from('stock')
      .delete()
      .eq('id', id)
      .eq('user_id', await getUserId())
    
    if (error) throw error
  }
}

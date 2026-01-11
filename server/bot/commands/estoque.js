import { supabase, MOCK_USER_ID } from '../../services/supabase.js';
import { calculateDaysRemaining, formatStockStatus } from '../../utils/formatters.js';

export async function handleEstoque(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    // Get all medicines with their stock and active protocols
    const { data: medicines, error: medError } = await supabase
      .from('medicines')
      .select(`
        *,
        stock(*),
        protocols!protocols_medicine_id_fkey(*)
      `)
      .eq('user_id', MOCK_USER_ID)
      .order('name');

    if (medError) throw medError;

    if (!medicines || medicines.length === 0) {
      return await bot.sendMessage(chatId, 'Você não possui medicamentos cadastrados.');
    }

    let message = '📦 *Estoque de Medicamentos:*\n\n';
    let hasLowStock = false;

    for (const medicine of medicines) {
      const activeStock = (medicine.stock || []).filter(s => s.quantity > 0);
      const totalQuantity = activeStock.reduce((sum, s) => sum + s.quantity, 0);
      
      // Calculate daily usage from active protocols
      const activeProtocols = (medicine.protocols || []).filter(p => p.active);
      const dailyUsage = activeProtocols.reduce((sum, p) => {
        const timesPerDay = p.time_schedule?.length || 0;
        const dosagePerIntake = p.dosage_per_intake || 0;
        return sum + (timesPerDay * dosagePerIntake);
      }, 0);

      const daysRemaining = calculateDaysRemaining(totalQuantity, dailyUsage);
      
      message += formatStockStatus(medicine, totalQuantity, daysRemaining) + '\n';
      
      if (daysRemaining !== null && daysRemaining <= 7) {
        hasLowStock = true;
      }
    }

    if (hasLowStock) {
      message += '\n⚠️ *Atenção:* Alguns medicamentos estão com estoque baixo!';
    }

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Erro ao buscar estoque:', err);
    await bot.sendMessage(chatId, 'Erro ao buscar estoque.');
  }
}

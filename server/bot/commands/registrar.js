import { supabase, MOCK_USER_ID } from '../../services/supabase.js';
import { setSession } from '../state.js';

export async function handleRegistrar(bot, msg) {
  const chatId = msg.chat && msg.chat.id;
  const tgUserId = msg.from && msg.from.id;

  if (!chatId) return;

  try {
    // Try to fetch protocols linked to this Telegram user first
    let res = await supabase
      .from('protocols')
      .select('id, medicine:medicines(id, name, dosage_unit)')
      .eq('telegram_user_id', tgUserId)
      .eq('active', true);

    if (res.error) throw res.error;

    let protocols = res.data || [];

    // Fallback to MOCK_USER_ID (development) if none found
    if (!protocols || protocols.length === 0) {
      const fallback = await supabase
        .from('protocols')
        .select('id, medicine:medicines(id, name, dosage_unit)')
        .eq('user_id', MOCK_USER_ID)
        .eq('active', true);

      if (fallback.error) throw fallback.error;
      protocols = fallback.data || [];
    }

    if (!protocols || protocols.length === 0) {
      return bot.sendMessage(chatId, 'Você não possui protocolos ativos no momento. Use o app web para cadastrar.');
    }

    // Create keyboard with medicine names
    const keyboard = protocols.map(p => ([
      { 
        text: p.medicine.name, 
        callback_data: `reg_med:${p.medicine.id}:${p.id}` 
      }
    ]));

    setSession(chatId, { action: 'registrar_dose' });

    await bot.sendMessage(chatId, '💊 Registrar dose manual\nQual medicamento você tomou?', {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });

  } catch (err) {
    console.error('Erro ao iniciar registro:', err);
    bot.sendMessage(chatId, '❌ Ocorreu um erro ao buscar seus medicamentos.');
  }
}
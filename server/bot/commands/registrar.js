import { supabase, MOCK_USER_ID } from '../../services/supabase.js';
import { setSession } from '../state.js';

export async function handleRegistrar(bot, msg) {
  const chatId = msg.chat.id;

  try {
    // Fetch active protocols/medicines
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select('id, medicine:medicines(id, name, dosage_unit)')
      .eq('user_id', MOCK_USER_ID)
      .eq('active', true);

    if (error) throw error;

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

    await bot.sendMessage(chatId, '💊 *Registrar dose manual*\nQual medicamento você tomou?', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });

  } catch (err) {
    console.error('Erro ao iniciar registro:', err);
    bot.sendMessage(chatId, '❌ Ocorreu um erro ao buscar seus medicamentos.');
  }
}

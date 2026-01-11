import { supabase, MOCK_USER_ID } from '../../services/supabase.js';
import { formatProtocol } from '../../utils/formatters.js';

export async function handleStatus(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select('*, medicine:medicines(*)')
      .eq('user_id', MOCK_USER_ID)
      .eq('active', true);

    if (error) throw error;

    if (!protocols || protocols.length === 0) {
      return await bot.sendMessage(chatId, 'Você não possui protocolos ativos no momento.');
    }

    // Fallback: Vincular chat_id se ainda não estiver vinculado
    await supabase.from('user_settings').upsert({ 
      user_id: MOCK_USER_ID, 
      telegram_chat_id: chatId.toString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    let message = '📋 *Seus Protocolos Ativos:*\n\n';
    protocols.forEach(p => {
      message += formatProtocol(p) + '\n';
    });

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Erro ao buscar protocolos:', err);
    await bot.sendMessage(chatId, 'Erro ao buscar seus dados.');
  }
}

import { supabase, MOCK_USER_ID } from '../../services/supabase.js';

export async function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert({ 
        user_id: MOCK_USER_ID, 
        telegram_chat_id: chatId.toString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;

    await bot.sendMessage(chatId, 
      `Olá! 👋 Eu sou o assistente do *Meus Remédios*.\n\n` +
      `Acabei de vincular este chat ao seu perfil. Agora vou te avisar nos horários das suas medicações.\n\n` +
      `*Comandos disponíveis:*\n` +
      `/status - Ver protocolos ativos\n` +
      `/estoque - Verificar estoque\n` +
      `/hoje - Doses de hoje\n` +
      `/proxima - Próxima dose\n` +
      `/historico - Últimas doses registradas\n` +
      `/ajuda - Ver todos os comandos`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Erro ao salvar chat_id:', err);
    await bot.sendMessage(chatId, 'Ops, tive um erro ao configurar seu perfil. Tente novamente mais tarde.');
  }
}

import { supabase, MOCK_USER_ID } from '../../services/supabase.js';

export async function handleHistorico(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    const { data: logs, error } = await supabase
      .from('medicine_logs')
      .select(`
        *,
        medicine:medicines(name),
        protocol:protocols(*)
      `)
      .eq('user_id', MOCK_USER_ID)
      .order('taken_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!logs || logs.length === 0) {
      return await bot.sendMessage(chatId, 'Nenhuma dose registrada ainda.');
    }

    let message = '📜 *Histórico Recente:*\n\n';

    logs.forEach(log => {
      const date = new Date(log.taken_at);
      const dateStr = date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
      const timeStr = date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
      
      message += `📅 ${dateStr} às ${timeStr}\n`;
      message += `💊 ${log.medicine.name} - ${log.quantity_taken}x\n\n`;
    });

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    await bot.sendMessage(chatId, 'Erro ao buscar histórico.');
  }
}

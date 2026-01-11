import { supabase, MOCK_USER_ID } from '../../services/supabase.js';
import { getCurrentTime } from '../../utils/formatters.js';

export async function handleHoje(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select('*, medicine:medicines(*)')
      .eq('user_id', MOCK_USER_ID)
      .eq('active', true);

    if (error) throw error;

    if (!protocols || protocols.length === 0) {
      return await bot.sendMessage(chatId, 'Você não possui protocolos ativos.');
    }

    // Get today's logs to mark taken doses
    const today = new Date().toISOString().split('T')[0];
    const { data: logs } = await supabase
      .from('medicine_logs')
      .select('protocol_id, taken_at')
      .eq('user_id', MOCK_USER_ID)
      .gte('taken_at', `${today}T00:00:00`)
      .lte('taken_at', `${today}T23:59:59`);

    // Build schedule for today
    const schedule = [];
    protocols.forEach(protocol => {
      protocol.time_schedule.forEach(time => {
        // Check if this dose was taken
        const wasTaken = logs?.some(log => {
          const logProtocol = log.protocol_id === protocol.id;
          const logTime = new Date(log.taken_at).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          // Consider taken if within 30 min window
          return logProtocol && Math.abs(
            new Date(`2000-01-01T${time}`).getTime() - 
            new Date(`2000-01-01T${logTime}`).getTime()
          ) < 30 * 60 * 1000;
        });

        schedule.push({
          time,
          medicine: protocol.medicine.name,
          dosage: protocol.dosage_per_intake,
          taken: wasTaken
        });
      });
    });

    // Sort by time
    schedule.sort((a, b) => a.time.localeCompare(b.time));

    const currentTime = getCurrentTime();
    let message = `📅 *Doses de Hoje* (${new Date().toLocaleDateString('pt-BR')})\n\n`;

    schedule.forEach(item => {
      const status = item.taken ? '✅' : (item.time <= currentTime ? '⏰' : '⏱️');
      message += `${status} ${item.time} - ${item.medicine} (${item.dosage}x)\n`;
    });

    const taken = schedule.filter(s => s.taken).length;
    const total = schedule.length;
    message += `\n📊 Progresso: ${taken}/${total} doses`;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Erro ao buscar agenda:', err);
    await bot.sendMessage(chatId, 'Erro ao buscar agenda de hoje.');
  }
}

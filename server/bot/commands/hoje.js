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

    // Get today's date in SP timezone
    const today = new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'America/Sao_Paulo' 
    }).format(new Date());

    const { data: logs } = await supabase
      .from('medicine_logs')
      .select('protocol_id, taken_at')
      .eq('user_id', MOCK_USER_ID)
      .gte('taken_at', `${today}T00:00:00.000Z`)
      .lte('taken_at', `${today}T23:59:59.999Z`);

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
            hour12: false,
            timeZone: 'America/Sao_Paulo'
          });
          
          // Use a fixed date for comparison of times
          const scheduledTime = new Date(`2000-01-01T${time}:00`);
          const actualTime = new Date(`2000-01-01T${logTime}:00`);
          
          // Consider taken if within 60 min window (more generous)
          return logProtocol && Math.abs(scheduledTime.getTime() - actualTime.getTime()) < 60 * 60 * 1000;
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
    let message = `📅 *Doses de Hoje* (${new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date())})\n\n`;

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

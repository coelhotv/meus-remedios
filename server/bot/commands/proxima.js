import { supabase, MOCK_USER_ID } from '../../services/supabase.js';
import { getCurrentTime } from '../../utils/formatters.js';

export async function handleProxima(bot, msg) {
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

    const currentTime = getCurrentTime();
    
    // Collect all upcoming doses
    const upcomingDoses = [];
    protocols.forEach(protocol => {
      protocol.time_schedule.forEach(time => {
        if (time >= currentTime) {
          upcomingDoses.push({
            time,
            medicine: protocol.medicine.name,
            dosage: protocol.dosage_per_intake,
            notes: protocol.notes
          });
        }
      });
    });

    // Sort by time
    upcomingDoses.sort((a, b) => a.time.localeCompare(b.time));

    if (upcomingDoses.length === 0) {
      return await bot.sendMessage(chatId, 'Não há mais doses programadas para hoje. ✅');
    }

    const next = upcomingDoses[0];
    let message = `⏰ *Próxima Dose:*\n\n`;
    message += `🕐 Horário: *${next.time}*\n`;
    message += `💊 Medicamento: *${next.medicine}*\n`;
    message += `📏 Quantidade: ${next.dosage}x\n`;
    
    if (next.notes) {
      message += `📝 _${next.notes}_\n`;
    }

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Erro ao buscar próxima dose:', err);
    await bot.sendMessage(chatId, 'Erro ao buscar próxima dose.');
  }
}

import cron from 'node-cron';
import { supabase, MOCK_USER_ID } from '../services/supabase.js';
import { getCurrentTime } from '../utils/formatters.js';

export async function checkReminders(bot) {
  const currentHHMM = getCurrentTime();
  console.log(`[${currentHHMM}] Verificando agendamentos...`);

  try {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('telegram_chat_id')
      .eq('user_id', MOCK_USER_ID)
      .single();

    if (!settings?.telegram_chat_id) {
      console.log(`[${currentHHMM}] Agendamento ignorado: telegram_chat_id não configurado.`);
      return;
    }

    const { data: protocols } = await supabase
      .from('protocols')
      .select('*, medicine:medicines(*)')
      .eq('user_id', MOCK_USER_ID)
      .eq('active', true);

    for (const p of protocols) {
      // --- 1. Main Notifications ---
      if (p.time_schedule.includes(currentHHMM)) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        if (p.last_notified_at && p.last_notified_at > fiveMinutesAgo) {
          console.log(`[${currentHHMM}] Notificação já enviada para ${p.medicine.name}`);
          continue;
        }

        await sendDoseNotification(bot, settings.telegram_chat_id, p);
        
        await supabase
          .from('protocols')
          .update({ last_notified_at: new Date().toISOString() })
          .eq('id', p.id);
      }

      // --- 2. Soft Reminders (30 min later) ---
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const thirtyFiveMinsAgo = new Date(Date.now() - 35 * 60 * 1000).toISOString();

      // Check if protocol was notified ~30 mins ago and not yet soft-reminded for this slot
      if (p.last_notified_at && p.last_notified_at <= thirtyMinsAgo && p.last_notified_at > thirtyFiveMinsAgo) {
        
        // Check if already soft-reminded for this slot
        if (p.last_soft_reminder_at && p.last_soft_reminder_at > thirtyFiveMinsAgo) {
          continue;
        }

        // Check if dose was already taken since the notification
        const { data: logs } = await supabase
          .from('medicine_logs')
          .select('id')
          .eq('protocol_id', p.id)
          .gte('taken_at', p.last_notified_at);

        if (!logs || logs.length === 0) {
          console.log(`[${currentHHMM}] Enviando lembrete suave para ${p.medicine.name}`);
          
          await bot.sendMessage(settings.telegram_chat_id, 
            `⏳ *Lembrete:* Esqueceu de registrar sua dose de *${p.medicine.name}* (${p.dosage_per_intake}x)?\n\n` +
            `Caso já tenha tomado, registre agora:`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [[
                  { text: 'Tomei ✅', callback_data: `take_:${p.id}:${p.dosage_per_intake}` },
                  { text: 'Pular ❌', callback_data: `skip_:${p.id}` }
                ]]
              }
            }
          );

          await supabase
            .from('protocols')
            .update({ last_soft_reminder_at: new Date().toISOString() })
            .eq('id', p.id);
        }
      }
    }
  } catch (err) {
    console.error('Erro no scheduler:', err);
  }
}

export function startScheduler(bot) {
  // Main notification scheduler - runs every minute
  cron.schedule('* * * * *', () => checkReminders(bot));
  console.log('✅ Scheduler de notificações iniciado');
}

/**
 * Phase 1: Daily Digest
 * Summary at 10:00 PM
 */
export async function runDailyDigest(bot) {
  console.log('[Daily Digest] Gerando resumo do dia...');
    
  try {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('telegram_chat_id')
      .eq('user_id', MOCK_USER_ID)
      .single();

    if (!settings?.telegram_chat_id) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Get today's logs
    const { data: logs } = await supabase
      .from('medicine_logs')
      .select('*, medicine:medicines(name)')
      .eq('user_id', MOCK_USER_ID)
      .gte('taken_at', today);

    // Get active protocols
    const { data: protocols } = await supabase
      .from('protocols')
      .select('*, medicine:medicines(name)')
      .eq('user_id', MOCK_USER_ID)
      .eq('active', true);

    let message = '📅 *Resumo do Dia*\n\n';
    
    if (logs && logs.length > 0) {
      message += '✅ *Tomados hoje:*\n';
      logs.forEach(l => {
        const time = new Date(l.taken_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
        message += `- ${l.medicine.name} (${time})\n`;
      });
    } else {
      message += '❌ Nenhuma dose registrada hoje.\n';
    }

    // Check for missed scheduled doses
    const expectedCount = protocols.reduce((sum, p) => sum + (p.time_schedule?.length || 0), 0);
    const takenCount = logs?.length || 0;
    
    if (takenCount < expectedCount) {
      message += `\n⚠️ *Atenção:* Você registrou ${takenCount} de ${expectedCount} doses esperadas.\n`;
    } else if (expectedCount > 0) {
      message += '\n🎯 *Parabéns!* Todas as doses do dia foram registradas!\n';
    }

    // Tomorrow's preview
    message += '\n⏰ *Amanhã:*\n';
    protocols.forEach(p => {
      message += `- ${p.medicine.name}: ${p.time_schedule.join(', ')}\n`;
    });

    await bot.sendMessage(settings.telegram_chat_id, message, { parse_mode: 'Markdown' });
    
  } catch (err) {
    console.error('[Daily Digest] Erro:', err);
  }
}

export function startDailyDigest(bot) {
  cron.schedule('0 22 * * *', () => runDailyDigest(bot));
  console.log('✅ Daily Digest configurado (diariamente às 22h)');
}

async function sendDoseNotification(bot, chatId, p) {
  let message = `🔔 *HORA DO REMÉDIO*\n\n` +
                `💊 *${p.medicine.name}*\n` +
                `📏 Dose: ${p.dosage_per_intake}x\n`;

  // Add titration info if applicable
  if (p.titration_schedule && p.titration_schedule.length > 0) {
    const currentStage = p.current_stage_index || 0;
    message += `🎯 Etapa ${currentStage + 1}/${p.titration_schedule.length}\n`;
  }

  if (p.notes) {
    message += `📝 _${p.notes}_`;
  }

  const keyboard = {
    inline_keyboard: [
      [
        { text: 'Tomei ✅', callback_data: `take_:${p.id}:${p.dosage_per_intake}` },
        { text: 'Pular ❌', callback_data: `skip_:${p.id}` }
      ]
    ]
  };

  await bot.sendMessage(chatId, message, { 
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
}

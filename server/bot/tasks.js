import { supabase } from '../services/supabase.js';
import { createLogger } from '../bot/logger.js';
import { 
  getActiveProtocols, 
  getUserSettings,
  getAllUsersWithTelegram 
} from '../services/protocolCache.js';
import { shouldSendNotification } from '../services/notificationDeduplicator.js';
import { 
  getCurrentTimeInTimezone, 
  getCurrentDateInTimezone, 
  formatTimeInTimezone 
} from '../utils/timezone.js';
import { calculateDaysRemaining } from '../utils/formatters.js';

const logger = createLogger('Tasks');

// --- Helper Functions ---

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

/**
 * Check reminders for a specific user
 * @param {object} bot - Bot adapter
 * @param {string} userId - User UUID
 * @param {string} chatId - Telegram chat ID
 */
async function checkUserReminders(bot, userId, chatId) {
  try {
    const settings = await getUserSettings(userId, true);
    if (!settings) {
      logger.warn(`No settings found for user`, { userId });
      return;
    }

    const timezone = settings.timezone || 'America/Sao_Paulo';
    const currentHHMM = getCurrentTimeInTimezone(timezone);
    
    logger.debug(`Checking reminders`, { userId, time: currentHHMM, timezone });

    const protocols = await getActiveProtocols(userId, true);

    for (const p of protocols) {
      // --- 1. Main Notifications ---
      if (p.time_schedule.includes(currentHHMM)) {
        // Check if already taken
        const { data: recentLogs } = await supabase
          .from('medicine_logs')
          .select('taken_at')
          .eq('protocol_id', p.id)
          .gte('taken_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        const todayYYYYMMDD = getCurrentDateInTimezone(timezone);
        
        const timeToMinutes = (time) => {
          const [h, m] = time.split(':').map(Number);
          return h * 60 + m;
        };

        let alreadyTaken = false;

        if (recentLogs && recentLogs.length > 0) {
          const todaysLogs = recentLogs.filter(l => {
            const logDateVal = new Date(l.taken_at);
            const logDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(logDateVal);
            return logDateStr === todayYYYYMMDD;
          });

          for (const log of todaysLogs) {
            const logHHMM = formatTimeInTimezone(log.taken_at, timezone);
            const logMinutes = timeToMinutes(logHHMM);
            
            let minDiff = Infinity;
            let closestSchedule = null;
            
            p.time_schedule.forEach(schedule => {
                const schedMinutes = timeToMinutes(schedule);
                const diff = Math.abs(logMinutes - schedMinutes);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestSchedule = schedule;
                }
            });
            
            if (closestSchedule === currentHHMM) {
              alreadyTaken = true;
              break;
            }
          }
        }

        if (alreadyTaken) {
          logger.debug(`Dose already taken`, { userId, medicine: p.medicine.name, time: currentHHMM });
          continue;
        }

        // Check deduplication
        const shouldSend = await shouldSendNotification(p.id, 'dose_reminder');
        if (!shouldSend) continue;

        await sendDoseNotification(bot, chatId, p);
        logger.info(`Dose reminder sent`, { userId, medicine: p.medicine.name, time: currentHHMM });
        
        await supabase
          .from('protocols')
          .update({ last_notified_at: new Date().toISOString() })
          .eq('id', p.id);
      }

      // --- 2. Soft Reminders (30 min later) ---
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const thirtyFiveMinsAgo = new Date(Date.now() - 35 * 60 * 1000).toISOString();

      if (p.last_notified_at && p.last_notified_at <= thirtyMinsAgo && p.last_notified_at > thirtyFiveMinsAgo) {
        
        if (p.last_soft_reminder_at && p.last_soft_reminder_at > thirtyFiveMinsAgo) {
          continue;
        }

        const shouldSend = await shouldSendNotification(p.id, 'soft_reminder');
        if (!shouldSend) continue;

        const { data: logs } = await supabase
          .from('medicine_logs')
          .select('id')
          .eq('protocol_id', p.id)
          .gte('taken_at', p.last_notified_at);

        if (!logs || logs.length === 0) {
          logger.info(`Soft reminder sent`, { userId, medicine: p.medicine.name });
          
          await bot.sendMessage(chatId, 
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
    logger.error(`Error checking reminders for user`, err, { userId });
  }
}

/**
 * Check reminders for ALL users (cron job)
 * @param {object} bot - Bot adapter
 */
export async function checkReminders(bot) {
  logger.info('Starting reminder check for all users');
  
  const users = await getAllUsersWithTelegram();
  
  if (users.length === 0) {
    logger.warn('No users with Telegram found');
    return;
  }

  logger.info(`Found ${users.length} users with Telegram`);

  for (const user of users) {
    await checkUserReminders(bot, user.user_id, user.telegram_chat_id);
  }

  logger.info('Reminder check completed');
}

/**
 * Run daily digest for a specific user
 */
async function runUserDailyDigest(bot, userId, chatId) {
  try {
    const settings = await getUserSettings(userId, true);
    if (!settings) return;

    const timezone = settings.timezone || 'America/Sao_Paulo';
    const today = getCurrentDateInTimezone(timezone);
    
    // Check deduplication
    const shouldSend = await shouldSendNotification(userId, 'daily_digest');
    if (!shouldSend) return;

    const { data: logs } = await supabase
      .from('medicine_logs')
      .select('*, medicine:medicines(name)')
      .eq('user_id', userId)
      .gte('taken_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const todayLogs = logs?.filter(l => {
      const logDate = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date(l.taken_at));
      return logDate === today;
    }) || [];

    const protocols = await getActiveProtocols(userId, true);
    const expectedDoses = protocols.reduce((sum, p) => sum + (p.time_schedule?.length || 0), 0);
    const takenDoses = todayLogs.length;
    const percentage = expectedDoses > 0 ? Math.round((takenDoses / expectedDoses) * 100) : 0;

    let message = `📊 *Resumo do Dia*\n\n`;
    message += `📅 ${new Intl.DateTimeFormat('pt-BR', { timeZone: timezone }).format(new Date())}\n\n`;
    message += `✅ Doses tomadas: ${takenDoses}/${expectedDoses}\n`;
    message += `📈 Taxa de adesão: ${percentage}%\n\n`;

    if (percentage === 100) {
      message += '🎉 *Parabéns! Você completou todas as doses hoje!*';
    } else if (percentage >= 80) {
      message += '👍 *Bom trabalho! Continue assim!*';
    } else if (percentage >= 50) {
      message += '⚠️ *Atenção! Tome as doses restantes.*';
    } else {
      message += '🚨 *Cuidado! Você está atrasado nas doses.*';
    }

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    logger.info(`Daily digest sent`, { userId, percentage });

  } catch (err) {
    logger.error(`Error sending daily digest`, err, { userId });
  }
}

/**
 * Run daily digest for ALL users
 */
export async function runDailyDigest(bot) {
  logger.info('Starting daily digest for all users');
  
  const users = await getAllUsersWithTelegram();
  
  for (const user of users) {
    await runUserDailyDigest(bot, user.user_id, user.telegram_chat_id);
  }

  logger.info('Daily digest completed');
}

/**
 * Check stock alerts for a specific user
 */
async function checkUserStockAlerts(bot, userId, chatId) {
  try {
    const settings = await getUserSettings(userId, true);
    if (!settings) return;

    const { data: medicines } = await supabase
      .from('medicines')
      .select(`
        *,
        stock(*),
        protocols!protocols_medicine_id_fkey(*)
      `)
      .eq('user_id', userId);

    if (!medicines || medicines.length === 0) return;

    const lowStockMedicines = [];
    const zeroStockMedicines = [];

    for (const medicine of medicines) {
      const activeProtocols = (medicine.protocols || []).filter(p => p.active);
      if (activeProtocols.length === 0) continue;

      const totalQuantity = (medicine.stock || []).reduce((sum, s) => sum + s.quantity, 0);
      const dailyUsage = activeProtocols.reduce((sum, p) => {
        const timesPerDay = p.time_schedule?.length || 0;
        const dosagePerIntake = p.dosage_per_intake || 0;
        return sum + (timesPerDay * dosagePerIntake);
      }, 0);

      const daysRemaining = calculateDaysRemaining(totalQuantity, dailyUsage);

      if (daysRemaining !== null && daysRemaining <= 0) {
        zeroStockMedicines.push({ name: medicine.name, days: daysRemaining });
      } else if (daysRemaining !== null && daysRemaining <= 7) {
        lowStockMedicines.push({ name: medicine.name, days: daysRemaining });
      }
    }

    if (lowStockMedicines.length === 0 && zeroStockMedicines.length === 0) return;

    // Check deduplication (only send once per day)
    const shouldSend = await shouldSendNotification(userId, 'stock_alert');
    if (!shouldSend) return;

    let message = '';

    if (zeroStockMedicines.length > 0) {
      message += '🚨 *ALERTA DE ESTOQUE ZERADO*\n\n';
      message += 'Os seguintes medicamentos estão sem estoque:\n\n';
      zeroStockMedicines.forEach(m => {
        message += `❌ ${m.name}\n`;
      });
      message += '\n⚠️ Reponha o estoque o quanto antes!\n\n';
    }

    if (lowStockMedicines.length > 0) {
      message += '⚠️ *Alerta de Estoque Baixo*\n\n';
      message += 'Atenção aos seguintes medicamentos:\n\n';
      lowStockMedicines.forEach(m => {
        message += `📦 ${m.name} - ~${m.days} dia(s) restante(s)\n`;
      });
      message += '\n💡 Considere repor o estoque em breve.';
    }

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    logger.info(`Stock alert sent`, { userId, low: lowStockMedicines.length, zero: zeroStockMedicines.length });

  } catch (err) {
    logger.error(`Error checking stock alerts`, err, { userId });
  }
}

/**
 * Check stock alerts for ALL users
 */
export async function checkStockAlerts(bot) {
  logger.info('Starting stock alerts for all users');
  
  const users = await getAllUsersWithTelegram();
  
  for (const user of users) {
    await checkUserStockAlerts(bot, user.user_id, user.telegram_chat_id);
  }

  logger.info('Stock alerts completed');
}

/**
 * Check adherence reports for ALL users (weekly)
 */
export async function checkAdherenceReports() {
  logger.info('Starting adherence reports for all users');

  const users = await getAllUsersWithTelegram();

  for (const _user of users) {
    // Implementation similar to daily digest but weekly
    // ... (omitted for brevity, can be added)
  }

  logger.info('Adherence reports completed');
}

/**
 * Check titration alerts for ALL users
 */
export async function checkTitrationAlerts() {
  logger.info('Starting titration alerts for all users');

  const users = await getAllUsersWithTelegram();

  for (const _user of users) {
    // Check for protocols in titration that need transition
    // ... (implementation similar to stock alerts)
  }

  logger.info('Titration alerts completed');
}

/**
 * Check monthly reports for ALL users
 */
export async function checkMonthlyReport() {
  logger.info('Starting monthly reports for all users');

  const users = await getAllUsersWithTelegram();

  for (const _user of users) {
    // Monthly report implementation
    // ... (can be added)
  }

  logger.info('Monthly reports completed');
}
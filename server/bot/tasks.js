import { supabase, MOCK_USER_ID } from '../services/supabase.js';
import { getCurrentTimeInTimezone, getCurrentTimeComponents, getCurrentDateInTimezone } from '../utils/timezone.js';
import { calculateDaysRemaining } from '../utils/formatters.js';
import { shouldSendNotification } from '../services/notificationDeduplicator.js';
import { getActiveProtocols, getUserSettings, invalidateCache } from '../services/protocolCache.js';

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

// --- Scheduler Tasks ---

export async function checkReminders(bot) {
  try {
    // Get user settings (cached)
    const settings = await getUserSettings(true);
    if (!settings?.telegram_chat_id) {
      console.log('[Reminders] No chat ID configured');
      return;
    }

    const timezone = settings.timezone || 'America/Sao_Paulo';
    const currentHHMM = getCurrentTimeInTimezone(timezone);
    console.log(`[Reminders] Checking at ${currentHHMM} (${timezone})`);

    // Get active protocols (cached)
    const protocols = await getActiveProtocols(true);

    for (const p of protocols) {
      // --- 1. Main Notifications ---
      if (p.time_schedule.includes(currentHHMM)) {
        // Check deduplication
        const shouldSend = await shouldSendNotification(p.id, 'dose_reminder');
        if (!shouldSend) continue;

        await sendDoseNotification(bot, settings.telegram_chat_id, p);
        
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

        // Check deduplication
        const shouldSend = await shouldSendNotification(p.id, 'soft_reminder');
        if (!shouldSend) continue;

        const { data: logs } = await supabase
          .from('medicine_logs')
          .select('id')
          .eq('protocol_id', p.id)
          .gte('taken_at', p.last_notified_at);

        if (!logs || logs.length === 0) {
          console.log(`[Reminders] Soft reminder for ${p.medicine.name}`);
          
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
    console.error('[Reminders] Error:', err);
  }
}

export async function runDailyDigest(bot) {
  console.log('[Daily Digest] Generating...');
    
  try {
    const settings = await getUserSettings(true);
    if (!settings?.telegram_chat_id) return;

    const timezone = settings.timezone || 'America/Sao_Paulo';
    const today = getCurrentDateInTimezone(timezone);
    
    // Check deduplication
    const shouldSend = await shouldSendNotification(settings.user_id, 'daily_digest');
    if (!shouldSend) return;

    const { data: logs } = await supabase
      .from('medicine_logs')
      .select('*, medicine:medicines(name)')
      .eq('user_id', MOCK_USER_ID)
      .gte('taken_at', `${today}T00:00:00.000Z`);

    const protocols = await getActiveProtocols(true);

    let message = '📅 *Resumo do Dia*\n\n';
    
    if (logs && logs.length > 0) {
      message += '✅ *Tomados hoje:*\n';
      logs.forEach(l => {
        const time = new Date(l.taken_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: timezone });
        message += `- ${l.medicine.name} (${time})\n`;
      });
    } else {
      message += '❌ Nenhuma dose registrada hoje.\n';
    }

    const expectedCount = protocols.reduce((sum, p) => sum + (p.time_schedule?.length || 0), 0);
    const takenCount = logs?.length || 0;
    
    if (takenCount < expectedCount) {
      message += `\n⚠️ *Atenção:* Você registrou ${takenCount} de ${expectedCount} doses esperadas.\n`;
    } else if (expectedCount > 0) {
      message += '\n🎯 *Parabéns!* Todas as doses do dia foram registradas!\n';
    }

    message += '\n⏰ *Amanhã:*\n';
    protocols.forEach(p => {
      message += `- ${p.medicine.name}: ${p.time_schedule.join(', ')}\n`;
    });

    await bot.sendMessage(settings.telegram_chat_id, message, { parse_mode: 'Markdown' });
    
  } catch (err) {
    console.error('[Daily Digest] Error:', err);
  }
}

// --- Alerts Tasks ---

export async function checkStockAlerts(bot) {
  console.log('[Stock Alert] Checking...');
    
  try {
    const settings = await getUserSettings(true);
    if (!settings?.telegram_chat_id) return;

    // Batch fetch medicines with relationships
    const { data: medicines, error } = await supabase
      .from('medicines')
      .select(`
        *,
        stock(*),
        protocols!protocols_medicine_id_fkey(*)
      `)
      .eq('user_id', MOCK_USER_ID);

    if (error) throw error;

    const lowStockMedicines = [];
    const outOfStockMedicines = [];

    for (const medicine of medicines) {
      // Check deduplication
      const shouldSend = await shouldSendNotification(medicine.id, 'stock_alert');
      if (!shouldSend) continue;

      const activeStock = (medicine.stock || []).filter(s => s.quantity > 0);
      const totalQuantity = activeStock.reduce((sum, s) => sum + s.quantity, 0);
      
      const activeProtocols = (medicine.protocols || []).filter(p => p.active);
      if (activeProtocols.length === 0) continue;

      const dailyUsage = activeProtocols.reduce((sum, p) => {
        const timesPerDay = p.time_schedule?.length || 0;
        const dosagePerIntake = p.dosage_per_intake || 0;
        return sum + (timesPerDay * dosagePerIntake);
      }, 0);

      const daysRemaining = calculateDaysRemaining(totalQuantity, dailyUsage);

      if (daysRemaining === null) continue;

      if (daysRemaining <= 0) {
        outOfStockMedicines.push(medicine.name);
      } else if (daysRemaining <= 7) {
        lowStockMedicines.push({ name: medicine.name, days: daysRemaining });
      }
    }

    // Send batch messages
    if (outOfStockMedicines.length > 0) {
      let message = '🚨 *ALERTA DE ESTOQUE ZERADO*\n\n';
      message += outOfStockMedicines.map(name => `❌ ${name}`).join('\n');
      message += '\n\n⚠️ Reponha o estoque o quanto antes!';

      await bot.sendMessage(settings.telegram_chat_id, message, { parse_mode: 'Markdown' });
    }

    if (lowStockMedicines.length > 0) {
      let message = '⚠️ *Alerta de Estoque Baixo*\n\n';
      message += lowStockMedicines.map(({ name, days }) => `📦 ${name} - ~${days} dia(s)`).join('\n');
      message += '\n\n💡 Considere repor o estoque em breve.';

      await bot.sendMessage(settings.telegram_chat_id, message, { parse_mode: 'Markdown' });
    }

    console.log(`[Stock Alert] Complete. Low: ${lowStockMedicines.length}, Out: ${outOfStockMedicines.length}`);
  } catch (err) {
    console.error('[Stock Alert] Error:', err);
  }
}

export async function checkAdherenceReports(bot) {
  console.log('[Adherence Report] Generating...');
    
  try {
    const settings = await getUserSettings(true);
    if (!settings?.telegram_chat_id) return;

    const timezone = settings.timezone || 'America/Sao_Paulo';

    // Check deduplication
    const shouldSend = await shouldSendNotification(settings.user_id, 'adherence_report');
    if (!shouldSend) return;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Batch fetch
    const [{ data: protocols }, { data: logs }] = await Promise.all([
      supabase
        .from('protocols')
        .select('*, medicine:medicines(name)')
        .eq('user_id', MOCK_USER_ID)
        .eq('active', true),
      supabase
        .from('medicine_logs')
        .select('*')
        .eq('user_id', MOCK_USER_ID)
        .gte('taken_at', sevenDaysAgo.toISOString())
    ]);

    const expectedDoses = protocols.reduce((sum, p) => sum + (p.time_schedule?.length || 0) * 7, 0);
    const takenDoses = logs?.length || 0;
    const adherenceRate = expectedDoses > 0 ? Math.round((takenDoses / expectedDoses) * 100) : 0;

    let message = '📊 *Relatório Semanal de Adesão*\n\n';
    message += `📅 ${sevenDaysAgo.toLocaleDateString('pt-BR')} - ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    message += `✅ Doses: ${takenDoses}/${expectedDoses}\n`;
    message += `📈 Adesão: *${adherenceRate}%*\n\n`;

    if (adherenceRate >= 90) {
      message += '🎉 *Excelente!* Continue assim!';
    } else if (adherenceRate >= 70) {
      message += '👍 *Bom trabalho!* Tente melhorar ainda mais.';
    } else if (adherenceRate >= 50) {
      message += '⚠️ *Atenção!* Adesão abaixo do ideal.';
    } else {
      message += '🚨 *Cuidado!* Adesão muito baixa.';
    }

    // Per-medicine breakdown
    const medicineStats = {};
    protocols.forEach(p => {
      const medicineName = p.medicine.name;
      const expectedForMedicine = (p.time_schedule?.length || 0) * 7;
      const takenForMedicine = logs?.filter(l => l.medicine_id === p.medicine_id).length || 0;
      medicineStats[medicineName] = {
        expected: expectedForMedicine,
        taken: takenForMedicine,
        rate: expectedForMedicine > 0 ? Math.round((takenForMedicine / expectedForMedicine) * 100) : 0
      };
    });

    message += '\n\n*Por medicamento:*\n';
    Object.entries(medicineStats).forEach(([name, stats]) => {
      const emoji = stats.rate >= 90 ? '✅' : stats.rate >= 70 ? '⚠️' : '❌';
      message += `${emoji} ${name}: ${stats.rate}%\n`;
    });

    await bot.sendMessage(settings.telegram_chat_id, message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[Adherence Report] Error:', err);
  }
}

export async function checkTitrationAlerts(bot) {
  console.log('[Titration Alert] Checking...');
    
  try {
    const settings = await getUserSettings(true);
    if (!settings?.telegram_chat_id) return;

    const { data: protocols, error } = await supabase
      .from('protocols')
      .select('*, medicine:medicines(name)')
      .eq('user_id', MOCK_USER_ID)
      .eq('active', true)
      .eq('titration_status', 'titulando')
      .not('titration_schedule', 'is', null);

    if (error) throw error;

    for (const protocol of protocols || []) {
      if (!protocol.titration_schedule?.length || !protocol.stage_started_at) continue;

      // Check deduplication
      const shouldSend = await shouldSendNotification(protocol.id, 'titration_alert');
      if (!shouldSend) continue;

      const currentStageIndex = protocol.current_stage_index || 0;
      const currentStage = protocol.titration_schedule[currentStageIndex];
      
      if (!currentStage) continue;

      const stageStartDate = new Date(protocol.stage_started_at);
      const daysInStage = Math.floor((new Date() - stageStartDate) / (1000 * 60 * 60 * 24));

      if (daysInStage >= currentStage.duration_days) {
        const isLastStage = currentStageIndex >= protocol.titration_schedule.length - 1;

        if (isLastStage) {
          let message = `🎯 *Titulação Concluída!*\n\n`;
          message += `💊 ${protocol.medicine.name}\n`;
          message += `Dose: ${protocol.dosage_per_intake}x\n\n`;
          message += `✅ Continue conforme orientação médica.`;

          await bot.sendMessage(settings.telegram_chat_id, message, { parse_mode: 'Markdown' });

          await supabase
            .from('protocols')
            .update({ titration_status: 'alvo_atingido' })
            .eq('id', protocol.id);
        } else {
          const nextStage = protocol.titration_schedule[currentStageIndex + 1];
          
          let message = `🔔 *Hora de Avançar!*\n\n`;
          message += `💊 ${protocol.medicine.name}\n`;
          message += `Etapa ${currentStageIndex + 1}/${protocol.titration_schedule.length} completa\n\n`;
          message += `➡️ *Próxima:* ${nextStage.dosage}x por ${nextStage.duration_days} dias\n\n`;
          message += `⚠️ Confirme com seu médico!`;

          await bot.sendMessage(settings.telegram_chat_id, message, { parse_mode: 'Markdown' });
        }
      }
    }

    console.log('[Titration Alert] Check complete');
  } catch (err) {
    console.error('[Titration Alert] Error:', err);
  }
}

export async function checkMonthlyReport(bot) {
  console.log('[Monthly Report] Analyzing...');
    
  try {
    const settings = await getUserSettings(true);
    if (!settings?.telegram_chat_id) return;

    // Check deduplication
    const shouldSend = await shouldSendNotification(settings.user_id, 'monthly_report');
    if (!shouldSend) return;

    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstDayTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    // Helper to batch calculate adherence
    const getAdherence = async (start, end) => {
      const [{ data: logs }, { data: protocols }] = await Promise.all([
        supabase
          .from('medicine_logs')
          .select('id')
          .eq('user_id', MOCK_USER_ID)
          .gte('taken_at', start.toISOString())
          .lt('taken_at', end.toISOString()),
        supabase
          .from('protocols')
          .select('time_schedule')
          .eq('user_id', MOCK_USER_ID)
          .eq('active', true)
      ]);

      const daysInPeriod = Math.round((end - start) / (1000 * 60 * 60 * 24));
      const expected = protocols.reduce((sum, p) => sum + (p.time_schedule?.length || 0) * daysInPeriod, 0);
      const taken = logs?.length || 0;
      
      return expected > 0 ? Math.round((taken / expected) * 100) : 0;
    };

    const [lastMonthRate, prevMonthRate] = await Promise.all([
      getAdherence(firstDayLastMonth, firstDayThisMonth),
      getAdherence(firstDayTwoMonthsAgo, firstDayLastMonth)
    ]);

    const diff = lastMonthRate - prevMonthRate;
    const monthName = firstDayLastMonth.toLocaleString('pt-BR', { month: 'long' });

    let message = `📅 *Relatório: ${monthName}*\n\n`;
    message += `📈 Adesão: *${lastMonthRate}%*\n`;
    
    if (diff > 0) {
      message += `🚀 *+${diff}%* vs mês anterior! Parabéns!`;
    } else if (diff < 0) {
      message += `⚠️ *${diff}%* vs mês anterior. Vamos melhorar?`;
    } else {
      message += `📊 Manteve a mesma taxa.`;
    }

    await bot.sendMessage(settings.telegram_chat_id, message, { parse_mode: 'Markdown' });

  } catch (err) {
    console.error('[Monthly Report] Error:', err);
  }
}

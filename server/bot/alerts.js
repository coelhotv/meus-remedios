import cron from 'node-cron';
import { supabase, MOCK_USER_ID } from '../services/supabase.js';
import { calculateDaysRemaining } from '../utils/formatters.js';

/**
 * Phase 4.1: Stock Forecasting Alerts
 * Runs daily at 9:00 AM to check stock levels
 */
export async function checkStockAlerts(bot) {
  console.log('[Stock Alert] Verificando níveis de estoque...');
    
  try {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('telegram_chat_id')
      .eq('user_id', MOCK_USER_ID)
      .single();

    if (!settings?.telegram_chat_id) return;

    // Get all medicines with stock and protocols
    const { data: medicines } = await supabase
      .from('medicines')
      .select(`
        *,
        stock(*),
        protocols!protocols_medicine_id_fkey(*)
      `)
      .eq('user_id', MOCK_USER_ID);

    const lowStockMedicines = [];
    const outOfStockMedicines = [];

    for (const medicine of medicines) {
      const activeStock = (medicine.stock || []).filter(s => s.quantity > 0);
      const totalQuantity = activeStock.reduce((sum, s) => sum + s.quantity, 0);
      
      const activeProtocols = (medicine.protocols || []).filter(p => p.active);
      if (activeProtocols.length === 0) continue; // Skip medicines without active protocols

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

    // Send alerts
    if (outOfStockMedicines.length > 0) {
      let message = '🚨 *ALERTA DE ESTOQUE ZERADO*\n\n';
      message += 'Os seguintes medicamentos estão sem estoque:\n\n';
      outOfStockMedicines.forEach(name => {
        message += `❌ ${name}\n`;
      });
      message += '\n⚠️ Reponha o estoque o quanto antes!';

      await bot.sendMessage(settings.telegram_chat_id, message, { parse_mode: 'Markdown' });
    }

    if (lowStockMedicines.length > 0) {
      let message = '⚠️ *Alerta de Estoque Baixo*\n\n';
      message += 'Atenção aos seguintes medicamentos:\n\n';
      lowStockMedicines.forEach(({ name, days }) => {
        message += `📦 ${name} - ~${days} dia(s) restante(s)\n`;
      });
      message += '\n💡 Considere repor o estoque em breve.';

      await bot.sendMessage(settings.telegram_chat_id, message, { parse_mode: 'Markdown' });
    }

    console.log(`[Stock Alert] Verificação concluída. Baixo: ${lowStockMedicines.length}, Zerado: ${outOfStockMedicines.length}`);
  } catch (err) {
    console.error('[Stock Alert] Erro:', err);
  }
}

export function startStockAlerts(bot) {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', () => checkStockAlerts(bot));
  console.log('✅ Alertas de estoque configurados (diariamente às 9h)');
}

/**
 * Phase 4.2: Adherence Reports
 * Weekly summary every Sunday at 8:00 PM
 */
export async function checkAdherenceReports(bot) {
  console.log('[Adherence Report] Gerando relatório semanal...');
    
  try {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('telegram_chat_id')
      .eq('user_id', MOCK_USER_ID)
      .single();

    if (!settings?.telegram_chat_id) return;

    // Get last 7 days of data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all scheduled doses for the week
    const { data: protocols } = await supabase
      .from('protocols')
      .select('*, medicine:medicines(name)')
      .eq('user_id', MOCK_USER_ID)
      .eq('active', true);

    // Get all logs for the week
    const { data: logs } = await supabase
      .from('medicine_logs')
      .select('*')
      .eq('user_id', MOCK_USER_ID)
      .gte('taken_at', sevenDaysAgo.toISOString());

    // Calculate expected doses (7 days * sum of all time_schedule lengths)
    const expectedDoses = protocols.reduce((sum, p) => {
      return sum + (p.time_schedule?.length || 0) * 7;
    }, 0);

    const takenDoses = logs?.length || 0;
    const adherenceRate = expectedDoses > 0 ? Math.round((takenDoses / expectedDoses) * 100) : 0;

    let message = '📊 *Relatório Semanal de Adesão*\n\n';
    message += `📅 Período: ${sevenDaysAgo.toLocaleDateString('pt-BR')} - ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    message += `✅ Doses tomadas: ${takenDoses}/${expectedDoses}\n`;
    message += `📈 Taxa de adesão: *${adherenceRate}%*\n\n`;

    if (adherenceRate >= 90) {
      message += '🎉 *Excelente!* Continue assim!';
    } else if (adherenceRate >= 70) {
      message += '👍 *Bom trabalho!* Tente melhorar ainda mais.';
    } else if (adherenceRate >= 50) {
      message += '⚠️ *Atenção!* Sua adesão está abaixo do ideal.';
    } else {
      message += '🚨 *Cuidado!* Sua adesão está muito baixa. Converse com seu médico.';
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
      message += `${emoji} ${name}: ${stats.rate}% (${stats.taken}/${stats.expected})\n`;
    });

    await bot.sendMessage(settings.telegram_chat_id, message, { parse_mode: 'Markdown' });
    console.log('[Adherence Report] Relatório enviado');
  } catch (err) {
    console.error('[Adherence Report] Erro:', err);
  }
}

export function startAdherenceReports(bot) {
  // Run every Sunday at 8:00 PM
  cron.schedule('0 20 * * 0', () => checkAdherenceReports(bot));
  console.log('✅ Relatórios de adesão configurados (domingos às 20h)');
}

/**
 * Phase 4.3: Titration Alerts
 * Checks daily at 8:00 AM for titration stage transitions
 */
export async function checkTitrationAlerts(bot) {
  console.log('[Titration Alert] Verificando transições de titulação...');
    
  try {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('telegram_chat_id')
      .eq('user_id', MOCK_USER_ID)
      .single();

    if (!settings?.telegram_chat_id) return;

    // Get protocols with active titration
    const { data: protocols } = await supabase
      .from('protocols')
      .select('*, medicine:medicines(name)')
      .eq('user_id', MOCK_USER_ID)
      .eq('active', true)
      .eq('titration_status', 'titulando')
      .not('titration_schedule', 'is', null);

    for (const protocol of protocols || []) {
      if (!protocol.titration_schedule || protocol.titration_schedule.length === 0) continue;

      const currentStageIndex = protocol.current_stage_index || 0;
      const currentStage = protocol.titration_schedule[currentStageIndex];
      
      if (!currentStage || !protocol.stage_started_at) continue;

      // Calculate days in current stage
      const stageStartDate = new Date(protocol.stage_started_at);
      const now = new Date();
      const daysInStage = Math.floor((now - stageStartDate) / (1000 * 60 * 60 * 24));

      // Check if it's time to advance
      if (daysInStage >= currentStage.duration_days) {
        const isLastStage = currentStageIndex >= protocol.titration_schedule.length - 1;

        if (isLastStage) {
          // Final stage reached
          let message = `🎯 *Titulação Concluída!*\n\n`;
          message += `💊 ${protocol.medicine.name}\n\n`;
          message += `Você completou todas as etapas da titulação!\n`;
          message += `Dose atual: ${protocol.dosage_per_intake}x\n\n`;
          message += `✅ Continue com esta dose conforme orientação médica.`;

          await bot.sendMessage(settings.telegram_chat_id, message, { parse_mode: 'Markdown' });

          // Update status to target reached
          await supabase
            .from('protocols')
            .update({ titration_status: 'alvo_atingido' })
            .eq('id', protocol.id);
        } else {
          // Time to advance to next stage
          const nextStage = protocol.titration_schedule[currentStageIndex + 1];
          
          let message = `🔔 *Hora de Avançar a Titulação!*\n\n`;
          message += `💊 ${protocol.medicine.name}\n\n`;
          message += `Você completou a etapa ${currentStageIndex + 1}/${protocol.titration_schedule.length}\n`;
          message += `Dose atual: ${currentStage.dosage}x\n\n`;
          message += `➡️ *Próxima etapa:*\n`;
          message += `Nova dose: ${nextStage.dosage}x\n`;
          message += `Duração: ${nextStage.duration_days} dias\n\n`;
          message += `⚠️ Confirme com seu médico antes de avançar!\n\n`;
          message += `Use o app web para confirmar a transição.`;

          await bot.sendMessage(settings.telegram_chat_id, message, { parse_mode: 'Markdown' });
        }
      }
    }

    console.log('[Titration Alert] Verificação concluída');
  } catch (err) {
    console.error('[Titration Alert] Erro:', err);
  }
}

export function startTitrationAlerts(bot) {
  // Run daily at 8:00 AM
  cron.schedule('0 8 * * *', () => checkTitrationAlerts(bot));
  console.log('✅ Alertas de titulação configurados (diariamente às 8h)');
}

/**
 * Phase 4.2: Monthly Trend Report
 * Runs on the 1st day of each month at 10:00 AM
 */
export async function checkMonthlyReport(bot) {
  console.log('[Monthly Report] Analisando tendências mensais...');
    
  try {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('telegram_chat_id')
      .eq('user_id', MOCK_USER_ID)
      .single();

    if (!settings?.telegram_chat_id) return;

    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstDayTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    // Helper to calculate adherence for a period
    const getAdherence = async (start, end) => {
      const { data: logs } = await supabase
        .from('medicine_logs')
        .select('id')
        .eq('user_id', MOCK_USER_ID)
        .gte('taken_at', start.toISOString())
        .lt('taken_at', end.toISOString());

      const { data: protocols } = await supabase
        .from('protocols')
        .select('time_schedule')
        .eq('user_id', MOCK_USER_ID)
        .eq('active', true);

      const daysInPeriod = Math.round((end - start) / (1000 * 60 * 60 * 24));
      const expected = protocols.reduce((sum, p) => sum + (p.time_schedule?.length || 0) * daysInPeriod, 0);
      const taken = logs?.length || 0;
      
      return expected > 0 ? Math.round((taken / expected) * 100) : 0;
    };

    const lastMonthRate = await getAdherence(firstDayLastMonth, firstDayThisMonth);
    const prevMonthRate = await getAdherence(firstDayTwoMonthsAgo, firstDayLastMonth);

    const diff = lastMonthRate - prevMonthRate;
    const monthName = firstDayLastMonth.toLocaleString('pt-BR', { month: 'long' });

    let message = `📅 *Relatório Mensal: ${monthName}*\n\n`;
    message += `📈 Taxa de adesão: *${lastMonthRate}%*\n`;
    
    if (diff > 0) {
      message += `🚀 Melhora de *+${diff}%* em relação ao mês anterior! Parabéns!`;
    } else if (diff < 0) {
      message += `⚠️ Queda de *${diff}%* em relação ao mês anterior. Vamos tentar melhorar?`;
    } else {
      message += `📊 Você manteve a mesma taxa de adesão do mês anterior.`;
    }

    await bot.sendMessage(settings.telegram_chat_id, message, { parse_mode: 'Markdown' });

  } catch (err) {
    console.error('[Monthly Report] Erro:', err);
  }
}

export function startMonthlyReport(bot) {
  cron.schedule('0 10 1 * *', () => checkMonthlyReport(bot));
  console.log('✅ Relatórios mensais configurados (dia 1 às 10h)');
}

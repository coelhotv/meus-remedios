import { getCurrentTimeInTimezone } from './timezone.js';

/**
 * Format time in HH:MM format for Brazil timezone (legacy)
 * @deprecated Use getCurrentTimeInTimezone from timezone.js instead
 */
export function getCurrentTime() {
  return getCurrentTimeInTimezone('America/Sao_Paulo');
}

/**
 * Calculate days remaining based on stock and daily usage
 */
export function calculateDaysRemaining(totalQuantity, dailyUsage) {
  if (!dailyUsage || dailyUsage <= 0) return null;
  return Math.floor(totalQuantity / dailyUsage);
}

/**
 * Format stock status message
 */
export function formatStockStatus(medicine, totalQuantity, daysRemaining) {
  const unit = medicine.dosage_unit || 'unidades';
  let status = `💊 *${medicine.name}*\n`;
  status += `📦 Estoque: ${totalQuantity} ${unit}\n`;
  
  if (daysRemaining !== null) {
    if (daysRemaining <= 0) {
      status += `⚠️ *SEM ESTOQUE*\n`;
    } else if (daysRemaining <= 7) {
      status += `⚠️ Acaba em ~${daysRemaining} dias\n`;
    } else {
      status += `✅ Acaba em ~${daysRemaining} dias\n`;
    }
  }
  
  return status;
}

/**
 * Format protocol info
 */
export function formatProtocol(protocol) {
  let msg = `💊 *${protocol.medicine.name}*\n`;
  msg += `⏰ Horários: ${protocol.time_schedule.join(', ')}\n`;
  msg += `📏 Dose: ${protocol.dosage_per_intake}x\n`;
  
  if (protocol.titration_schedule && protocol.titration_schedule.length > 0) {
    const currentStage = protocol.current_stage_index || 0;
    msg += `🎯 Titulação: Etapa ${currentStage + 1}/${protocol.titration_schedule.length}\n`;
  }
  
  if (protocol.notes) {
    msg += `📝 _${protocol.notes}_\n`;
  }
  
  return msg;
}

/**
 * Calculate adherence streak (days in a row with at least one dose)
 */
export function calculateStreak(logs) {
  if (!logs || logs.length === 0) return 0;
  
  // Sort logs by date descending
  const dates = logs.map(l => new Date(l.taken_at).toLocaleDateString('en-US'))
                    .filter((v, i, a) => a.indexOf(v) === i) // Unique dates
                    .sort((a, b) => new Date(b) - new Date(a));
                    
  let streak = 0;
  let current = new Date();
  
  // Normalize current to midnight for comparison
  current.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < dates.length; i++) {
    const logDate = new Date(dates[i]);
    logDate.setHours(0, 0, 0, 0);
    
    // Check if logDate is current or current - 1 day
    const diff = (current - logDate) / (1000 * 60 * 60 * 24);
    
    if (diff === 0 || diff === 1) {
      streak++;
      current = logDate;
    } else if (diff > 1) {
      break;
    }
  }
  
  return streak;
}

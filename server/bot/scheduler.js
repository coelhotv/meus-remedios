import cron from 'node-cron';
import { checkReminders, runDailyDigest } from './tasks.js';

export function startScheduler(bot) {
  // Main notification scheduler - runs every minute
  cron.schedule('* * * * *', () => checkReminders(bot));
  console.log('✅ Notificador de lembretes iniciado');
}

export function startDailyDigest(bot) {
  cron.schedule('0 23 * * *', () => runDailyDigest(bot));
  console.log('✅ Resumo diário configurado (diariamente às 23h)');
}

// Re-export for compatibility if needed elsewhere
export { checkReminders, runDailyDigest };

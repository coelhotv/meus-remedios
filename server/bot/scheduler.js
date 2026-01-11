import cron from 'node-cron';
import { checkReminders, runDailyDigest } from './tasks.js';

export function startScheduler(bot) {
  // Main notification scheduler - runs every minute
  cron.schedule('* * * * *', () => checkReminders(bot));
  console.log('✅ Scheduler de notificações iniciado');
}

export function startDailyDigest(bot) {
  cron.schedule('0 22 * * *', () => runDailyDigest(bot));
  console.log('✅ Daily Digest configurado (diariamente às 22h)');
}

// Re-export for compatibility if needed elsewhere
export { checkReminders, runDailyDigest };

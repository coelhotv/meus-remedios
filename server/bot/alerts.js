import cron from 'node-cron';
import { 
  checkStockAlerts, 
  checkAdherenceReports, 
  checkTitrationAlerts, 
  checkMonthlyReport 
} from './tasks.js';

export function startStockAlerts(bot) {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', () => checkStockAlerts(bot));
  console.log('✅ Alertas de estoque configurados (diariamente às 9h)');
}

export function startAdherenceReports(bot) {
  // Run every Sunday at 8:00 PM
  cron.schedule('0 20 * * 0', () => checkAdherenceReports(bot));
  console.log('✅ Relatórios de adesão configurados (domingos às 20h)');
}

export function startTitrationAlerts(bot) {
  // Run daily at 8:00 AM
  cron.schedule('0 8 * * *', () => checkTitrationAlerts(bot));
  console.log('✅ Alertas de titulação configurados (diariamente às 8h)');
}

export function startMonthlyReport(bot) {
  cron.schedule('0 10 1 * *', () => checkMonthlyReport(bot));
  console.log('✅ Relatórios mensais configurados (dia 1 às 10h)');
}

// Re-export for compatibility
export { 
  checkStockAlerts, 
  checkAdherenceReports, 
  checkTitrationAlerts, 
  checkMonthlyReport 
};

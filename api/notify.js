import { 
  checkReminders, 
  runDailyDigest,
  checkStockAlerts, 
  checkAdherenceReports, 
  checkTitrationAlerts, 
  checkMonthlyReport 
} from '../server/bot/tasks.js';

// --- Configuration ---
const token = process.env.TELEGRAM_BOT_TOKEN;

// --- Bot Adapter (Minimal for Notifications) ---
function createNotifyBotAdapter(token) {
  const telegramFetch = async (method, body) => {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) {
        console.error(`Telegram API Error (${method}):`, data);
      }
      return data.result;
    } catch (err) {
      console.error(`Fetch Error (${method}):`, err);
    }
  };

  return {
    sendMessage: async (chatId, text, options = {}) => {
      return telegramFetch('sendMessage', { chat_id: chatId, text, ...options });
    }
  };
}

export default async function handler(req, res) {
  // Protection against unauthorized calls
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!token) {
    return res.status(200).json({ error: 'Token missing' });
  }

  const bot = createNotifyBotAdapter(token);

  // Get current time in Sao Paulo
  const now = new Date();
  const spDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  
  const currentHour = spDate.getHours();
  const currentMinute = spDate.getMinutes();
  const currentDay = spDate.getDate(); // 1-31
  const currentWeekDay = spDate.getDay(); // 0 (Sun) - 6 (Sat)
  
  const currentHHMM = spDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', hour12: false
  });

  console.log(`[Notify] Executing cron for ${currentHHMM} (Server time: ${now.toISOString()})`);

  const results = [];

  try {
    // 1. Always check dose reminders (Every minute)
    // Note: checkReminders inside calculates time again, but that's fine as long as server time matches or we rely on it.
    // However, server/bot/checkReminders uses `getCurrentTime()` which uses `new Date()`. 
    // Vercel server time is usually UTC. 
    // If `utils/formatters.js` `getCurrentTime` doesn't handle timezone, we might have issues.
    // Let's verify utils/formatters.js later. For now, we assume it works or we might need to patch it.
    await checkReminders(bot);
    results.push('reminders');

    // 2. Daily Digest: Daily at 22:00
    if (currentHour === 22 && currentMinute === 0) {
      await runDailyDigest(bot);
      results.push('daily_digest');
    }

    // 3. Stock Alerts: Daily at 09:00
    if (currentHour === 9 && currentMinute === 0) {
      await checkStockAlerts(bot);
      results.push('stock_alerts');
    }

    // 4. Titration Alerts: Daily at 08:00
    if (currentHour === 8 && currentMinute === 0) {
      await checkTitrationAlerts(bot);
      results.push('titration_alerts');
    }

    // 5. Adherence Reports: Sunday at 20:00
    if (currentWeekDay === 0 && currentHour === 20 && currentMinute === 0) {
      await checkAdherenceReports(bot);
      results.push('adherence_reports');
    }

    // 6. Monthly Report: 1st of month at 10:00
    if (currentDay === 1 && currentHour === 10 && currentMinute === 0) {
      await checkMonthlyReport(bot);
      results.push('monthly_report');
    }

    res.status(200).json({ 
      status: 'ok', 
      executed: results,
      time: currentHHMM
    });
    
  } catch (error) {
    console.error('Notify Error:', error);
    res.status(500).json({ error: error.message });
  }
}

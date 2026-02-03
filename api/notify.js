// Add logging at module level to catch import errors
console.log('[CronNotify] Starting module imports...');

try {
  var { createLogger } = await import('../server/bot/logger.js');
  console.log('[CronNotify] Logger imported successfully');
} catch (error) {
  console.error('[CronNotify] Failed to import logger:', error);
  throw error;
}

try {
  var tasksModule = await import('../server/bot/tasks.js');
  console.log('[CronNotify] Tasks module imported successfully');
} catch (error) {
  console.error('[CronNotify] Failed to import tasks:', error);
  throw error;
}

const { 
  checkReminders, 
  runDailyDigest,
  checkStockAlerts, 
  checkAdherenceReports, 
  checkTitrationAlerts, 
  checkMonthlyReport 
} = tasksModule;

const logger = createLogger('CronNotify');

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
        logger.error(`Telegram API Error (${method})`, null, { error: data });
      }
      return data.result;
    } catch (err) {
      logger.error(`Fetch Error (${method})`, err);
    }
  };

  return {
    sendMessage: async (chatId, text, options = {}) => {
      return telegramFetch('sendMessage', { chat_id: chatId, text, ...options });
    }
  };
}

export default async function handler(req, res) {
  // Add detailed logging for debugging
  console.log('[CronNotify] Request received', { 
    method: req.method, 
    url: req.url,
    hasAuthHeader: !!req.headers['authorization'],
    envVars: {
      hasTelegramToken: !!process.env.TELEGRAM_BOT_TOKEN,
      hasCronSecret: !!process.env.CRON_SECRET,
      hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.VITE_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });

  logger.info('Cron job triggered', { method: req.method, url: req.url });

  // Accept both GET (from cron-job.org) and POST (for compatibility)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  // Protection against unauthorized calls
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn('Unauthorized cron attempt', { authHeader });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.error('TELEGRAM_BOT_TOKEN not configured');
    return res.status(500).json({ error: 'Token missing' });
  }

  const bot = createNotifyBotAdapter(token);

  // Get current time in Sao Paulo
  const now = new Date();
  const spDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  
  const currentHour = spDate.getHours();
  const currentMinute = spDate.getMinutes();
  const currentDay = spDate.getDate();
  const currentWeekDay = spDate.getDay();
  
  const currentHHMM = spDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', hour12: false
  });

  logger.info(`Executing cron jobs`, { 
    time: currentHHMM, 
    hour: currentHour, 
    minute: currentMinute,
    day: currentDay,
    weekday: currentWeekDay 
  });

  const results = [];

  try {
    // Log before importing tasks to catch import errors
    console.log('[CronNotify] About to call checkReminders');
    
    // 1. Always check dose reminders (Every minute)
    await checkReminders(bot);
    results.push('reminders');
    console.log('[CronNotify] checkReminders completed successfully');

    // 2. Daily Digest: Daily at 23:00
    if (currentHour === 23 && currentMinute === 0) {
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

    // 5. Adherence Reports: Sunday at 23:00
    if (currentWeekDay === 0 && currentHour === 23 && currentMinute === 0) {
      await checkAdherenceReports(bot);
      results.push('adherence_reports');
    }

    // 6. Monthly Report: 1st of month at 10:00
    if (currentDay === 1 && currentHour === 10 && currentMinute === 0) {
      await checkMonthlyReport(bot);
      results.push('monthly_report');
    }

    logger.info('Cron jobs completed', { executed: results });

    res.status(200).json({ 
      status: 'ok', 
      executed: results,
      time: currentHHMM 
    });
    
  } catch (error) {
    console.error('[CronNotify] Cron job failed with error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    logger.error('Cron job failed', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
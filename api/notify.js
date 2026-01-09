import { createClient } from '@supabase/supabase-js';

const token = process.env.TELEGRAM_BOT_TOKEN;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function telegramFetch(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export default async function handler(req, res) {
  const now = new Date();
  // Ajuste para Horário de Brasília (UTC-3)
  const brTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
  const currentHHMM = brTime.getUTCHours().toString().padStart(2, '0') + ':' + 
                      brTime.getUTCMinutes().toString().padStart(2, '0');

  // Protection against unauthorized calls
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!token) {
    return res.status(200).json({ error: 'Token missing' });
  }

  try {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('telegram_chat_id')
      .eq('user_id', MOCK_USER_ID)
      .single();

    if (!settings?.telegram_chat_id) {
      console.log(`[${currentHHMM}] Notificação ignorada: telegram_chat_id não configurado.`);
      return res.status(200).json({ status: 'no_chat_id' });
    }

    const { data: protocols } = await supabase
      .from('protocols')
      .select('*, medicine:medicines(*)')
      .eq('user_id', MOCK_USER_ID)
      .eq('active', true);

    const notificationsSent = [];

    for (const p of protocols) {
      if (p.time_schedule.includes(currentHHMM)) {
        const message = `🔔 *HORA DO REMÉDIO*\n\n` +
                        `💊 *${p.medicine.name}*\n` +
                        `📏 Dose: ${p.dosage_per_intake}x\n` +
                        `${p.notes ? `📝 _${p.notes}_` : ''}`;

        const keyboard = {
          inline_keyboard: [
            [
              { text: 'Tomei ✅', callback_data: `take_:${p.id}:${p.medicine_id}:${p.dosage_per_intake}` },
              { text: 'Pular ❌', callback_data: `skip_:${p.id}` }
            ]
          ]
        };

        await telegramFetch('sendMessage', {
          chat_id: settings.telegram_chat_id,
          text: message,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
        notificationsSent.push(p.medicine.name);
      }
    }

    res.status(200).json({ 
      status: 'ok', 
      time: currentHHMM, 
      sent: notificationsSent 
    });
  } catch (error) {
    console.error('Cron Error:', error);
    res.status(200).json({ error: error.message });
  }
}

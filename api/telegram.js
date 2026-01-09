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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const update = req.body;
  if (!token) {
    console.error('Missing TELEGRAM_BOT_TOKEN');
    return res.status(200).json({ error: 'Bot token not configured' });
  }

  try {
    // 1. Comando /start
    if (update.message?.text === '/start') {
      const chatId = update.message.chat.id;
      await supabase.from('user_settings').upsert({
        user_id: MOCK_USER_ID,
        telegram_chat_id: chatId.toString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      await telegramFetch('sendMessage', {
        chat_id: chatId,
        text: `Olá! 👋 Vínculo com Meus Remédios realizado com sucesso.\n\n` +
               `Vou te avisar por aqui quando chegar a hora das suas medicações.\n` +
               `Use /status para ver sua rotina.`,
      });
    }

    // 2. Comando /status
    if (update.message?.text === '/status') {
      const chatId = update.message.chat.id;
      const { data: protocols } = await supabase
        .from('protocols')
        .select('*, medicine:medicines(*)')
        .eq('user_id', MOCK_USER_ID)
        .eq('active', true);

      if (!protocols || protocols.length === 0) {
        await telegramFetch('sendMessage', {
          chat_id: chatId,
          text: 'Você não possui protocolos ativos.',
        });
      } else {
        // Fallback: Vincular chat_id se ainda não estiver vinculado
        await supabase.from('user_settings').upsert({
          user_id: MOCK_USER_ID,
          telegram_chat_id: chatId.toString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        let text = '📋 *Sua Rotina Ativa:*\n\n';
        protocols.forEach(p => {
          text += `💊 *${p.medicine.name}*\n⏰ ${p.time_schedule.join(', ')}\n📏 ${p.dosage_per_intake}x\n\n`;
        });
        await telegramFetch('sendMessage', {
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown',
        });
      }
    }

    // 3. Callback (Botões Tomei ✅)
    if (update.callback_query) {
      const { data, message, id } = update.callback_query;
      const chatId = message.chat.id;

      if (data.startsWith('take_')) {
        const [_, protocolId, medicineId, quantity] = data.split(':');
        
        // Registrar Log
        await supabase.from('medicine_logs').insert([{
          user_id: MOCK_USER_ID,
          protocol_id: protocolId,
          medicine_id: medicineId,
          quantity_taken: parseFloat(quantity),
          taken_at: new Date().toISOString()
        }]);

        // Decrementar Estoque
        const { data: stockEntries } = await supabase
          .from('stock')
          .select('*')
          .eq('medicine_id', medicineId)
          .eq('user_id', MOCK_USER_ID)
          .gt('quantity', 0)
          .order('purchase_date', { ascending: true });
        
        if (stockEntries?.length > 0) {
          let remaining = parseFloat(quantity);
          for (const entry of stockEntries) {
            if (remaining <= 0) break;
            const toDecrease = Math.min(entry.quantity, remaining);
            await supabase.from('stock').update({ quantity: entry.quantity - toDecrease }).eq('id', entry.id);
            remaining -= toDecrease;
          }
        }

        await telegramFetch('answerCallbackQuery', { callback_query_id: id, text: 'Dose registrada!' });
        await telegramFetch('editMessageText', {
          chat_id: chatId,
          message_id: message.message_id,
          text: `✅ Dose de *${message.text.split('\n')[2]?.replace('💊 ', '') || 'Medicamento'}* registrada!`,
          parse_mode: 'Markdown'
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(200).json({ error: 'Internal Error', details: error.message });
  }
}

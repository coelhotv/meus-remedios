import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';

const token = process.env.TELEGRAM_BOT_TOKEN;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

const bot = new TelegramBot(token);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const update = req.body;

  try {
    // 1. Comando /start
    if (update.message?.text === '/start') {
      const chatId = update.message.chat.id;
      await supabase.from('user_settings').upsert({
        user_id: MOCK_USER_ID,
        telegram_chat_id: chatId.toString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      await bot.sendMessage(chatId, 
        `Olá! 👋 Vínculo com Meus Remédios realizado com sucesso.\n\n` +
        `Vou te avisar por aqui quando chegar a hora das suas medicações.\n` +
        `Use /status para ver sua rotina.`
      );
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
        await bot.sendMessage(chatId, 'Você não possui protocolos ativos.');
      } else {
        let text = '📋 *Sua Rotina Ativa:*\n\n';
        protocols.forEach(p => {
          text += `💊 *${p.medicine.name}*\n⏰ ${p.time_schedule.join(', ')}\n📏 ${p.dosage_per_intake}x\n\n`;
        });
        await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
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

        await bot.answerCallbackQuery(id, { text: 'Dose registrada!' });
        await bot.editMessageText(`✅ Dose de *${message.text.split('\n')[2]?.replace('💊 ', '') || 'Medicamento'}* registrada!`, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';

// 1. Configurações
const token = process.env.TELEGRAM_BOT_TOKEN;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

if (!token) {
  console.error('ERRO: TELEGRAM_BOT_TOKEN não definido no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const bot = new TelegramBot(token, { polling: true });

console.log('🚀 Bot de Remédios iniciado com sucesso!');

// 2. Comandos do Bot
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert({ 
        user_id: MOCK_USER_ID, 
        telegram_chat_id: chatId.toString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;

    bot.sendMessage(chatId, 
      `Olá! 👋 Eu sou o assistente do Meus Remédios.\n\n` +
      `Acabei de vincular este chat ao seu perfil. Agora vou te avisar nos horários das suas medicações.\n\n` +
      `Use /status para ver seus próximos remédios.`
    );
  } catch (err) {
    console.error('Erro ao salvar chat_id:', err);
    bot.sendMessage(chatId, 'Ops, tive um erro ao configurar seu perfil. Tente novamente mais tarde.');
  }
});

bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select('*, medicines(*)')
      .eq('user_id', MOCK_USER_ID)
      .eq('active', true);

    if (error) throw error;

    if (!protocols || protocols.length === 0) {
      return bot.sendMessage(chatId, 'Você não possui protocolos ativos no momento.');
    }

    let message = '📋 *Seus Protocolos Ativos:*\n\n';
    protocols.forEach(p => {
      message += `💊 *${p.medicines.name}*\n`;
      message += `⏰ Horários: ${p.time_schedule.join(', ')}\n`;
      message += `📏 Dose: ${p.dosage_per_intake}x\n\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Erro ao buscar protocolos:', err);
    bot.sendMessage(chatId, 'Erro ao buscar seus dados.');
  }
});

// 3. Callback para botões interativos (Tomei ✅)
bot.on('callback_query', async (callbackQuery) => {
  const { data, message, id } = callbackQuery;
  const chatId = message.chat.id;

  if (data.startsWith('take_')) {
    const [_, protocolId, medicineId, quantity] = data.split(':');
    
    try {
      // 1. Criar Log
      const { error: logError } = await supabase
        .from('medicine_logs')
        .insert([{
          user_id: MOCK_USER_ID,
          protocol_id: protocolId,
          medicine_id: medicineId,
          quantity_taken: parseFloat(quantity),
          taken_at: new Date().toISOString()
        }]);

      if (logError) throw logError;

      // 2. Decrementar Estoque
      // Busca entradas de estoque com quantidade > 0, ordenadas pela data mais antiga
      const { data: stockEntries, error: fetchError } = await supabase
        .from('stock')
        .select('*')
        .eq('medicine_id', medicineId)
        .eq('user_id', MOCK_USER_ID)
        .gt('quantity', 0)
        .order('purchase_date', { ascending: true });
      
      if (!fetchError && stockEntries.length > 0) {
        let remaining = parseFloat(quantity);
        for (const entry of stockEntries) {
          if (remaining <= 0) break;
          const toDecrease = Math.min(entry.quantity, remaining);
          await supabase
            .from('stock')
            .update({ quantity: entry.quantity - toDecrease })
            .eq('id', entry.id);
          remaining -= toDecrease;
        }
      }

      // Update the message
      bot.editMessageText(`✅ Dose de *${message.text.split('\n')[2]?.replace('💊 ', '') || 'Medicamento'}* registrada!`, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown'
      });
      
      bot.answerCallbackQuery(id, { text: 'Dose registrada!' });
    } catch (err) {
      console.error('Erro ao registrar dose:', err);
      bot.answerCallbackQuery(id, { text: 'Erro ao registrar dose.', show_alert: true });
    }
  }
});

// 4. Scheduler (Verifica a cada minuto)
cron.schedule('* * * * *', async () => {
  const now = new Date();
  
  // Ajuste para fuso horário de Brasília (UTC-3)
  const brTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
  const currentHHMM = brTime.getUTCHours().toString().padStart(2, '0') + ':' + 
                      brTime.getUTCMinutes().toString().padStart(2, '0');
  
  console.log(`[${currentHHMM}] Verificando agendamentos...`);

  try {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('telegram_chat_id')
      .eq('user_id', MOCK_USER_ID)
      .single();

    if (!settings?.telegram_chat_id) return;

    const { data: protocols } = await supabase
      .from('protocols')
      .select('*, medicine:medicines(*)')
      .eq('user_id', MOCK_USER_ID)
      .eq('active', true);

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

        bot.sendMessage(settings.telegram_chat_id, message, { 
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }
    }
  } catch (err) {
    console.error('Erro no scheduler:', err);
  }
});

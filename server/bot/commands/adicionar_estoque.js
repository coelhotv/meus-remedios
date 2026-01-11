import { supabase, MOCK_USER_ID } from '../../services/supabase.js';
import { setSession } from '../state.js';

export async function handleAdicionarEstoque(bot, msg) {
  const chatId = msg.chat.id;

  try {
    // Fetch active medicines
    const { data: medicines, error } = await supabase
      .from('medicines')
      .select('id, name, dosage_unit')
      .eq('user_id', MOCK_USER_ID)
      .order('name');

    if (error) throw error;

    if (!medicines || medicines.length === 0) {
      return bot.sendMessage(chatId, 'Você não possui medicamentos cadastrados. Use o app web para cadastrar.');
    }

    // Create keyboard
    const keyboard = medicines.map(m => ([
      { 
        text: m.name, 
        callback_data: `add_stock_med:${m.id}` 
      }
    ]));

    setSession(chatId, { action: 'adicionar_estoque' });

    await bot.sendMessage(chatId, '📦 *Adicionar ao Estoque*\nSelecione o medicamento:', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });

  } catch (err) {
    console.error('Erro ao iniciar adição de estoque:', err);
    bot.sendMessage(chatId, '❌ Ocorreu um erro ao buscar seus medicamentos.');
  }
}

export async function handleReporShortcut(bot, msg, match) {
  const chatId = msg.chat.id;
  const medicineName = match[1]?.trim();
  const quantity = parseFloat(match[2]?.replace(',', '.'));

  if (!medicineName || isNaN(quantity)) {
    return bot.sendMessage(chatId, '⚠️ Uso correto: `/repor NomeDoRemedio Quantidade`\nEx: `/repor Entresto 20`', { parse_mode: 'Markdown' });
  }

  try {
    // Search for medicine by name (case-insensitive)
    const { data: medicines, error } = await supabase
      .from('medicines')
      .select('id, name')
      .eq('user_id', MOCK_USER_ID)
      .ilike('name', `%${medicineName}%`);

    if (error) throw error;

    if (!medicines || medicines.length === 0) {
      return bot.sendMessage(chatId, `❌ Medicamento "${medicineName}" não encontrado.`);
    }

    if (medicines.length > 1) {
      // Multiple matches, ask to select
      const keyboard = medicines.map(m => ([
        { text: m.name, callback_data: `add_stock_med_val:${m.id}:${quantity}` }
      ]));
      return bot.sendMessage(chatId, 'Foram encontrados vários medicamentos. Selecione um:', {
        reply_markup: { inline_keyboard: keyboard }
      });
    }

    // Single match, add immediately
    await processAddStock(bot, chatId, medicines[0].id, quantity, medicines[0].name);

  } catch (err) {
    console.error('Erro no atalho de repor:', err);
    bot.sendMessage(chatId, '❌ Ocorreu um erro ao processar sua solicitação.');
  }
}

export async function processAddStock(bot, chatId, medicineId, quantity, medicineName) {
  try {
    const { error } = await supabase
      .from('stock')
      .insert([{
        user_id: MOCK_USER_ID,
        medicine_id: medicineId,
        quantity: quantity,
        purchase_date: new Date().toISOString().split('T')[0]
      }]);

    if (error) throw error;

    await bot.sendMessage(chatId, `✅ Adicionado *${quantity}x* ao estoque de *${medicineName}*!`, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Erro ao adicionar estoque:', err);
    bot.sendMessage(chatId, '❌ Erro ao atualizar estoque.');
  }
}

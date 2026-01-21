import { handleStart } from '../server/bot/commands/start.js';
import { handleStatus } from '../server/bot/commands/status.js';
import { handleEstoque } from '../server/bot/commands/estoque.js';
import { handleHoje } from '../server/bot/commands/hoje.js';
import { handleProxima } from '../server/bot/commands/proxima.js';
import { handleHistorico } from '../server/bot/commands/historico.js';
import { handleAjuda } from '../server/bot/commands/ajuda.js';
import { handleRegistrar } from '../server/bot/commands/registrar.js';
import { handleAdicionarEstoque, handleReporShortcut } from '../server/bot/commands/adicionar_estoque.js';
import { handlePausar, handleRetomar } from '../server/bot/commands/protocols.js';
import { handleCallbacks } from '../server/bot/callbacks/doseActions.js';
import { handleConversationalCallbacks } from '../server/bot/callbacks/conversational.js';

// --- Configuration ---
const token = process.env.TELEGRAM_BOT_TOKEN;
// Note: Supabase client in this file was unused in previous logic except for /start linking
// The imported commands use their own Supabase client from ../server/services/supabase.js
// which uses dotenv. We rely on process.env being available in Vercel.

// --- Bot Adapter ---
// Creates a mock Bot object that mimics node-telegram-bot-api but uses simple fetch for Vercel
function createBotAdapter(token) {
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

  const listeners = {
    callback_query: [],
    message: [] // conversational callbacks listen to message
  };

  return {
    // Methods used by commands
    sendMessage: async (chatId, text, options = {}) => {
      return telegramFetch('sendMessage', { chat_id: chatId, text, ...options });
    },
    editMessageText: async (text, options = {}) => {
      // Handle overload: (text, options) vs (msgId, text, options) - library has quirks, 
      // but our code seems to usage object options with chat_id and message_id inside.
      // Let's check usages. 
      // Usage 1: bot.editMessageText(newText, { chat_id, message_id, ... })
      return telegramFetch('editMessageText', { text, ...options });
    },
    answerCallbackQuery: async (callbackQueryId, options = {}) => {
      return telegramFetch('answerCallbackQuery', { callback_query_id: callbackQueryId, ...options });
    },
    deleteMessage: async (chatId, messageId) => {
      return telegramFetch('deleteMessage', { chat_id: chatId, message_id: messageId });
    },
    getMe: async () => {
      return telegramFetch('getMe', {});
    },
    
    // Event listener registration (used by conversational callbacks)
    on: (event, handler) => {
      if (listeners[event]) {
        listeners[event].push(handler);
      }
    },

    // Internal: Trigger event
    _emit: async (event, payload) => {
      if (listeners[event]) {
        await Promise.all(listeners[event].map(handler => handler(payload)));
      }
    }
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!token) {
    console.error('Missing TELEGRAM_BOT_TOKEN');
    return res.status(200).json({ error: 'Bot token not configured' });
  }

  const update = req.body;
  const bot = createBotAdapter(token);

  // Initialize listeners (register callbacks)
  // Note: These functions act as "setup" functions returning nothing or promises
  handleCallbacks(bot);
  handleConversationalCallbacks(bot);

  try {
    // Dispatch based on update type
    if (update.message?.text) {
      const msg = update.message;
      const text = msg.text;

      // Command Routing
      if (text.startsWith('/start')) await handleStart(bot, msg);
      else if (text.startsWith('/status')) await handleStatus(bot, msg);
      else if (text.startsWith('/estoque')) await handleEstoque(bot, msg);
      else if (text.startsWith('/hoje')) await handleHoje(bot, msg);
      else if (text.startsWith('/proxima')) await handleProxima(bot, msg);
      else if (text.startsWith('/historico')) await handleHistorico(bot, msg);
      else if (text.startsWith('/ajuda')) await handleAjuda(bot, msg);
      
      else if (text.startsWith('/registrar')) await handleRegistrar(bot, msg);
      else if (text.startsWith('/adicionar_estoque')) await handleAdicionarEstoque(bot, msg);
      
      // Arguments regex commands
      else if (text.startsWith('/repor')) {
        const match = text.match(/\/repor\s+(.+)\s+(\d+[.,]?\d*)/);
        if (match) await handleReporShortcut(bot, msg, match);
        else bot.sendMessage(msg.chat.id, 'Formato inválido. Use: /repor Nome Quantidade');
      }
      else if (text.startsWith('/pausar')) {
        const match = text.match(/\/pausar(?:\s+(.+))?/);
        await handlePausar(bot, msg, match || [text, undefined]); 
      }
      else if (text.startsWith('/retomar')) {
        const match = text.match(/\/retomar(?:\s+(.+))?/);
        await handleRetomar(bot, msg, match || [text, undefined]);
      }
      
      // Fallback: Emit 'message' event for conversational callback listeners
      else {
         await bot._emit('message', msg);
      }
    } 
    else if (update.callback_query) {
      // Dispatch to listeners registered via bot.on('callback_query', ...)
      await bot._emit('callback_query', update.callback_query);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(200).json({ error: 'Internal Error', details: error.message });
  }
}


import { supabase, MOCK_USER_ID } from './supabase.js';

const SESSION_TTL_MINUTES = 10; // 10 minute expiry

/**
 * Set session context for a chat
 * @param {number} chatId - Telegram chat ID
 * @param {object} context - Session data
 */
export async function setSession(chatId, context) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('bot_sessions')
    .upsert({
      user_id: MOCK_USER_ID,
      chat_id: chatId,
      context,
      expires_at: expiresAt,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'chat_id'
    });

  if (error) {
    console.error(`[SessionManager] Error setting session for chat ${chatId}:`, error);
  }
}

/**
 * Get session context for a chat
 * @param {number} chatId - Telegram chat ID
 * @returns {object|null} Session context or null if expired/not found
 */
export async function getSession(chatId) {
  const { data, error } = await supabase
    .from('bot_sessions')
    .select('context, expires_at')
    .eq('chat_id', chatId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // Not found error
      console.error(`[SessionManager] Error getting session for chat ${chatId}:`, error);
    }
    return null;
  }

  // Check if session expired
  if (new Date(data.expires_at) < new Date()) {
    await clearSession(chatId);
    return null;
  }

  return data.context;
}

/**
 * Clear session for a chat
 * @param {number} chatId - Telegram chat ID
 */
export async function clearSession(chatId) {
  const { error } = await supabase
    .from('bot_sessions')
    .delete()
    .eq('chat_id', chatId);

  if (error) {
    console.error(`[SessionManager] Error clearing session for chat ${chatId}:`, error);
  }
}

/**
 * Clean up expired sessions (run periodically)
 */
export async function cleanupExpiredSessions() {
  const { error } = await supabase
    .from('bot_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('[SessionManager] Error cleaning up expired sessions:', error);
  } else {
    console.log('[SessionManager] Cleanup completed');
  }
}

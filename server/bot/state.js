/**
 * Simple in-memory state manager for conversational flows.
 * Maps chatId to current context.
 */
const sessions = new Map();

export function setSession(chatId, data) {
  sessions.set(chatId, {
    ...data,
    updatedAt: Date.now()
  });
}

export function getSession(chatId) {
  const session = sessions.get(chatId);
  
  // Basic TTL: sessions expire after 10 minutes of inactivity
  if (session && Date.now() - session.updatedAt > 10 * 60 * 1000) {
    sessions.delete(chatId);
    return null;
  }
  
  return session;
}

export function clearSession(chatId) {
  sessions.delete(chatId);
}

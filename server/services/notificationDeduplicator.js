
import { supabase } from './supabase.js';

const DEDUP_WINDOW_MINUTES = 5; // Don't send same notification twice within 5 minutes

/**
 * Check if notification was recently sent and log if not
 * @param {string} protocolId - Protocol UUID
 * @param {string} notificationType - Type: 'dose_reminder', 'soft_reminder', 'stock_alert', etc.
 * @returns {boolean} true if should send, false if duplicate
 */
export async function shouldSendNotification(protocolId, notificationType) {
  const cutoffTime = new Date(Date.now() - DEDUP_WINDOW_MINUTES * 60 * 1000).toISOString();

  try {
    // Check if we recently sent this notification
    const { data, error } = await supabase
      .from('notification_log')
      .select('id')
      .eq('protocol_id', protocolId)
      .eq('notification_type', notificationType)
      .gte('sent_at', cutoffTime)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Deduplicator] Error checking notification log:', error);
      return true; // Fail open - send the notification on error
    }

    // If we found a recent notification, this is a duplicate
    if (data) {
      console.log(`[Deduplicator] Skipping duplicate ${notificationType} for protocol ${protocolId}`);
      return false;
    }

    // Not a duplicate - log it and return true
    await logNotification(protocolId, notificationType);
    return true;
  } catch (err) {
    console.error('[Deduplicator] Unexpected error:', err);
    return true; // Fail open
  }
}

/**
 * Log a notification as sent
 * @param {string} protocolId - Protocol UUID
 * @param {string} notificationType - Notification type
 */
export async function logNotification(protocolId, notificationType) {
  const { error } = await supabase
    .from('notification_log')
    .insert({
      protocol_id: protocolId,
      notification_type: notificationType
    });

  if (error) {
    console.error('[Deduplicator] Error logging notification:', error);
  }
}

/**
 * Clean up old notification logs (older than 7 days)
 */
export async function cleanupOldNotificationLogs() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('notification_log')
    .delete()
    .lt('created_at', sevenDaysAgo);

  if (error) {
    console.error('[Deduplicator] Error cleaning up logs:', error);
  } else {
    console.log('[Deduplicator] Cleanup completed');
  }
}

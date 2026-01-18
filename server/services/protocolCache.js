
import { supabase, MOCK_USER_ID } from './supabase.js';

// In-memory cache with TTL
const cache = new Map();
const CACHE_TTL_SECONDS = 30; // Cache protocols for 30 seconds

/**
 * Get active protocols with optional cache
 * @param {boolean} useCache - Whether to use cached results
 * @returns {Promise<array>} Array of protocols with medicine details
 */
export async function getActiveProtocols(useCache = true) {
  const cacheKey = `protocols:${MOCK_USER_ID}`;

  // Check cache
  if (useCache && cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL_SECONDS * 1000) {
      return data;
    }
    cache.delete(cacheKey); // Expired
  }

  try {
    const { data, error } = await supabase
      .from('protocols')
      .select('*, medicine:medicines(*)')
      .eq('user_id', MOCK_USER_ID)
      .eq('active', true);

    if (error) throw error;

    // Store in cache
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  } catch (err) {
    console.error('[ProtocolCache] Error fetching protocols:', err);
    return [];
  }
}

/**
 * Get user settings
 * @param {boolean} useCache - Whether to use cached results
 * @returns {Promise<object>} User settings
 */
export async function getUserSettings(useCache = true) {
  const cacheKey = `settings:${MOCK_USER_ID}`;

  if (useCache && cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL_SECONDS * 1000) {
      return data;
    }
    cache.delete(cacheKey);
  }

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', MOCK_USER_ID)
      .single();

    if (error) throw error;

    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  } catch (err) {
    console.error('[ProtocolCache] Error fetching settings:', err);
    return null;
  }
}

/**
 * Invalidate cache (call after mutations)
 */
export function invalidateCache() {
  cache.clear();
  console.log('[ProtocolCache] Cache invalidated');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}

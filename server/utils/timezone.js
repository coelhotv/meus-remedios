
/**
 * Get current time in HH:MM format for a specific timezone
 * @param {string} timezone - IANA timezone (e.g., 'America/Sao_Paulo')
 * @returns {string} HH:MM format
 */
export function getCurrentTimeInTimezone(timezone = 'America/Sao_Paulo') {
  const now = new Date();
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now).replace(/^24/, '00');
}

/**
 * Get current date in YYYY-MM-DD format for a specific timezone
 * @param {string} timezone - IANA timezone
 * @returns {string} YYYY-MM-DD format
 */
export function getCurrentDateInTimezone(timezone = 'America/Sao_Paulo') {
  const now = new Date();
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone
  }).format(now);
}

/**
 * Get current hour and minute separately
 * @param {string} timezone - IANA timezone
 * @returns {{hour: number, minute: number, date: string}}
 */
export function getCurrentTimeComponents(timezone = 'America/Sao_Paulo') {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const values = {};
  parts.forEach(({ type, value }) => {
    values[type] = value;
  });

  return {
    hour: parseInt(values.hour, 10),
    minute: parseInt(values.minute, 10),
    day: parseInt(values.day, 10),
    weekDay: now.toLocaleString('en-US', { timeZone: timezone, weekday: 'numeric' })
  };
}

/**
 * Convert ISO string to timezone-aware date string
 * @param {string} isoString - ISO 8601 datetime
 * @param {string} timezone - IANA timezone
 * @returns {string} Formatted time HH:MM
 */
export function formatTimeInTimezone(isoString, timezone = 'America/Sao_Paulo') {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date).replace(/^24/, '00');
}

/**
 * Centralized timezone display utilities
 * Always formats times in the location's timezone
 * 
 * Note: These utilities use browser/Node.js Intl API and do not require server actions
 */

export interface TimeDisplayOptions {
  showDate?: boolean;
  showTime?: boolean;
  showTimezone?: boolean;
  format?: 'short' | 'long';
  timeStyle?: '12h' | '24h';
}

/**
 * Format a time in its location timezone
 * Falls back to segment timezone, then browser timezone
 * Can be used in both client and server contexts
 */
export function formatInLocalTime(
  utcDate: Date | string,
  timeZoneId?: string | null,
  options: TimeDisplayOptions = {}
): string {
  const {
    showDate = false,
    showTime = true,
    showTimezone = true,
    format = 'short',
    timeStyle = '12h',
  } = options;

  try {
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    
    if (isNaN(date.getTime())) {
      return '';
    }

    // Use provided timezone or fallback to UTC
    const tz = timeZoneId || 'UTC';
    
    const formatOptions: Intl.DateTimeFormatOptions = {};
    
    if (showDate) {
      if (format === 'long') {
        formatOptions.year = 'numeric';
        formatOptions.month = 'long';
        formatOptions.day = 'numeric';
        formatOptions.weekday = 'long';
      } else {
        formatOptions.year = 'numeric';
        formatOptions.month = 'short';
        formatOptions.day = 'numeric';
      }
    }
    
    if (showTime) {
      formatOptions.hour = timeStyle === '24h' ? '2-digit' : 'numeric';
      formatOptions.minute = '2-digit';
      formatOptions.hour12 = timeStyle === '12h';
    }
    
    if (showTimezone) {
      formatOptions.timeZoneName = format === 'long' ? 'long' : 'short';
    }

    return new Intl.DateTimeFormat('en-US', {
      ...formatOptions,
      timeZone: tz,
    }).format(date);
  } catch (error) {
    console.error('Error formatting time in local timezone:', error);
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    return date.toLocaleString();
  }
}

/**
 * Get the timezone to use for display
 * Priority: reservation.timeZoneId → segment.timeZoneId → browser
 */
export function getDisplayTimezone(
  reservation?: { timeZoneId?: string | null },
  segment?: { startTimeZoneId?: string | null }
): string | undefined {
  if (reservation?.timeZoneId) {
    return reservation.timeZoneId;
  }
  if (segment?.startTimeZoneId) {
    return segment.startTimeZoneId;
  }
  // Return undefined to use browser timezone as fallback
  return undefined;
}

/**
 * Convert UTC date to local calendar day in timezone
 * Returns: { year, month, day, dayOfWeek }
 */
export function getLocalCalendarDay(
  utcDate: Date | string,
  timeZoneId: string
): { year: number; month: number; day: number; dayOfWeek: string; dateString: string } {
  try {
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    // Use Intl.DateTimeFormat to get date components in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      timeZone: timeZoneId,
    });

    const parts = formatter.formatToParts(date);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0');
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
    const dayOfWeek = parts.find(p => p.type === 'weekday')?.value || '';

    // Create a date string for comparison (YYYY-MM-DD)
    const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    return { year, month, day, dayOfWeek, dateString };
  } catch (error) {
    console.error('Error getting local calendar day:', error);
    // Fallback to UTC
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      dateString: date.toISOString().split('T')[0],
    };
  }
}

/**
 * Group reservations by local calendar day
 */
export function groupByLocalDay<T extends { startTime: Date | string; timeZoneId?: string | null }>(
  reservations: T[],
  segmentTimeZoneId?: string | null
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const reservation of reservations) {
    const timeZone = reservation.timeZoneId || segmentTimeZoneId || 'UTC';
    const localDay = getLocalCalendarDay(reservation.startTime, timeZone);
    
    const existing = grouped.get(localDay.dateString) || [];
    existing.push(reservation);
    grouped.set(localDay.dateString, existing);
  }

  return grouped;
}

/**
 * Format a date range in local timezone
 */
export function formatDateRangeInLocalTime(
  startDate: Date | string,
  endDate: Date | string | null | undefined,
  timeZoneId?: string | null,
  options: TimeDisplayOptions = {}
): string {
  const startFormatted = formatInLocalTime(startDate, timeZoneId, options);
  
  if (!endDate) {
    return startFormatted;
  }

  const endFormatted = formatInLocalTime(endDate, timeZoneId, options);
  
  // Check if same day
  const startLocal = getLocalCalendarDay(startDate, timeZoneId || 'UTC');
  const endLocal = getLocalCalendarDay(endDate, timeZoneId || 'UTC');
  
  if (startLocal.dateString === endLocal.dateString) {
    // Same day - show time range
    const startTime = formatInLocalTime(startDate, timeZoneId, { showTime: true, showTimezone: false });
    const endTime = formatInLocalTime(endDate, timeZoneId, { showTime: true, showTimezone: true });
    return `${startTime} - ${endTime}`;
  }
  
  // Different days
  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Format a day header with timezone
 */
export function formatDayHeader(
  date: Date | string,
  dayNumber: number,
  timeZoneId?: string | null
): { dayOfWeek: string; formattedDate: string; timezone: string } {
  const tz = timeZoneId || 'UTC';
  const localDay = getLocalCalendarDay(date, tz);
  
  const formattedDate = formatInLocalTime(date, tz, {
    showDate: true,
    showTime: false,
    showTimezone: false,
    format: 'long',
  });

  // Get timezone abbreviation
  const tzAbbr = formatInLocalTime(date, tz, {
    showDate: false,
    showTime: true,
    showTimezone: true,
    format: 'short',
  });
  
  // Extract just the timezone part (e.g., "PST" from "3:00 PM PST")
  const tzMatch = tzAbbr.match(/([A-Z]{2,5})$/);
  const timezone = tzMatch ? tzMatch[1] : tz;

  return {
    dayOfWeek: localDay.dayOfWeek,
    formattedDate,
    timezone,
  };
}

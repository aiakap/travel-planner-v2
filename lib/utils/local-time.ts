/**
 * Local Time Utilities
 * 
 * Philosophy:
 * - Store dates in "local time" fields (wall_start_date, wall_start_time, etc.) + timezone
 * - Display directly from local time fields (no conversion needed)
 * - Auto-calculate UTC field for sorting/filtering across timezones
 * - This eliminates complex timezone conversions and makes dates "what you see is what you store"
 */

// Month names for formatting
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Convert local date + time + timezone to UTC Date for sorting.
 * This is the only conversion function needed - used when writing to generate the UTC field.
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:mm or HH:mm:ss format, or null for start of day
 * @param timeZoneId - IANA timezone identifier (e.g., "America/Los_Angeles")
 * @param isEndOfDay - If true and no time provided, uses 23:59:59 instead of 00:01:00
 * @returns Date object in UTC
 * 
 * @example
 * localToUTC("2026-01-29", "14:30", "America/Los_Angeles")
 * // Returns Date representing 2:30 PM PST in UTC
 */
export function localToUTC(
  dateStr: string,
  timeStr: string | null,
  timeZoneId: string,
  isEndOfDay: boolean = false
): Date {
  if (!dateStr) {
    throw new Error("Date string is required");
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  
  // Parse time or use defaults
  let hours: number, minutes: number, seconds: number;
  if (timeStr) {
    const timeParts = timeStr.split(":").map(Number);
    hours = timeParts[0] || 0;
    minutes = timeParts[1] || 0;
    seconds = timeParts[2] || 0;
  } else {
    // Default to start or end of day
    hours = isEndOfDay ? 23 : 0;
    minutes = isEndOfDay ? 59 : 1;
    seconds = isEndOfDay ? 59 : 0;
  }

  if (!timeZoneId) {
    // Fallback: interpret as browser local timezone
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  try {
    // Strategy: Create a test date and calculate the offset
    const dateTimeString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    
    // Parse as UTC first to get a reference point
    const testDate = new Date(`${dateTimeString}Z`);
    
    // Get what this UTC time looks like in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZoneId,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(testDate);
    const tzYear = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const tzMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0');
    const tzDay = parseInt(parts.find(p => p.type === 'day')?.value || '0');
    const tzHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const tzMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    const tzSecond = parseInt(parts.find(p => p.type === 'second')?.value || '0');
    
    // Calculate offset
    const utcMs = testDate.getTime();
    const tzDate = new Date(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, tzSecond);
    const offset = utcMs - tzDate.getTime();
    
    // Apply offset to our target local time
    const localDate = new Date(year, month - 1, day, hours, minutes, seconds);
    return new Date(localDate.getTime() + offset);
  } catch (error) {
    console.error("Error converting local time to UTC:", error);
    // Fallback: simple UTC
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  }
}

/**
 * Format a local date for display. No timezone conversion needed since the date
 * is already stored in local time.
 * 
 * @param date - Date object from wall_start_date/wall_end_date, or YYYY-MM-DD string
 * @param format - Display format: 'iso' (YYYY-MM-DD), 'short' (Jan 29), 'long' (January 29, 2026), 'full' (Monday, January 29, 2026)
 * @returns Formatted date string
 */
export function formatLocalDate(
  date: Date | string | null | undefined,
  format: 'iso' | 'short' | 'long' | 'full' | 'weekday-short' | 'weekday-long' = 'short'
): string {
  if (!date) return '';
  
  // Parse date - handle both Date objects and strings
  let dateObj: Date;
  if (typeof date === 'string') {
    // For YYYY-MM-DD strings, parse as UTC to avoid timezone shifts
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(Date.UTC(year, month - 1, day));
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  // Use UTC methods to avoid any browser timezone interference
  const year = dateObj.getUTCFullYear();
  const month = dateObj.getUTCMonth();
  const day = dateObj.getUTCDate();
  const dayOfWeek = dateObj.getUTCDay();
  
  switch (format) {
    case 'iso':
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    case 'short':
      return `${MONTHS_SHORT[month]} ${day}`;
    case 'long':
      return `${MONTHS_LONG[month]} ${day}, ${year}`;
    case 'full':
      return `${DAYS_LONG[dayOfWeek]}, ${MONTHS_LONG[month]} ${day}, ${year}`;
    case 'weekday-short':
      return `${DAYS_SHORT[dayOfWeek]}, ${MONTHS_SHORT[month]} ${day}`;
    case 'weekday-long':
      return `${DAYS_LONG[dayOfWeek]}, ${MONTHS_LONG[month]} ${day}`;
    default:
      return `${MONTHS_SHORT[month]} ${day}`;
  }
}

/**
 * Format a local time for display. No timezone conversion needed since the time
 * is already stored in local time.
 * 
 * @param time - Date object from wall_start_time/wall_end_time, or HH:mm string
 * @param format - Display format: '24h' (14:30), '12h' (2:30 PM)
 * @returns Formatted time string
 */
export function formatLocalTime(
  time: Date | string | null | undefined,
  format: '24h' | '12h' = '24h'
): string {
  if (!time) return '';
  
  let hours: number, minutes: number;
  
  if (typeof time === 'string') {
    // Parse HH:mm or HH:mm:ss string
    const parts = time.split(':').map(Number);
    hours = parts[0] || 0;
    minutes = parts[1] || 0;
  } else {
    // Date object - use UTC methods since time is stored as UTC midnight + time offset
    hours = time.getUTCHours();
    minutes = time.getUTCMinutes();
  }
  
  if (format === '12h') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  }
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Format a date range using local dates.
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted range like "Jan 29 - Feb 5" or "Jan 29 - 31"
 */
export function formatLocalDateRange(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): string {
  if (!startDate) return '';
  if (!endDate) return formatLocalDate(startDate, 'short');
  
  const startFormatted = formatLocalDate(startDate, 'short');
  const endFormatted = formatLocalDate(endDate, 'short');
  
  // Check if same month
  const startMonth = typeof startDate === 'string' 
    ? startDate.slice(5, 7)
    : String(startDate.getUTCMonth() + 1).padStart(2, '0');
  const endMonth = typeof endDate === 'string'
    ? endDate.slice(5, 7)
    : String(endDate.getUTCMonth() + 1).padStart(2, '0');
  
  if (startMonth === endMonth) {
    // Same month - just show day for end date
    const endDay = typeof endDate === 'string'
      ? parseInt(endDate.slice(8, 10))
      : endDate.getUTCDate();
    return `${startFormatted} - ${endDay}`;
  }
  
  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Parse datetime-local input to local date and time components.
 * 
 * @param input - String in YYYY-MM-DDTHH:mm format
 * @returns Object with date and time strings
 */
export function parseToLocalComponents(input: string): { date: string; time: string } {
  if (!input) return { date: '', time: '' };
  
  const [date, time] = input.split('T');
  return { 
    date: date || '', 
    time: time || '00:00'
  };
}

/**
 * Combine local date and time into datetime-local format.
 * 
 * @param date - YYYY-MM-DD string
 * @param time - HH:mm string
 * @returns String in YYYY-MM-DDTHH:mm format
 */
export function toDateTimeLocal(date: string, time: string): string {
  if (!date) return '';
  return `${date}T${time || '00:00'}`;
}

/**
 * Get the day number from a local date.
 * 
 * @param date - Date object or YYYY-MM-DD string
 * @returns Day number (1-31)
 */
export function getLocalDayNumber(date: Date | string | null | undefined): number {
  if (!date) return 0;
  
  if (typeof date === 'string') {
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return parseInt(date.slice(8, 10));
    }
    return new Date(date).getUTCDate();
  }
  
  return date.getUTCDate();
}

/**
 * Get the weekday from a local date.
 * 
 * @param date - Date object or YYYY-MM-DD string
 * @param format - 'short' (Mon) or 'long' (Monday)
 * @returns Weekday string
 */
export function getLocalWeekday(
  date: Date | string | null | undefined,
  format: 'short' | 'long' = 'short'
): string {
  if (!date) return '';
  
  let dateObj: Date;
  if (typeof date === 'string') {
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(Date.UTC(year, month - 1, day));
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  const dayOfWeek = dateObj.getUTCDay();
  return format === 'long' ? DAYS_LONG[dayOfWeek] : DAYS_SHORT[dayOfWeek];
}

/**
 * Get the month from a local date.
 * 
 * @param date - Date object or YYYY-MM-DD string
 * @param format - 'short' (Jan) or 'long' (January)
 * @returns Month string
 */
export function getLocalMonth(
  date: Date | string | null | undefined,
  format: 'short' | 'long' = 'short'
): string {
  if (!date) return '';
  
  let month: number;
  if (typeof date === 'string') {
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      month = parseInt(date.slice(5, 7)) - 1;
    } else {
      month = new Date(date).getUTCMonth();
    }
  } else {
    month = date.getUTCMonth();
  }
  
  return format === 'long' ? MONTHS_LONG[month] : MONTHS_SHORT[month];
}

/**
 * Validate an IANA timezone identifier.
 * 
 * @param timeZoneId - Timezone identifier to validate
 * @returns true if valid
 */
export function isValidTimezone(timeZoneId: string): boolean {
  if (!timeZoneId) return false;
  
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timeZoneId });
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate an array of YYYY-MM-DD date strings between start and end (inclusive).
 * 
 * @param startDate - Start date (YYYY-MM-DD or Date)
 * @param endDate - End date (YYYY-MM-DD or Date)
 * @returns Array of YYYY-MM-DD strings
 */
export function getLocalDateRange(
  startDate: Date | string,
  endDate: Date | string
): string[] {
  const dates: string[] = [];
  
  // Parse start date
  let currentYear: number, currentMonth: number, currentDay: number;
  if (typeof startDate === 'string') {
    [currentYear, currentMonth, currentDay] = startDate.split('-').map(Number);
  } else {
    currentYear = startDate.getUTCFullYear();
    currentMonth = startDate.getUTCMonth() + 1;
    currentDay = startDate.getUTCDate();
  }
  
  // Parse end date
  let endYear: number, endMonth: number, endDay: number;
  if (typeof endDate === 'string') {
    [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  } else {
    endYear = endDate.getUTCFullYear();
    endMonth = endDate.getUTCMonth() + 1;
    endDay = endDate.getUTCDate();
  }
  
  const endDateObj = new Date(Date.UTC(endYear, endMonth - 1, endDay));
  let current = new Date(Date.UTC(currentYear, currentMonth - 1, currentDay));
  
  while (current <= endDateObj) {
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, '0');
    const day = String(current.getUTCDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  
  return dates;
}

/**
 * Convert a PostgreSQL DATE field value to a YYYY-MM-DD string.
 * PostgreSQL DATE fields come as Date objects at UTC midnight.
 * 
 * @param date - Date object from PostgreSQL
 * @returns YYYY-MM-DD string
 */
export function pgDateToString(date: Date | null | undefined): string {
  if (!date) return '';
  
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Convert a PostgreSQL TIME field value to an HH:mm string.
 * PostgreSQL TIME fields come as Date objects with time set.
 * 
 * @param time - Date object from PostgreSQL
 * @returns HH:mm string
 */
export function pgTimeToString(time: Date | null | undefined): string {
  if (!time) return '';
  
  const hours = String(time.getUTCHours()).padStart(2, '0');
  const minutes = String(time.getUTCMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Convert a YYYY-MM-DD string to a Date object suitable for PostgreSQL DATE field.
 * 
 * @param dateStr - YYYY-MM-DD string
 * @returns Date object at UTC midnight
 */
export function stringToPgDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Convert an HH:mm string to a Date object suitable for PostgreSQL TIME field.
 * 
 * @param timeStr - HH:mm or HH:mm:ss string
 * @returns Date object with time set (date part is arbitrary)
 */
export function stringToPgTime(timeStr: string | null | undefined): Date | null {
  if (!timeStr) return null;
  
  const parts = timeStr.split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;
  
  // Use a fixed date (epoch) for the time
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds, 0));
}

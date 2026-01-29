/**
 * Timezone-aware date utilities for segments
 * 
 * Philosophy:
 * - User selects calendar dates (Jan 29)
 * - System stores as 12:01 AM (start) or 11:59:59 PM (end) in LOCAL timezone, converted to UTC
 * - Display converts UTC back to local timezone to show the calendar date
 * - This makes dates work like humans think while keeping UTC in the database
 */

/**
 * Converts a calendar date to a UTC ISO string representing the start of that day
 * in the specified timezone (12:01 AM local time).
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeZoneId - IANA timezone identifier (e.g., "America/Los_Angeles")
 * @param isEndDate - If true, uses 11:59:59 PM instead of 12:01 AM
 * @returns ISO string in UTC
 * 
 * @example
 * // Start of Jan 29, 2026 in California (PST = UTC-8)
 * dateToUTC("2026-01-29", "America/Los_Angeles", false)
 * // Returns "2026-01-29T08:01:00.000Z" (12:01 AM PST = 8:01 AM UTC)
 * 
 * @example
 * // End of Jan 29, 2026 in California
 * dateToUTC("2026-01-29", "America/Los_Angeles", true)
 * // Returns "2026-01-30T07:59:59.000Z" (11:59:59 PM PST = 7:59:59 AM UTC next day)
 */
export function dateToUTC(
  dateStr: string,
  timeZoneId?: string,
  isEndDate: boolean = false
): string {
  if (!dateStr) {
    throw new Error("Date string is required");
  }

  const [year, month, day] = dateStr.split("-").map(Number);

  // If no timezone provided, use a default behavior
  if (!timeZoneId) {
    // Use browser's local timezone
    const date = new Date(year, month - 1, day, isEndDate ? 23 : 0, isEndDate ? 59 : 1, isEndDate ? 59 : 0);
    return date.toISOString();
  }

  try {
    // Create a string representing the local date/time we want
    const hours = isEndDate ? 23 : 0;
    const minutes = isEndDate ? 59 : 1;
    const seconds = isEndDate ? 59 : 0;
    
    // Create a date string in the format that toLocaleString outputs
    // We'll parse a date in the target timezone
    const dateTimeString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    
    // Use Intl.DateTimeFormat to work with the timezone
    // Strategy: Find the offset between local and UTC for this timezone at this date
    
    // Create a test date to determine the offset
    const testDate = new Date(`${dateTimeString}Z`); // Parse as UTC first
    
    // Get what this UTC time looks like in the target timezone
    const tzDateStr = testDate.toLocaleString("en-US", {
      timeZone: timeZoneId,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    
    // Parse the result to understand the offset
    const tzParts = tzDateStr.match(/(\d+)\/(\d+)\/(\d+),\s*(\d+):(\d+):(\d+)/);
    if (!tzParts) {
      throw new Error("Failed to parse timezone string");
    }
    
    const [, tzMonth, tzDay, tzYear, tzHour, tzMinute, tzSecond] = tzParts;
    
    // Create dates to calculate offset
    const utcMs = testDate.getTime();
    const tzDate = new Date(
      parseInt(tzYear),
      parseInt(tzMonth) - 1,
      parseInt(tzDay),
      parseInt(tzHour),
      parseInt(tzMinute),
      parseInt(tzSecond)
    );
    const tzMs = tzDate.getTime();
    const offset = utcMs - tzMs;
    
    // Now apply this offset to our target local time
    const localDate = new Date(year, month - 1, day, hours, minutes, seconds);
    const utcDate = new Date(localDate.getTime() + offset);
    
    return utcDate.toISOString();
  } catch (error) {
    console.error("Error converting date to UTC:", error);
    // Fallback: use simple UTC time
    const date = new Date(Date.UTC(year, month - 1, day, isEndDate ? 23 : 0, isEndDate ? 59 : 1, isEndDate ? 59 : 0));
    return date.toISOString();
  }
}

/**
 * Converts a UTC ISO string to a calendar date (YYYY-MM-DD) in the specified timezone.
 * This ensures that when we display dates, users see the date in their local timezone.
 * 
 * @param isoStr - ISO date string in UTC
 * @param timeZoneId - IANA timezone identifier
 * @returns Date string in YYYY-MM-DD format
 * 
 * @example
 * // UTC time that represents 12:01 AM Jan 29 in California
 * utcToDate("2026-01-29T08:01:00.000Z", "America/Los_Angeles")
 * // Returns "2026-01-29"
 */
export function utcToDate(isoStr: string, timeZoneId?: string): string {
  if (!isoStr) return "";
  
  // If the ISO string is already just a date (YYYY-MM-DD), return it
  if (!isoStr.includes("T")) {
    return isoStr;
  }
  
  const date = new Date(isoStr);
  
  if (!timeZoneId) {
    // Use browser's local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  
  try {
    // Format the date in the target timezone
    // Using en-CA locale gives us YYYY-MM-DD format
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZoneId,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    
    return formatter.format(date);
  } catch (error) {
    console.error("Error converting UTC to date:", error);
    // Fallback to UTC date
    return isoStr.split("T")[0];
  }
}

/**
 * Formats a UTC datetime to wall clock time (HH:mm) in the specified timezone.
 * 
 * @param date - Date object or ISO string
 * @param timeZoneId - IANA timezone identifier
 * @returns Time string in HH:mm format (24-hour)
 * 
 * @example
 * formatTimeInTimezone("2026-01-29T08:01:00.000Z", "America/Los_Angeles")
 * // Returns "00:01" (12:01 AM PST)
 */
export function formatTimeInTimezone(date: Date | string, timeZoneId?: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!timeZoneId) {
    // Use browser's local timezone
    return dateObj.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
  }
  
  try {
    return dateObj.toLocaleTimeString('en-US', {
      timeZone: timeZoneId,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Error formatting time in timezone:', error);
    return "00:00";
  }
}

/**
 * Formats a UTC datetime to datetime-local input format (YYYY-MM-DDTHH:mm)
 * in the specified timezone.
 * 
 * This is the inverse of dateTimeLocalToUTC - it converts a UTC timestamp
 * to the wall clock time in a specific timezone for display in datetime-local inputs.
 * 
 * @param utcDate - UTC date (Date object or ISO string)
 * @param timeZoneId - IANA timezone identifier (e.g., "America/Los_Angeles")
 * @returns String in format "YYYY-MM-DDTHH:mm" representing local time
 * 
 * @example
 * utcToDateTimeLocal("2026-01-29T05:30:00.000Z", "Asia/Tokyo")
 * // Returns "2026-01-29T14:30" (2:30 PM Tokyo time)
 */
export function utcToDateTimeLocal(utcDate: Date | string, timeZoneId?: string): string {
  const dateObj = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  if (!timeZoneId) {
    // Fallback to browser's local timezone
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
  }
  
  try {
    // Get the date/time components in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZoneId,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(dateObj);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;
    
    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch (error) {
    console.error('Error formatting datetime-local:', error);
    // Fallback to browser timezone
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
  }
}

/**
 * Converts a datetime-local input value to UTC ISO string.
 * 
 * This is the inverse of utcToDateTimeLocal - it takes a datetime-local input
 * (which has no timezone info) and interprets it as wall clock time in the
 * specified timezone, then converts to UTC.
 * 
 * @param dateTimeLocal - String in format "YYYY-MM-DDTHH:mm" (from datetime-local input)
 * @param timeZoneId - IANA timezone identifier
 * @returns UTC ISO string
 * 
 * @example
 * dateTimeLocalToUTC("2026-01-29T14:30", "Asia/Tokyo")
 * // Returns "2026-01-29T05:30:00.000Z" (2:30 PM Tokyo = 5:30 AM UTC)
 */
export function dateTimeLocalToUTC(dateTimeLocal: string, timeZoneId?: string): string {
  if (!dateTimeLocal) return '';
  
  // Parse the datetime-local string
  const [datePart, timePart] = dateTimeLocal.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  if (!timeZoneId) {
    // No timezone specified - interpret as browser's local timezone
    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return date.toISOString();
  }
  
  try {
    // Create a test date to determine the offset for this timezone at this date/time
    const testDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
    
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
    
    // Extract the formatted values
    const formattedYear = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const formattedMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0');
    const formattedDay = parseInt(parts.find(p => p.type === 'day')?.value || '0');
    const formattedHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const formattedMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    
    // Calculate the difference in milliseconds
    const inputMs = Date.UTC(year, month - 1, day, hours, minutes, 0);
    const formattedMs = Date.UTC(formattedYear, formattedMonth - 1, formattedDay, formattedHour, formattedMinute, 0);
    const offsetMs = inputMs - formattedMs;
    
    // Apply the offset to get the correct UTC time
    const correctUtcMs = testDate.getTime() - offsetMs;
    return new Date(correctUtcMs).toISOString();
  } catch (error) {
    console.error('Error converting datetime-local to UTC:', error);
    // Fallback: interpret as browser's local timezone
    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return date.toISOString();
  }
}

// Backwards compatibility aliases
export const dateToTimezoneISO = dateToUTC;
export const isoToTimezoneDate = utcToDate;

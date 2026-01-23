"use server";

interface TimeZoneResult {
  timeZoneId: string;
  timeZoneName: string;
  offset: number; // Offset in seconds from UTC
  dstOffset: number; // DST offset in seconds
}

/**
 * Get timezone information for a location using Google Time Zone API
 */
export async function getTimeZoneForLocation(
  lat: number,
  lng: number,
  timestamp?: number
): Promise<TimeZoneResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error("Google Maps API key not configured");
    return null;
  }

  try {
    // Use current timestamp if not provided
    const ts = timestamp || Math.floor(Date.now() / 1000);
    
    const url = new URL("https://maps.googleapis.com/maps/api/timezone/json");
    url.searchParams.append("location", `${lat},${lng}`);
    url.searchParams.append("timestamp", ts.toString());
    url.searchParams.append("key", apiKey);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error("Time Zone API error:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Time Zone API returned error:", data.status);
      return null;
    }

    return {
      timeZoneId: data.timeZoneId,
      timeZoneName: data.timeZoneName,
      offset: data.rawOffset,
      dstOffset: data.dstOffset,
    };
  } catch (error) {
    console.error("Error fetching timezone:", error);
    return null;
  }
}

/**
 * Get timezone for a segment's start and end locations
 */
export async function getSegmentTimeZones(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  startTime?: Date,
  endTime?: Date
): Promise<{
  start: TimeZoneResult | null;
  end: TimeZoneResult | null;
  hasTimeZoneChange: boolean;
}> {
  const startTimestamp = startTime ? Math.floor(startTime.getTime() / 1000) : undefined;
  const endTimestamp = endTime ? Math.floor(endTime.getTime() / 1000) : undefined;

  const [start, end] = await Promise.all([
    getTimeZoneForLocation(startLat, startLng, startTimestamp),
    getTimeZoneForLocation(endLat, endLng, endTimestamp),
  ]);

  return {
    start,
    end,
    hasTimeZoneChange: start?.timeZoneId !== end?.timeZoneId,
  };
}

/**
 * Format a date in a specific timezone
 */
export async function formatDateInTimeZone(
  date: Date,
  timeZoneId: string,
  options?: Intl.DateTimeFormatOptions
): Promise<string> {
  try {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
      ...options,
    };
  
    return new Intl.DateTimeFormat("en-US", {
      ...defaultOptions,
      timeZone: timeZoneId,
    }).format(date);
  } catch (error) {
    console.error("Error formatting date in timezone:", error);
    return date.toLocaleString();
  }
}

/**
 * Get time difference message between two timezones
 */
export async function getTimeZoneDifferenceMessage(
  timezone1: TimeZoneResult,
  timezone2: TimeZoneResult
): Promise<string | null> {
  const totalOffset1 = timezone1.offset + timezone1.dstOffset;
  const totalOffset2 = timezone2.offset + timezone2.dstOffset;
  const diffSeconds = totalOffset2 - totalOffset1;
  const diffHours = diffSeconds / 3600;

  if (diffHours === 0) return null;

  const absDiff = Math.abs(diffHours);
  const direction = diffHours > 0 ? "ahead" : "behind";

  return `${timezone2.timeZoneName} is ${absDiff}h ${direction} of ${timezone1.timeZoneName}`;
}

/**
 * Calculate local time at destination given a time at origin
 */
export async function calculateDestinationTime(
  originTime: Date,
  originTimezone: TimeZoneResult,
  destTimezone: TimeZoneResult
): Promise<Date> {
  const originOffset = originTimezone.offset + originTimezone.dstOffset;
  const destOffset = destTimezone.offset + destTimezone.dstOffset;
  const diffMs = (destOffset - originOffset) * 1000;

  return new Date(originTime.getTime() + diffMs);
}

/**
 * Check if a time crosses into the next day when traveling to a different timezone
 */
export async function checkDayBoundary(
  time: Date,
  fromTimezone: TimeZoneResult,
  toTimezone: TimeZoneResult
): Promise<{
  crossesDayBoundary: boolean;
  daysDifference: number;
}> {
  const destTime = await calculateDestinationTime(time, fromTimezone, toTimezone);
  
  const originDay = time.getUTCDate();
  const destDay = destTime.getUTCDate();
  
  return {
    crossesDayBoundary: originDay !== destDay,
    daysDifference: destDay - originDay,
  };
}

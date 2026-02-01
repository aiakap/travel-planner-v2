/**
 * Local Time Types
 * 
 * These types represent the local time data stored in the database.
 * The database fields are named wall_* but we use "Local" naming in code.
 */

/**
 * Represents a local date/time with timezone context.
 * Maps to wall_*_date, wall_*_time, and timezone fields in the database.
 */
export interface LocalDateTime {
  /** Local date (from wall_start_date or wall_end_date) - YYYY-MM-DD or Date */
  date: Date | string;
  /** Local time (from wall_start_time or wall_end_time) - HH:mm or Date, null for date-only */
  time: Date | string | null;
  /** IANA timezone identifier (e.g., "America/Los_Angeles") */
  timeZoneId: string;
  /** Human-readable timezone name (e.g., "Pacific Standard Time") */
  timeZoneName?: string;
}

/**
 * Local date/time data for a segment.
 * Segments typically only have dates, not times.
 */
export interface SegmentLocalDates {
  /** Start date with timezone */
  start: {
    date: Date | string;
    timeZoneId: string;
    timeZoneName?: string;
  };
  /** End date with timezone (may be different from start for travel segments) */
  end: {
    date: Date | string;
    timeZoneId: string;
    timeZoneName?: string;
  };
}

/**
 * Local date/time data for a reservation.
 * Reservations have both date and time.
 */
export interface ReservationLocalDates {
  /** Start date/time with timezone */
  start: LocalDateTime;
  /** End date/time with timezone (optional for some reservation types) */
  end?: LocalDateTime;
}

/**
 * Input for creating/updating a segment with local dates.
 */
export interface SegmentLocalDateInput {
  /** Start date in YYYY-MM-DD format */
  startDate: string;
  /** End date in YYYY-MM-DD format */
  endDate: string;
  /** Start location timezone ID */
  startTimeZoneId: string;
  /** Start location timezone name */
  startTimeZoneName?: string;
  /** End location timezone ID (defaults to startTimeZoneId) */
  endTimeZoneId?: string;
  /** End location timezone name */
  endTimeZoneName?: string;
}

/**
 * Input for creating/updating a reservation with local dates.
 */
export interface ReservationLocalDateInput {
  /** Start date in YYYY-MM-DD format */
  startDate: string;
  /** Start time in HH:mm format (optional) */
  startTime?: string;
  /** End date in YYYY-MM-DD format (optional) */
  endDate?: string;
  /** End time in HH:mm format (optional) */
  endTime?: string;
  /** Timezone ID for the reservation */
  timeZoneId: string;
  /** Timezone name for the reservation */
  timeZoneName?: string;
}

/**
 * Prisma-ready data for writing segment local dates.
 * These field names match the database schema.
 */
export interface SegmentLocalDatePrismaData {
  /** Local start date */
  wall_start_date: Date | null;
  /** Local end date */
  wall_end_date: Date | null;
  /** Start location timezone ID */
  startTimeZoneId: string | null;
  /** Start location timezone name */
  startTimeZoneName: string | null;
  /** End location timezone ID */
  endTimeZoneId: string | null;
  /** End location timezone name */
  endTimeZoneName: string | null;
  /** UTC start time (for sorting) */
  startTime: Date | null;
  /** UTC end time (for sorting) */
  endTime: Date | null;
}

/**
 * Prisma-ready data for writing reservation local dates.
 * These field names match the database schema.
 */
export interface ReservationLocalDatePrismaData {
  /** Local start date */
  wall_start_date: Date | null;
  /** Local start time */
  wall_start_time: Date | null;
  /** Local end date */
  wall_end_date: Date | null;
  /** Local end time */
  wall_end_time: Date | null;
  /** Timezone ID */
  timeZoneId: string | null;
  /** Timezone name */
  timeZoneName: string | null;
  /** UTC start time (for sorting) */
  startTime: Date | null;
  /** UTC end time (for sorting) */
  endTime: Date | null;
}

/**
 * Helper to build Prisma data for segment local dates.
 */
export function buildSegmentLocalDateData(
  input: SegmentLocalDateInput,
  localToUTC: (date: string, time: string | null, tz: string, isEnd?: boolean) => Date
): SegmentLocalDatePrismaData {
  const endTz = input.endTimeZoneId || input.startTimeZoneId;
  
  return {
    wall_start_date: new Date(input.startDate + 'T00:00:00Z'),
    wall_end_date: new Date(input.endDate + 'T00:00:00Z'),
    startTimeZoneId: input.startTimeZoneId,
    startTimeZoneName: input.startTimeZoneName || null,
    endTimeZoneId: endTz,
    endTimeZoneName: input.endTimeZoneName || null,
    startTime: localToUTC(input.startDate, null, input.startTimeZoneId, false),
    endTime: localToUTC(input.endDate, null, endTz, true),
  };
}

/**
 * Helper to build Prisma data for reservation local dates.
 */
export function buildReservationLocalDateData(
  input: ReservationLocalDateInput,
  localToUTC: (date: string, time: string | null, tz: string, isEnd?: boolean) => Date
): ReservationLocalDatePrismaData {
  const startTimeDate = input.startTime
    ? new Date(`1970-01-01T${input.startTime}:00Z`)
    : null;
    
  const endTimeDate = input.endTime
    ? new Date(`1970-01-01T${input.endTime}:00Z`)
    : null;
  
  return {
    wall_start_date: new Date(input.startDate + 'T00:00:00Z'),
    wall_start_time: startTimeDate,
    wall_end_date: input.endDate ? new Date(input.endDate + 'T00:00:00Z') : null,
    wall_end_time: endTimeDate,
    timeZoneId: input.timeZoneId,
    timeZoneName: input.timeZoneName || null,
    startTime: localToUTC(input.startDate, input.startTime || null, input.timeZoneId, false),
    endTime: input.endDate 
      ? localToUTC(input.endDate, input.endTime || null, input.timeZoneId, true)
      : null,
  };
}

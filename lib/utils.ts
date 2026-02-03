import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTimeInTimeZone(
  value: Date,
  timeZone?: string
): string {
  if (!timeZone) {
    return value.toLocaleString();
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    }).format(value);
  } catch {
    return value.toLocaleString();
  }
}

/**
 * @deprecated Use formatWallDateTime() instead for reading from wall_* database fields.
 * This function uses browser local timezone which causes issues with UTC timestamps.
 */
export function formatForDateTimeLocal(value: Date): string {
  const pad = (input: number) => String(input).padStart(2, "0");
  return [
    `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
      value.getDate()
    )}`,
    `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  ].join("T");
}

/**
 * Format wall_* database fields for datetime-local input.
 * wall_* fields store local time using Prisma's local time handling.
 * 
 * @param wallDate - Date from wall_start_date or wall_end_date (stored at UTC midnight)
 * @param wallTime - Date from wall_start_time or wall_end_time (stored using local time)
 * @returns String in YYYY-MM-DDTHH:mm format for datetime-local input
 */
export function formatWallDateTime(
  wallDate: Date | null | undefined,
  wallTime: Date | null | undefined
): string {
  if (!wallDate) return "";
  
  // Extract date using UTC methods (wall_date is stored at UTC midnight)
  const year = wallDate.getUTCFullYear();
  const month = String(wallDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(wallDate.getUTCDate()).padStart(2, "0");
  
  // Extract time using LOCAL methods (Prisma uses local time for TIME fields)
  let hours = "00";
  let minutes = "00";
  if (wallTime) {
    hours = String(wallTime.getHours()).padStart(2, "0");
    minutes = String(wallTime.getMinutes()).padStart(2, "0");
  }
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format wall_start_date/wall_end_date for date-only input (YYYY-MM-DD).
 * 
 * @param wallDate - Date from wall_start_date or wall_end_date
 * @returns String in YYYY-MM-DD format
 */
export function formatWallDate(wallDate: Date | null | undefined): string {
  if (!wallDate) return "";
  
  const year = wallDate.getUTCFullYear();
  const month = String(wallDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(wallDate.getUTCDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
}

/**
 * Format wall_start_time/wall_end_time for time display (HH:mm).
 * 
 * @param wallTime - Date from wall_start_time or wall_end_time
 * @returns String in HH:mm format
 */
export function formatWallTime(wallTime: Date | null | undefined): string {
  if (!wallTime) return "";
  
  // Use LOCAL methods - Prisma uses local time for TIME fields
  const hours = String(wallTime.getHours()).padStart(2, "0");
  const minutes = String(wallTime.getMinutes()).padStart(2, "0");
  
  return `${hours}:${minutes}`;
}

/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate total distance traveled across all segments
 * @param segments Array of segments with start/end coordinates
 * @returns Total distance in kilometers
 */
export function calculateTotalDistance(
  segments: Array<{
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
  }>
): number {
  return segments.reduce((total, segment) => {
    return (
      total +
      calculateDistance(
        segment.startLat,
        segment.startLng,
        segment.endLat,
        segment.endLng
      )
    );
  }, 0);
}

/**
 * Calculate how many times around the world the distance represents
 * @param distanceKm Distance in kilometers
 * @returns Number of times around the world (Earth's circumference: 40,075 km)
 */
export function calculateTimesAroundWorld(distanceKm: number): number {
  const EARTH_CIRCUMFERENCE = 40075; // kilometers
  return distanceKm / EARTH_CIRCUMFERENCE;
}

/**
 * Generate a consistent color from a string (e.g., trip ID)
 * @param str String to hash
 * @returns Hex color string
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

/**
 * Time utility functions - Pure functions that don't need server actions
 */

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Add duration (in hours) to a time string
 */
export function addDuration(time: string, durationHours: number): string {
  const minutes = timeToMinutes(time);
  const newMinutes = minutes + durationHours * 60;
  return minutesToTime(newMinutes);
}

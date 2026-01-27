/**
 * Date utility functions
 * Safe for use in both client and server components
 */

/**
 * Calculate number of nights between check-in and check-out dates
 * @param checkInDate - Check-in date (YYYY-MM-DD)
 * @param checkOutDate - Check-out date (YYYY-MM-DD)
 * @returns Number of nights (minimum 1)
 */
export function calculateNights(checkInDate: string, checkOutDate: string): number {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, nights); // Minimum 1 night
}

/**
 * Format a date string to a more readable format
 * @param dateString - Date string (YYYY-MM-DD)
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Check if a date is in the future
 * @param dateString - Date string (YYYY-MM-DD)
 * @returns True if date is in the future
 */
export function isFutureDate(dateString: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateString);
  return date > today;
}

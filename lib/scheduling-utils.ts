/**
 * Pure utility functions for scheduling (non-async, client-safe)
 * Separated from smart-scheduling.ts to avoid "use server" restrictions
 */

/**
 * Get default time based on reservation type
 */
export function getDefaultTimeForType(
  category: string,
  type: string
): { startTime: string; endTime: string; duration: number } {
  const typeLower = type.toLowerCase();
  
  switch (category) {
    case "Dining":
      if (typeLower.includes("breakfast")) {
        return { startTime: "08:00", endTime: "09:00", duration: 1 };
      }
      if (typeLower.includes("lunch")) {
        return { startTime: "12:00", endTime: "13:30", duration: 1.5 };
      }
      if (typeLower.includes("coffee") || typeLower.includes("cafe") || typeLower.includes("café")) {
        return { startTime: "10:00", endTime: "11:00", duration: 1 };
      }
      // Default to dinner - 1.5 hours for general meals
      return { startTime: "19:00", endTime: "20:30", duration: 1.5 };
  
    case "Activity":
      // Movies and cinema
      if (typeLower.includes("movie") || typeLower.includes("cinema") || typeLower.includes("film")) {
        return { startTime: "19:00", endTime: "21:00", duration: 2 };
      }
      // Theater and shows
      if (typeLower.includes("theater") || typeLower.includes("theatre") || typeLower.includes("show") || typeLower.includes("performance")) {
        return { startTime: "19:30", endTime: "22:00", duration: 2.5 };
      }
      // Tours
      if (typeLower.includes("tour")) {
        return { startTime: "10:00", endTime: "13:00", duration: 3 };
      }
      // Museums
      if (typeLower.includes("museum") || typeLower.includes("gallery") || typeLower.includes("exhibition")) {
        return { startTime: "10:00", endTime: "12:00", duration: 2 };
      }
      // Shopping
      if (typeLower.includes("shop") || typeLower.includes("market") || typeLower.includes("mall")) {
        return { startTime: "14:00", endTime: "16:00", duration: 2 };
      }
      // Spa and wellness
      if (typeLower.includes("spa") || typeLower.includes("massage") || typeLower.includes("wellness")) {
        return { startTime: "14:00", endTime: "16:00", duration: 2 };
      }
      // Default activity
      return { startTime: "14:00", endTime: "16:00", duration: 2 };
  
    case "Stay":
      // Hotel check-in
      return { startTime: "15:00", endTime: "15:30", duration: 0.5 };
  
    case "Travel":
      // Default travel time
      return { startTime: "10:00", endTime: "12:00", duration: 2 };
  
    default:
      return { startTime: "10:00", endTime: "12:00", duration: 2 };
  }
}

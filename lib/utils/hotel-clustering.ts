/**
 * Hotel Clustering Utility
 * 
 * Defines types and utilities for grouping hotel reservations
 * for segment matching purposes.
 */

import { HotelExtraction } from '@/lib/schemas/hotel-extraction-schema';

/**
 * A hotel cluster represents one or more hotel bookings
 * that should be matched to a segment together.
 * 
 * For now, we typically have one hotel per cluster,
 * but this structure allows for future expansion.
 */
export interface HotelCluster {
  /** The hotel booking(s) in this cluster */
  hotels: HotelExtraction[];
  
  /** Check-in date/time (start of stay) */
  startTime: Date;
  
  /** Check-out date/time (end of stay) */
  endTime: Date;
  
  /** Hotel location/address */
  location: string;
  
  /** Hotel name */
  hotelName: string;
}

/**
 * Convert a single hotel extraction to a cluster for matching
 * 
 * @param hotel - The extracted hotel data
 * @returns A hotel cluster ready for segment matching
 */
export function createHotelCluster(hotel: HotelExtraction): HotelCluster {
  // Helper to convert "3:00 PM" to "15:00:00"
  const convertTo24Hour = (time: string): string => {
    if (!time || time === "") return "15:00:00"; // Default check-in time
    
    const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return "15:00:00";
    
    let [_, hours, minutes, period] = match;
    let h = parseInt(hours);
    
    if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    
    return `${h.toString().padStart(2, '0')}:${minutes}:00`;
  };

  const checkInTime = convertTo24Hour(hotel.checkInTime);
  const checkOutTime = convertTo24Hour(hotel.checkOutTime || "11:00 AM");

  return {
    hotels: [hotel],
    startTime: new Date(`${hotel.checkInDate}T${checkInTime}`),
    endTime: new Date(`${hotel.checkOutDate}T${checkOutTime}`),
    location: hotel.address || hotel.hotelName,
    hotelName: hotel.hotelName
  };
}

/**
 * Convert multiple hotel extractions to clusters
 * 
 * @param hotels - Array of extracted hotel data
 * @returns Array of hotel clusters ready for segment matching
 */
export function createHotelClusters(hotels: HotelExtraction[]): HotelCluster[] {
  return hotels.map(hotel => createHotelCluster(hotel));
}

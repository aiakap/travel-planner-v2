/**
 * Car Rental Clustering Utility
 * 
 * Defines types and utilities for grouping car rental reservations
 * for segment matching purposes.
 */

import { CarRentalExtraction } from '@/lib/schemas/car-rental-extraction-schema';

/**
 * A car rental cluster represents a car rental booking
 * that should be matched to a segment.
 */
export interface CarRentalCluster {
  /** The car rental company */
  company: string;
  
  /** Vehicle class/category */
  vehicleClass: string;
  
  /** Pickup location name */
  pickupLocation: string;
  
  /** Pickup date/time */
  pickupDate: Date;
  
  /** Pickup time string */
  pickupTime: string;
  
  /** Return location name */
  returnLocation: string;
  
  /** Return date/time */
  returnDate: Date;
  
  /** Return time string */
  returnTime: string;
  
  /** Whether this is a one-way rental (different pickup/return locations) */
  isOneWay: boolean;
  
  /** Confirmation number */
  confirmationNumber: string;
  
  /** Pickup address for location matching */
  pickupAddress: string;
  
  /** Return address for location matching */
  returnAddress: string;
}

/**
 * Helper to convert "3:00 PM" or "14:00" to "HH:MM:SS" format
 */
function convertTo24Hour(time: string): string {
  if (!time || time === "") return "12:00:00"; // Default time
  
  // Check if already in 24-hour format (HH:MM or HH:MM:SS)
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) {
    const parts = time.split(':');
    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1];
    const seconds = parts[2] || '00';
    return `${hours}:${minutes}:${seconds}`;
  }
  
  // Parse 12-hour format (e.g., "3:00 PM")
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return "12:00:00";
  
  let [_, hours, minutes, period] = match;
  let h = parseInt(hours);
  
  if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (period.toUpperCase() === 'AM' && h === 12) h = 0;
  
  return `${h.toString().padStart(2, '0')}:${minutes}:00`;
}

/**
 * Extract city/region from address for location matching
 */
function extractLocationFromAddress(address: string, locationName: string): string {
  if (!address || address === "") return locationName;
  
  // Try to extract city name from address
  // Common patterns: "City, State", "City-shi", "City, Country"
  const parts = address.split(',');
  if (parts.length >= 2) {
    // Return the first significant part (usually city)
    return parts[0].trim();
  }
  
  // For Japanese addresses with -shi, -ku, etc.
  const japaneseMatch = address.match(/([^,]+)(-shi|-ku|-cho|-machi)/i);
  if (japaneseMatch) {
    return japaneseMatch[1].trim() + japaneseMatch[2];
  }
  
  return locationName;
}

/**
 * Convert a single car rental extraction to a cluster for matching
 * 
 * @param carRental - The extracted car rental data
 * @returns A car rental cluster ready for segment matching
 */
export function createCarRentalCluster(carRental: CarRentalExtraction): CarRentalCluster {
  const pickupTime = convertTo24Hour(carRental.pickupTime);
  const returnTime = convertTo24Hour(carRental.returnTime);
  
  // Determine if one-way rental
  const isOneWay = carRental.pickupLocation !== carRental.returnLocation || 
                   carRental.oneWayCharge > 0;
  
  // Extract location info for matching
  const pickupLocationForMatching = extractLocationFromAddress(
    carRental.pickupAddress, 
    carRental.pickupLocation
  );
  const returnLocationForMatching = extractLocationFromAddress(
    carRental.returnAddress, 
    carRental.returnLocation
  );

  return {
    company: carRental.company,
    vehicleClass: carRental.vehicleClass,
    pickupLocation: pickupLocationForMatching,
    pickupDate: new Date(`${carRental.pickupDate}T${pickupTime}`),
    pickupTime: carRental.pickupTime,
    returnLocation: returnLocationForMatching,
    returnDate: new Date(`${carRental.returnDate}T${returnTime}`),
    returnTime: carRental.returnTime,
    isOneWay,
    confirmationNumber: carRental.confirmationNumber,
    pickupAddress: carRental.pickupAddress,
    returnAddress: carRental.returnAddress
  };
}

/**
 * Convert multiple car rental extractions to clusters
 * 
 * @param carRentals - Array of extracted car rental data
 * @returns Array of car rental clusters ready for segment matching
 */
export function createCarRentalClusters(carRentals: CarRentalExtraction[]): CarRentalCluster[] {
  return carRentals.map(carRental => createCarRentalCluster(carRental));
}

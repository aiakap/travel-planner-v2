"use server";

import { searchPlace } from "./google-places";
import { validateAddress } from "./address-validation";
import { getTimeZoneForLocation } from "./timezone";

export interface ResolvedData {
  source: 'places' | 'address' | 'none';
  name?: string;
  vendor?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  timeZoneId?: string;
  timeZoneName?: string;
  contactPhone?: string;
  website?: string;
  imageUrl?: string;
  confidence: 'high' | 'medium' | 'low';
}

interface ReservationInput {
  name: string;
  vendor?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Detect if a string looks like a business name or an address
 */
function detectType(text: string): 'business' | 'address' {
  const trimmed = text.trim();
  
  // Address indicators (higher priority)
  const addressIndicators = [
    /^\d+\s/,  // Starts with a number (street number)
    /,\s*[A-Z]{2}\s+\d{5}/,  // Contains state and zip code
    /\b(street|st|avenue|ave|boulevard|blvd|road|rd|drive|dr|lane|ln|way|court|ct|circle|cir|place|pl)\b/i,  // Street suffixes
  ];
  
  for (const pattern of addressIndicators) {
    if (pattern.test(trimmed)) {
      return 'address';
    }
  }
  
  // Business indicators
  const businessIndicators = [
    /\b(hotel|inn|resort|lodge|motel)\b/i,
    /\b(restaurant|cafe|bistro|diner|eatery|grill)\b/i,
    /\b(bar|pub|tavern|lounge)\b/i,
    /\b(museum|gallery|theater|theatre|cinema)\b/i,
    /\b(park|garden|zoo|aquarium)\b/i,
    /\b(airport|station|terminal)\b/i,
    /\b(spa|salon|gym|fitness)\b/i,
    /\b(store|shop|market|mall|center|centre)\b/i,
  ];
  
  for (const pattern of businessIndicators) {
    if (pattern.test(trimmed)) {
      return 'business';
    }
  }
  
  // Heuristics for ambiguous cases
  const hasCommaInFirst20 = trimmed.substring(0, 20).includes(',');
  const isShort = trimmed.length < 50;
  const startsWithNumber = /^\d/.test(trimmed);
  
  if (startsWithNumber || hasCommaInFirst20) {
    return 'address';
  }
  
  if (isShort && !hasCommaInFirst20) {
    return 'business';
  }
  
  // Default to business for short strings, address for long ones
  return trimmed.length < 40 ? 'business' : 'address';
}

/**
 * Smart resolution: automatically detect and resolve reservation details
 */
export async function smartResolveReservation(
  reservation: ReservationInput
): Promise<ResolvedData> {
  // Determine what to resolve
  const nameOrVendor = reservation.vendor || reservation.name;
  const location = reservation.location;
  
  // Priority: use vendor/name first, then location as fallback
  const primaryText = nameOrVendor || location;
  
  if (!primaryText) {
    return {
      source: 'none',
      confidence: 'low',
    };
  }
  
  const detectedType = detectType(primaryText);
  
  console.log(`[Smart Resolve] Detected type: ${detectedType} for text: "${primaryText}"`);
  
  try {
    if (detectedType === 'business') {
      // Try Places API
      const placeData = await searchPlace(primaryText, location || undefined);
      
      if (placeData) {
        // Fetch timezone
        let timezone = null;
        if (placeData.geometry?.location) {
          timezone = await getTimeZoneForLocation(
            placeData.geometry.location.lat,
            placeData.geometry.location.lng
          );
        }
        
        return {
          source: 'places',
          name: placeData.name,
          vendor: placeData.name,
          location: placeData.formattedAddress,
          latitude: placeData.geometry?.location.lat,
          longitude: placeData.geometry?.location.lng,
          timeZoneId: timezone?.timeZoneId,
          timeZoneName: timezone?.timeZoneName,
          contactPhone: placeData.phoneNumber,
          website: placeData.website,
          imageUrl: placeData.photos?.[0]?.url,
          confidence: 'high',
        };
      }
      
      // Fallback to address validation if Places fails
      console.log('[Smart Resolve] Places search failed, falling back to address validation');
    }
    
    // Try Address Validation (either primary strategy or fallback)
    const addressToValidate = location || primaryText;
    const validationResult = await validateAddress(addressToValidate);
    
    if (validationResult.isValid && validationResult.location) {
      // Fetch timezone
      let timezone = null;
      timezone = await getTimeZoneForLocation(
        validationResult.location.lat,
        validationResult.location.lng
      );
      
      return {
        source: 'address',
        location: validationResult.formattedAddress,
        latitude: validationResult.location.lat,
        longitude: validationResult.location.lng,
        timeZoneId: timezone?.timeZoneId,
        timeZoneName: timezone?.timeZoneName,
        confidence: validationResult.isComplete ? 'high' : 'medium',
      };
    }
    
    // If both failed, return none
    return {
      source: 'none',
      confidence: 'low',
    };
    
  } catch (error) {
    console.error('[Smart Resolve] Error during resolution:', error);
    return {
      source: 'none',
      confidence: 'low',
    };
  }
}


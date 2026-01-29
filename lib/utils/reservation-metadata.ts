/**
 * Utility functions for type-safe reservation metadata access
 */

import { Reservation } from "@/app/generated/prisma"
import { ReservationMetadata } from "@/lib/reservation-metadata-types"

/**
 * Map reservation category names to metadata keys
 */
const CATEGORY_TO_METADATA_KEY: Record<string, keyof ReservationMetadata> = {
  // Flight
  'flight': 'flight',
  
  // Hotel/Accommodation
  'hotel': 'hotel',
  'accommodation': 'hotel',
  'resort': 'hotel',
  'vacation rental': 'hotel',
  
  // Car Rental
  'car rental': 'carRental',
  
  // Train
  'train': 'train',
  
  // Restaurant/Dining
  'restaurant': 'restaurant',
  'dining': 'restaurant',
  'cafe': 'restaurant',
  'bar': 'restaurant',
  
  // Transport
  'transportation': 'transport',
  'taxi': 'transport',
  'ride share': 'transport',
  'private driver': 'transport',
  
  // Activity
  'activity': 'activity',
  'tour': 'activity',
  'museum': 'activity',
  'excursion': 'activity',
  'hike': 'activity',
  
  // Cruise
  'cruise': 'cruise',
  
  // Bus
  'bus': 'bus',
  
  // Ferry
  'ferry': 'ferry',
  
  // Event
  'event': 'event',
  'event tickets': 'event',
  
  // Parking
  'parking': 'parking',
  
  // Equipment Rental
  'equipment rental': 'equipmentRental',
  
  // Spa
  'spa': 'spa',
  'spa & wellness': 'spa',
  'wellness': 'spa',
}

/**
 * Get the metadata key for a given category name
 */
export function getMetadataKey(categoryName: string): keyof ReservationMetadata {
  const normalized = categoryName.toLowerCase().trim()
  return CATEGORY_TO_METADATA_KEY[normalized] || 'activity'
}

/**
 * Get metadata for a specific reservation type
 * Returns an empty object if no metadata exists
 */
export function getMetadataForType(
  reservation: Reservation | null | undefined,
  categoryName: string
): any {
  if (!reservation?.metadata) return {}
  
  const metadata = reservation.metadata as ReservationMetadata
  const key = getMetadataKey(categoryName)
  
  return metadata[key] || {}
}

/**
 * Update metadata for a specific reservation type
 * Preserves all other metadata types
 */
export function updateMetadataForType(
  currentMetadata: ReservationMetadata | null | undefined,
  categoryName: string,
  newData: any
): ReservationMetadata {
  const metadata = (currentMetadata || {}) as ReservationMetadata
  const key = getMetadataKey(categoryName)
  
  return {
    ...metadata,
    [key]: newData
  }
}

/**
 * Merge new metadata into existing metadata
 * Useful for partial updates
 */
export function mergeMetadataForType(
  currentMetadata: ReservationMetadata | null | undefined,
  categoryName: string,
  updates: Partial<any>
): ReservationMetadata {
  const metadata = (currentMetadata || {}) as ReservationMetadata
  const key = getMetadataKey(categoryName)
  const existing = metadata[key] || {}
  
  return {
    ...metadata,
    [key]: {
      ...existing,
      ...updates
    }
  }
}

/**
 * Clear metadata for a specific type
 */
export function clearMetadataForType(
  currentMetadata: ReservationMetadata | null | undefined,
  categoryName: string
): ReservationMetadata {
  const metadata = (currentMetadata || {}) as ReservationMetadata
  const key = getMetadataKey(categoryName)
  
  const updated = { ...metadata }
  delete updated[key]
  
  return updated
}

/**
 * Check if reservation has any metadata
 */
export function hasAnyMetadata(
  reservation: Reservation | null | undefined
): boolean {
  if (!reservation?.metadata) return false
  
  const metadata = reservation.metadata as ReservationMetadata
  return Object.keys(metadata).length > 0
}

/**
 * Check if reservation has metadata for a specific type
 */
export function hasMetadataForCategory(
  reservation: Reservation | null | undefined,
  categoryName: string
): boolean {
  if (!reservation?.metadata) return false
  
  const metadata = reservation.metadata as ReservationMetadata
  const key = getMetadataKey(categoryName)
  
  return metadata[key] !== undefined && metadata[key] !== null
}

/**
 * Format field name for display (camelCase to Title Case)
 */
export function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim()
}

/**
 * Format field value for display
 */
export function formatFieldValue(value: any): string {
  if (value === null || value === undefined) return 'N/A'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * Get all metadata keys that have data for a reservation
 */
export function getPopulatedMetadataKeys(
  reservation: Reservation | null | undefined
): Array<keyof ReservationMetadata> {
  if (!reservation?.metadata) return []
  
  const metadata = reservation.metadata as ReservationMetadata
  return Object.keys(metadata).filter(key => {
    const value = metadata[key as keyof ReservationMetadata]
    return value !== undefined && value !== null && Object.keys(value).length > 0
  }) as Array<keyof ReservationMetadata>
}

/**
 * Convert metadata key to display name
 */
export function metadataKeyToDisplayName(key: keyof ReservationMetadata): string {
  const displayNames: Record<keyof ReservationMetadata, string> = {
    flight: 'Flight',
    hotel: 'Hotel',
    carRental: 'Car Rental',
    train: 'Train',
    restaurant: 'Restaurant',
    transport: 'Transport',
    activity: 'Activity',
    cruise: 'Cruise',
    bus: 'Bus',
    ferry: 'Ferry',
    event: 'Event',
    parking: 'Parking',
    equipmentRental: 'Equipment Rental',
    spa: 'Spa',
  }
  
  return displayNames[key] || formatFieldName(key)
}

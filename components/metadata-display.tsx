/**
 * Universal Metadata Display Component
 * 
 * Displays reservation metadata as clean, human-readable name-value pairs.
 * Works for all metadata types (flight, hotel, transport, train, etc.)
 */

"use client"

import { ReservationMetadata, getMetadataTypes } from "@/lib/reservation-metadata-types"

interface MetadataDisplayProps {
  metadata: ReservationMetadata | null | undefined
  className?: string
}

/**
 * Convert camelCase to Title Case with spaces
 * e.g., "flightNumber" -> "Flight Number"
 *       "driverPhone" -> "Driver Phone"
 */
function formatFieldName(fieldName: string): string {
  // Handle special abbreviations
  const abbreviations: Record<string, string> = {
    'Id': 'ID',
    'Url': 'URL',
    'Eta': 'ETA',
    'Est': 'Est.',
  }
  
  // Insert space before capital letters and capitalize first letter
  let formatted = fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
  
  // Replace abbreviations
  for (const [abbr, replacement] of Object.entries(abbreviations)) {
    formatted = formatted.replace(new RegExp(`\\b${abbr}\\b`, 'g'), replacement)
  }
  
  return formatted
}

/**
 * Format a value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ')
  }
  
  if (typeof value === 'number') {
    return value.toString()
  }
  
  return String(value)
}

/**
 * Get a human-readable title for metadata type
 */
function getMetadataTypeTitle(type: keyof ReservationMetadata): string {
  const titles: Record<keyof ReservationMetadata, string> = {
    flight: 'Flight Details',
    hotel: 'Hotel Details',
    carRental: 'Car Rental Details',
    train: 'Train Details',
    restaurant: 'Restaurant Details',
    transport: 'Transfer Details',
    activity: 'Activity Details',
    cruise: 'Cruise Details',
    bus: 'Bus Details',
    ferry: 'Ferry Details',
    event: 'Event Details',
    parking: 'Parking Details',
    equipmentRental: 'Equipment Rental Details',
    spa: 'Spa Details',
  }
  return titles[type] || 'Details'
}

/**
 * Render a single metadata section
 */
function MetadataSection({ 
  title, 
  data 
}: { 
  title: string
  data: Record<string, unknown> 
}) {
  // Filter out empty values and convert to entries
  const entries = Object.entries(data)
    .filter(([, value]) => {
      if (value === null || value === undefined || value === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      return true
    })
    .map(([key, value]) => ({
      label: formatFieldName(key),
      value: formatValue(value),
    }))
  
  if (entries.length === 0) {
    return null
  }
  
  return (
    <div className="space-y-2">
      <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
        {title}
      </h4>
      <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
        {entries.map(({ label, value }) => (
          <div key={label} className="flex text-sm">
            <span className="text-slate-500 w-32 flex-shrink-0">{label}</span>
            <span className="text-slate-900 font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Universal metadata display component
 * Automatically renders all populated metadata fields for any reservation type
 */
export function MetadataDisplay({ metadata, className = '' }: MetadataDisplayProps) {
  if (!metadata) {
    return null
  }
  
  const metadataTypes = getMetadataTypes(metadata)
  
  if (metadataTypes.length === 0) {
    return null
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {metadataTypes.map(type => {
        const data = metadata[type]
        if (!data || typeof data !== 'object') return null
        
        return (
          <MetadataSection
            key={type}
            title={getMetadataTypeTitle(type)}
            data={data as Record<string, unknown>}
          />
        )
      })}
    </div>
  )
}

/**
 * Compact version for inline display
 */
export function MetadataDisplayCompact({ metadata, className = '' }: MetadataDisplayProps) {
  if (!metadata) {
    return null
  }
  
  const metadataTypes = getMetadataTypes(metadata)
  
  if (metadataTypes.length === 0) {
    return null
  }
  
  // Flatten all metadata into a single list
  const allEntries: { label: string; value: string }[] = []
  
  for (const type of metadataTypes) {
    const data = metadata[type]
    if (!data || typeof data !== 'object') continue
    
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined || value === '') continue
      if (Array.isArray(value) && value.length === 0) continue
      
      allEntries.push({
        label: formatFieldName(key),
        value: formatValue(value),
      })
    }
  }
  
  if (allEntries.length === 0) {
    return null
  }
  
  return (
    <div className={`grid grid-cols-2 gap-x-4 gap-y-1 text-sm ${className}`}>
      {allEntries.map(({ label, value }) => (
        <div key={label} className="contents">
          <span className="text-slate-500">{label}</span>
          <span className="text-slate-900">{value}</span>
        </div>
      ))}
    </div>
  )
}

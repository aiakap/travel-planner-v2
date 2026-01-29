/**
 * PDF Quick Reference Table Component
 * 
 * Displays all reservations in chronological order with key details
 * and Google Maps links for addresses
 */

import React from 'react'
import { View, Text, Link } from '@react-pdf/renderer'
import { styles } from './styles'
import { format } from 'date-fns'
import type { ViewItinerary, ViewReservation, ViewSegment } from '@/lib/itinerary-view-types'

interface PDFQuickReferenceProps {
  itinerary: ViewItinerary
}

interface FlattenedReservation extends ViewReservation {
  segmentTitle: string
  segmentStartDate: string
}

// Type icons for PDF (text-based since we can't use emojis reliably)
const typeIcons: Record<string, string> = {
  flight: '✈',
  hotel: '🏨',
  activity: '🎯',
  transport: '🚗',
  restaurant: '🍽',
}

function getGoogleMapsUrl(address: string, lat?: number, lng?: number): string {
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

function formatDateTime(reservation: FlattenedReservation): string {
  const parts: string[] = []
  
  if (reservation.startTime) {
    try {
      const start = new Date(reservation.startTime)
      parts.push(format(start, 'MMM d'))
      parts.push(format(start, 'h:mm a'))
    } catch {
      if (reservation.date) {
        parts.push(reservation.date)
      }
      if (reservation.time) {
        parts.push(reservation.time)
      }
    }
  } else {
    if (reservation.date) {
      try {
        parts.push(format(new Date(reservation.date), 'MMM d'))
      } catch {
        parts.push(reservation.date)
      }
    }
    if (reservation.time) {
      parts.push(reservation.time)
    }
  }
  
  return parts.join(' ')
}

function getAddress(reservation: FlattenedReservation): string {
  // For flights, show departure → arrival
  if (reservation.type === 'flight' && reservation.departureLocation && reservation.arrivalLocation) {
    return `${reservation.departureLocation} → ${reservation.arrivalLocation}`
  }
  
  // For other types, use location
  return reservation.location || ''
}

export function PDFQuickReference({ itinerary }: PDFQuickReferenceProps) {
  // Flatten all reservations from all segments
  const allReservations: FlattenedReservation[] = itinerary.segments.flatMap((segment: ViewSegment) =>
    segment.reservations.map((res: ViewReservation) => ({
      ...res,
      segmentTitle: segment.title,
      segmentStartDate: segment.startDate,
    }))
  )
  
  // Sort by date/time
  const sortedReservations = allReservations.sort((a, b) => {
    const dateA = a.startTime ? new Date(a.startTime) : new Date(a.date || a.segmentStartDate)
    const dateB = b.startTime ? new Date(b.startTime) : new Date(b.date || b.segmentStartDate)
    return dateA.getTime() - dateB.getTime()
  })
  
  if (sortedReservations.length === 0) {
    return null
  }
  
  return (
    <View style={styles.table}>
      <Text style={styles.sectionHeader}>Quick Reference</Text>
      
      {/* Table Header */}
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, styles.tableCellType]}>Type</Text>
        <Text style={[styles.tableHeaderCell, styles.tableCellName]}>Name</Text>
        <Text style={[styles.tableHeaderCell, styles.tableCellVendor]}>Category</Text>
        <Text style={[styles.tableHeaderCell, styles.tableCellConf]}>Conf #</Text>
        <Text style={[styles.tableHeaderCell, styles.tableCellDateTime]}>Date/Time</Text>
        <Text style={[styles.tableHeaderCell, styles.tableCellAddress]}>Address</Text>
        <Text style={[styles.tableHeaderCell, styles.tableCellPrice]}>Price</Text>
      </View>
      
      {/* Table Rows */}
      {sortedReservations.map((reservation, index) => {
        const address = getAddress(reservation)
        const hasLocation = address && (reservation.latitude || reservation.longitude || address.length > 0)
        
        return (
          <View key={`${reservation.id}-${index}`} style={styles.tableRow} wrap={false}>
            <Text style={[styles.tableCell, styles.tableCellType]}>
              {typeIcons[reservation.type] || '•'}
            </Text>
            <Text style={[styles.tableCell, styles.tableCellName]}>
              {reservation.title}
            </Text>
            <Text style={[styles.tableCell, styles.tableCellVendor]}>
              {reservation.categoryName || reservation.description}
            </Text>
            <Text style={[styles.tableCell, styles.tableCellConf]}>
              {reservation.confirmationNumber || '—'}
            </Text>
            <Text style={[styles.tableCell, styles.tableCellDateTime]}>
              {formatDateTime(reservation)}
            </Text>
            <View style={[styles.tableCell, styles.tableCellAddress]}>
              {hasLocation && reservation.type !== 'flight' ? (
                <Link 
                  style={styles.link}
                  src={getGoogleMapsUrl(address, reservation.latitude, reservation.longitude)}
                >
                  {address.length > 35 ? address.substring(0, 35) + '...' : address}
                </Link>
              ) : (
                <Text>{address.length > 35 ? address.substring(0, 35) + '...' : address || '—'}</Text>
              )}
            </View>
            <Text style={[styles.tableCell, styles.tableCellPrice]}>
              {reservation.price > 0 ? `$${reservation.price.toFixed(0)}` : '—'}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

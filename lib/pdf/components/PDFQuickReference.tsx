/**
 * PDF Quick Reference Table Component
 * 
 * Displays all reservations in chronological order with key details.
 * Uses wall time fields for accurate local time display.
 * Shows dual currency display (local + USD) using pre-calculated USD values.
 */

import React from 'react'
import { View, Text } from '@react-pdf/renderer'
import { styles } from './styles'
import { formatLocalDate, formatLocalTime } from '@/lib/utils/local-time'
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

/**
 * Format number with thousands separators
 */
function formatNumber(num: number): string {
  return Math.round(num).toLocaleString('en-US')
}

/**
 * Get currency symbol from currency code
 */
function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '¥',
    INR: '₹',
  }
  return symbols[currency] || currency
}

/**
 * Format price for table display with dual currency.
 * Uses pre-calculated priceUSD from API route (dynamic exchange rates).
 * Example: "¥52,000 (~$473)"
 */
function formatCompactPrice(price: number, currency: string | undefined, priceUSD: number | undefined): string {
  if (!price || price <= 0) return '—'
  
  const currencyCode = currency || 'USD'
  
  if (currencyCode === 'USD') {
    return `$${formatNumber(price)}`
  }
  
  // Use pre-calculated USD value (from dynamic exchange rates)
  const usdEquivalent = priceUSD || price
  const symbol = getCurrencySymbol(currencyCode)
  
  return `${symbol}${formatNumber(price)} (~$${formatNumber(usdEquivalent)})`
}

/**
 * Calculate total trip cost in USD using pre-calculated values.
 */
function calculateTripTotalUSD(reservations: FlattenedReservation[]): number {
  return reservations.reduce((total, res) => {
    if (!res.price || res.price <= 0) return total
    // Use pre-calculated USD value, or fall back to price for USD
    const usdAmount = res.priceUSD ?? res.price
    return total + usdAmount
  }, 0)
}

/**
 * Format date/time for display using wall time fields when available.
 * Falls back to startTime (UTC) only if wall time fields are not present.
 */
function formatDateTime(reservation: FlattenedReservation): string {
  const parts: string[] = []
  
  // Prefer wall time fields for accurate local time display
  if (reservation.wallStartDate) {
    parts.push(formatLocalDate(reservation.wallStartDate, 'short'))
    
    if (reservation.wallStartTime) {
      parts.push(formatLocalTime(reservation.wallStartTime, '12h'))
    }
  } else if (reservation.date) {
    // Fallback to date field
    parts.push(formatLocalDate(reservation.date, 'short'))
    
    if (reservation.time && reservation.time !== '00:00') {
      parts.push(formatLocalTime(reservation.time, '12h'))
    }
  }
  
  return parts.join(' ')
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
  
  // Sort by date/time - prefer wall dates for accurate sorting
  const sortedReservations = allReservations.sort((a, b) => {
    // Use wall dates if available, otherwise fall back to startTime or date
    const getDateStr = (res: FlattenedReservation) => {
      if (res.wallStartDate) {
        // Combine wall date and time for precise sorting
        const time = res.wallStartTime || '00:00'
        return `${res.wallStartDate}T${time}`
      }
      if (res.startTime) {
        return res.startTime
      }
      return res.date || res.segmentStartDate
    }
    
    const dateA = new Date(getDateStr(a))
    const dateB = new Date(getDateStr(b))
    return dateA.getTime() - dateB.getTime()
  })
  
  if (sortedReservations.length === 0) {
    return null
  }
  
  // Calculate trip total in USD
  const tripTotalUSD = calculateTripTotalUSD(sortedReservations)
  
  return (
    <View style={styles.table}>
      <Text style={styles.sectionHeader}>Quick Reference</Text>
      
      {/* Table Header - Address column removed, widths redistributed */}
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, styles.tableCellType]}>Type</Text>
        <Text style={[styles.tableHeaderCell, styles.tableCellNameWide]}>Name</Text>
        <Text style={[styles.tableHeaderCell, styles.tableCellVendorWide]}>Category</Text>
        <Text style={[styles.tableHeaderCell, styles.tableCellConfWide]}>Conf #</Text>
        <Text style={[styles.tableHeaderCell, styles.tableCellDateTimeWide]}>Date/Time</Text>
        <Text style={[styles.tableHeaderCell, styles.tableCellPriceWide]}>Price</Text>
      </View>
      
      {/* Table Rows - Address column removed */}
      {sortedReservations.map((reservation, index) => (
        <View key={`${reservation.id}-${index}`} style={styles.tableRow} wrap={false}>
          <Text style={[styles.tableCell, styles.tableCellType]}>
            {typeIcons[reservation.type] || '•'}
          </Text>
          <Text style={[styles.tableCell, styles.tableCellNameWide]}>
            {reservation.title}
          </Text>
          <Text style={[styles.tableCell, styles.tableCellVendorWide]}>
            {reservation.categoryName || reservation.description}
          </Text>
          <Text style={[styles.tableCell, styles.tableCellConfWide]}>
            {reservation.confirmationNumber || '—'}
          </Text>
          <Text style={[styles.tableCell, styles.tableCellDateTimeWide]}>
            {formatDateTime(reservation)}
          </Text>
          <Text style={[styles.tableCell, styles.tableCellPriceWide]}>
            {formatCompactPrice(reservation.price, reservation.currency, reservation.priceUSD)}
          </Text>
        </View>
      ))}
      
      {/* Trip Total Row - with thousands separators */}
      {tripTotalUSD > 0 && (
        <View style={styles.tableTotalRow}>
          <Text style={[styles.tableCell, styles.tableCellType]}></Text>
          <Text style={[styles.tableCell, styles.tableCellNameWide]}></Text>
          <Text style={[styles.tableCell, styles.tableCellVendorWide]}></Text>
          <Text style={[styles.tableCell, styles.tableCellConfWide]}></Text>
          <Text style={[styles.tableTotalLabel, styles.tableCellDateTimeWide]}>Trip Total (USD):</Text>
          <Text style={[styles.tableTotalValue, styles.tableCellPriceWide]}>
            ${formatNumber(tripTotalUSD)}
          </Text>
        </View>
      )}
    </View>
  )
}

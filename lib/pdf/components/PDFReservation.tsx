/**
 * PDF Reservation Component
 * 
 * Displays a single reservation with all its details
 * Uses wall time fields for accurate local time display
 * Shows dual currency (foreign + USD equivalent) using pre-calculated USD values
 */

import React from 'react'
import { View, Text, Image } from '@react-pdf/renderer'
import { styles } from './styles'
import { formatLocalDate, formatLocalTime } from '@/lib/utils/local-time'
import type { ViewReservation } from '@/lib/itinerary-view-types'

interface PDFReservationProps {
  reservation: ViewReservation
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
 * Format price with dual currency display when not USD.
 * Uses pre-calculated priceUSD from API route (dynamic exchange rates).
 * Shows: "€150 (~$165 USD)" for foreign currencies
 * Shows: "$150" for USD
 */
function formatPriceDisplay(price: number, currency: string | undefined, priceUSD: number | undefined): string {
  if (!price || price <= 0) return ''
  
  const currencyCode = currency || 'USD'
  
  if (currencyCode === 'USD') {
    return `$${price.toFixed(2)}`
  }
  
  // For foreign currencies, show original + USD equivalent (using pre-calculated value)
  const symbol = getCurrencySymbol(currencyCode)
  const usdEquivalent = priceUSD || price
  
  return `${symbol}${price.toFixed(2)} (~$${usdEquivalent.toFixed(2)} USD)`
}

export function PDFReservation({ reservation }: PDFReservationProps) {
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      flight: '#3b82f6',
      hotel: '#8b5cf6',
      activity: '#10b981',
      transport: '#f59e0b',
      restaurant: '#ef4444',
    }
    return colors[type] || '#6b7280'
  }
  
  const typeStyle = {
    ...styles.reservationType,
    backgroundColor: getTypeColor(reservation.type),
  }
  
  // Format date using wall time if available, fallback to date field
  const formatDate = () => {
    if (reservation.wallStartDate) {
      return formatLocalDate(reservation.wallStartDate, 'long')
    }
    if (reservation.date) {
      return formatLocalDate(reservation.date, 'long')
    }
    return null
  }
  
  // Format time using wall time if available
  const formatTime = () => {
    if (reservation.wallStartTime) {
      return formatLocalTime(reservation.wallStartTime, '12h')
    }
    if (reservation.time && reservation.time !== '00:00') {
      return formatLocalTime(reservation.time, '12h')
    }
    return null
  }
  
  // Format time range using wall times if available
  const formatTimeRange = () => {
    if (reservation.wallStartTime && reservation.wallEndTime) {
      const startTime = formatLocalTime(reservation.wallStartTime, '12h')
      const endTime = formatLocalTime(reservation.wallEndTime, '12h')
      return `${startTime} - ${endTime}`
    }
    return null
  }
  
  const formattedDate = formatDate()
  const formattedTime = formatTime()
  const formattedTimeRange = formatTimeRange()
  
  // Check if reservation has a valid image URL
  const hasImage = reservation.image && reservation.image.length > 0
  
  // Render the details section (used with or without image)
  const renderDetails = () => (
    <View style={hasImage ? styles.reservationDetailsWithImage : undefined}>
      <View style={styles.reservationHeader}>
        <Text style={styles.reservationTitle}>{reservation.title}</Text>
        <Text style={typeStyle}>{reservation.categoryName}</Text>
      </View>
      
      {reservation.description && (
        <Text style={styles.reservationDetail}>{reservation.description}</Text>
      )}
      
      {formattedDate && (
        <Text style={styles.reservationDetail}>
          Date: {formattedDate}
        </Text>
      )}
      
      {formattedTimeRange ? (
        <Text style={styles.reservationDetail}>
          Time: {formattedTimeRange}
        </Text>
      ) : formattedTime ? (
        <Text style={styles.reservationDetail}>Time: {formattedTime}</Text>
      ) : null}
      
      {reservation.location && (
        <Text style={styles.reservationDetail}>Location: {reservation.location}</Text>
      )}
      
      {reservation.departureLocation && reservation.arrivalLocation && (
        <Text style={styles.reservationDetail}>
          {reservation.departureLocation} → {reservation.arrivalLocation}
        </Text>
      )}
      
      {reservation.confirmationNumber && (
        <Text style={styles.reservationDetail}>
          Confirmation: {reservation.confirmationNumber}
        </Text>
      )}
      
      {reservation.price > 0 && (
        <Text style={styles.reservationDetail}>
          Price: {formatPriceDisplay(reservation.price, reservation.currency, reservation.priceUSD)}
        </Text>
      )}
      
      {reservation.status && reservation.status !== 'confirmed' && (
        <Text style={styles.reservationDetail}>
          Status: {reservation.statusName}
        </Text>
      )}
      
      {reservation.notes && (
        <Text style={styles.reservationNotes}>{reservation.notes}</Text>
      )}
    </View>
  )
  
  // If there's an image, use horizontal layout
  if (hasImage) {
    return (
      <View style={styles.reservation}>
        <View style={styles.reservationWithImage}>
          <Image src={reservation.image} style={styles.reservationImage} />
          {renderDetails()}
        </View>
      </View>
    )
  }
  
  // Standard layout without image
  return (
    <View style={styles.reservation}>
      {renderDetails()}
    </View>
  )
}

/**
 * PDF Reservation Component
 * 
 * Displays a single reservation with all its details
 */

import React from 'react'
import { View, Text } from '@react-pdf/renderer'
import { styles } from './styles'
import { format } from 'date-fns'
import type { ViewReservation } from '@/lib/itinerary-view-types'

interface PDFReservationProps {
  reservation: ViewReservation
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
  
  return (
    <View style={styles.reservation}>
      <View style={styles.reservationHeader}>
        <Text style={styles.reservationTitle}>{reservation.title}</Text>
        <Text style={typeStyle}>{reservation.categoryName}</Text>
      </View>
      
      {reservation.description && (
        <Text style={styles.reservationDetail}>{reservation.description}</Text>
      )}
      
      {reservation.date && (
        <Text style={styles.reservationDetail}>
          Date: {format(new Date(reservation.date), 'MMM d, yyyy')}
        </Text>
      )}
      
      {reservation.time && (
        <Text style={styles.reservationDetail}>Time: {reservation.time}</Text>
      )}
      
      {reservation.startTime && reservation.endTime && (
        <Text style={styles.reservationDetail}>
          {format(new Date(reservation.startTime), 'h:mm a')} - {format(new Date(reservation.endTime), 'h:mm a')}
        </Text>
      )}
      
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
          Price: ${reservation.price.toFixed(2)}
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
}

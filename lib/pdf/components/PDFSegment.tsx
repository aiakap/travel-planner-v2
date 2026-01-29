/**
 * PDF Segment Component
 * 
 * Displays a trip segment with its reservations
 */

import React from 'react'
import { View, Text } from '@react-pdf/renderer'
import { styles } from './styles'
import { format } from 'date-fns'
import type { ViewSegment } from '@/lib/itinerary-view-types'
import { PDFReservation } from './PDFReservation'

interface PDFSegmentProps {
  segment: ViewSegment
  segmentNumber: number
}

export function PDFSegment({ segment, segmentNumber }: PDFSegmentProps) {
  const formattedStartDate = format(new Date(segment.startDate), 'MMM d, yyyy')
  const formattedEndDate = format(new Date(segment.endDate), 'MMM d, yyyy')
  
  return (
    <View style={styles.segment} wrap={false}>
      <Text style={styles.segmentTitle}>
        Segment {segmentNumber}: {segment.title}
      </Text>
      
      <Text style={styles.segmentInfo}>
        {formattedStartDate} - {formattedEndDate}
      </Text>
      
      <Text style={styles.segmentInfo}>
        {segment.startTitle} → {segment.endTitle}
      </Text>
      
      {segment.segmentType && (
        <Text style={styles.segmentInfo}>
          Type: {segment.segmentType}
        </Text>
      )}
      
      <View style={styles.spacer} />
      
      {segment.reservations.length > 0 ? (
        segment.reservations.map((reservation) => (
          <PDFReservation
            key={reservation.id}
            reservation={reservation}
          />
        ))
      ) : (
        <Text style={styles.reservationDetail}>
          No reservations for this segment
        </Text>
      )}
    </View>
  )
}

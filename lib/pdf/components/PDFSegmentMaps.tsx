/**
 * PDF Segment Maps Component
 * 
 * Renders maps for a segment at the end of the PDF:
 * - One map per transport reservation (different departure/arrival locations)
 * - One combined map for all stationary reservations (hotels, activities, restaurants)
 * Each map includes a legend below it.
 */

import React from 'react'
import { View, Text, Image } from '@react-pdf/renderer'
import { styles } from './styles'
import { generateTripMapUrl, generateMultiMarkerMapUrl } from '@/lib/static-map-utils'
import { formatLocalDate, formatLocalTime } from '@/lib/utils/local-time'
import type { ViewSegment, ViewReservation } from '@/lib/itinerary-view-types'

interface PDFSegmentMapsProps {
  segment: ViewSegment
  segmentNumber: number
}

/**
 * Check if a reservation is a transport (has different departure and arrival locations)
 */
function isTransportReservation(reservation: ViewReservation): boolean {
  // Check if it has both departure and arrival locations that are different
  if (reservation.departureLocation && reservation.arrivalLocation) {
    return reservation.departureLocation !== reservation.arrivalLocation
  }
  return false
}

/**
 * Generate a route map URL for a transport reservation
 */
function generateTransportMapUrl(
  departureLat: number,
  departureLng: number,
  arrivalLat: number,
  arrivalLng: number,
  width: number = 500,
  height: number = 200
): string {
  return generateTripMapUrl(
    [{ startLat: departureLat, startLng: departureLng, endLat: arrivalLat, endLng: arrivalLng }],
    width,
    height
  )
}

/**
 * Format date/time for display
 */
function formatDateTime(reservation: ViewReservation): string {
  const parts: string[] = []
  
  if (reservation.wallStartDate) {
    parts.push(formatLocalDate(reservation.wallStartDate, 'short'))
    if (reservation.wallStartTime) {
      parts.push(formatLocalTime(reservation.wallStartTime, '12h'))
    }
  } else if (reservation.date) {
    parts.push(formatLocalDate(reservation.date, 'short'))
  }
  
  return parts.join(' ')
}

export function PDFSegmentMaps({ segment, segmentNumber }: PDFSegmentMapsProps) {
  // Separate transport reservations from stationary ones
  const transportReservations = segment.reservations.filter(isTransportReservation)
  const stationaryReservations = segment.reservations.filter(res => !isTransportReservation(res))
  
  // Filter stationary reservations that have valid coordinates
  const stationaryWithCoords = stationaryReservations.filter(
    res => res.latitude && res.longitude
  )
  
  // If no maps to show, return null
  if (transportReservations.length === 0 && stationaryWithCoords.length === 0) {
    return null
  }
  
  return (
    <View style={styles.segmentMapsContainer}>
      <Text style={styles.segmentMapsTitle}>
        Segment {segmentNumber}: {segment.title}
      </Text>
      <Text style={styles.segmentMapsSubtitle}>
        {segment.startTitle} → {segment.endTitle}
      </Text>
      
      {/* Transport Maps - one per transport reservation */}
      {transportReservations.map((reservation, index) => {
        // Try to get coordinates for departure and arrival
        // For flights/transports, we may need to use the metadata or segment coordinates
        const departureLat = reservation.latitude || segment.startLat
        const departureLng = reservation.longitude || segment.startLng
        const arrivalLat = segment.endLat
        const arrivalLng = segment.endLng
        
        // Skip if we don't have valid coordinates
        if (!departureLat || !departureLng || !arrivalLat || !arrivalLng) {
          return null
        }
        
        const mapUrl = generateTransportMapUrl(
          departureLat,
          departureLng,
          arrivalLat,
          arrivalLng
        )
        
        return (
          <View key={reservation.id} style={styles.transportMapCard}>
            <Image src={mapUrl} style={styles.segmentMapImage} />
            <View style={styles.transportMapLegend}>
              <Text style={styles.transportMapTitle}>{reservation.title}</Text>
              <View style={styles.transportMapRoute}>
                <View style={styles.transportMapPoint}>
                  <Text style={styles.transportMapMarker}>A</Text>
                  <View>
                    <Text style={styles.transportMapLocation}>
                      {reservation.departureLocation}
                    </Text>
                    <Text style={styles.transportMapTime}>
                      {formatDateTime(reservation)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.transportMapArrow}>→</Text>
                <View style={styles.transportMapPoint}>
                  <Text style={styles.transportMapMarkerEnd}>B</Text>
                  <View>
                    <Text style={styles.transportMapLocation}>
                      {reservation.arrivalLocation}
                    </Text>
                    {reservation.wallEndTime && (
                      <Text style={styles.transportMapTime}>
                        {formatLocalTime(reservation.wallEndTime, '12h')}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
              {reservation.confirmationNumber && (
                <Text style={styles.transportMapConf}>
                  Confirmation: {reservation.confirmationNumber}
                </Text>
              )}
            </View>
          </View>
        )
      })}
      
      {/* Locations Map - combined map for stationary reservations */}
      {stationaryWithCoords.length > 0 && (
        <View style={styles.locationsMapCard}>
          <Image
            src={generateMultiMarkerMapUrl(
              stationaryWithCoords.map((res, idx) => ({
                lat: res.latitude!,
                lng: res.longitude!,
                label: (idx + 1).toString(),
                color: 'blue',
              })),
              500,
              220
            )}
            style={styles.segmentMapImage}
          />
          <View style={styles.locationsMapLegend}>
            <Text style={styles.locationsMapTitle}>Locations</Text>
            {stationaryWithCoords.map((reservation, index) => (
              <View key={reservation.id} style={styles.locationsMapItem}>
                <Text style={styles.locationsMapMarker}>{index + 1}</Text>
                <View style={styles.locationsMapDetails}>
                  <Text style={styles.locationsMapName}>{reservation.title}</Text>
                  <Text style={styles.locationsMapAddress}>
                    {reservation.location || reservation.categoryName}
                  </Text>
                  {reservation.wallStartDate && (
                    <Text style={styles.locationsMapTime}>
                      {formatDateTime(reservation)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

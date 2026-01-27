"use client"

import type { ViewSegment, ViewReservation } from "@/lib/itinerary-view-types"

export interface ChatContext {
  tripId: string
  segmentId?: string
  reservationId?: string
  action: 'view' | 'edit' | 'chat'
  source: 'timeline' | 'calendar' | 'map' | 'overview'
}

/**
 * Build a chat URL with context for segments or reservations
 */
export function buildChatUrl(context: ChatContext): string {
  const params = new URLSearchParams({
    tripId: context.tripId,
    source: context.source,
  })
  
  if (context.segmentId) {
    params.set('segmentId', context.segmentId)
  }
  
  if (context.reservationId) {
    params.set('reservationId', context.reservationId)
  }
  
  if (context.action) {
    params.set('action', context.action)
  }
  
  return `/exp?${params.toString()}`
}

/**
 * Navigate to chat about a segment
 */
export function chatAboutSegment(
  tripId: string,
  segment: ViewSegment,
  source: ChatContext['source']
) {
  const url = buildChatUrl({
    tripId,
    segmentId: segment.id,
    action: 'chat',
    source,
  })
  
  window.location.href = url
}

/**
 * Navigate to chat about a reservation
 */
export function chatAboutReservation(
  tripId: string,
  reservation: ViewReservation,
  segmentId: string,
  source: ChatContext['source']
) {
  const url = buildChatUrl({
    tripId,
    segmentId,
    reservationId: reservation.id,
    action: 'chat',
    source,
  })
  
  window.location.href = url
}

/**
 * Navigate to edit a segment
 */
export function editSegment(
  tripId: string,
  segmentId: string,
  source: ChatContext['source']
) {
  const url = buildChatUrl({
    tripId,
    segmentId,
    action: 'edit',
    source,
  })
  
  window.location.href = url
}

/**
 * Navigate to edit a reservation
 */
export function editReservation(
  tripId: string,
  reservationId: string,
  segmentId: string,
  source: ChatContext['source']
) {
  const url = buildChatUrl({
    tripId,
    segmentId,
    reservationId,
    action: 'edit',
    source,
  })
  
  window.location.href = url
}

/**
 * Navigate to view trip in chat interface
 */
export function viewTripInChat(tripId: string, source: ChatContext['source']) {
  const url = buildChatUrl({
    tripId,
    action: 'view',
    source,
  })
  
  window.location.href = url
}

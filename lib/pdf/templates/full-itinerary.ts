/**
 * Full Itinerary PDF Template
 * 
 * Complete trip data including all segments, reservations, and intelligence
 * sections (if available). This template matches the /view1 page layout.
 */

import type { PDFTemplate } from './types'

export const fullItineraryTemplate: PDFTemplate = {
  id: 'full-itinerary',
  name: 'Full Itinerary',
  description: 'Complete trip details with all segments, reservations, and AI-powered insights',
  includeIntelligence: true,
  sections: {
    journey: true,
    weather: true,
    packing: true,
    currency: true,
    emergency: true,
    cultural: true,
    activities: true,
    dining: true,
    language: true,
    documents: true,
  },
}

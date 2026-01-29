'use server'

import { prisma } from '@/lib/prisma'

/**
 * Batch fetch all intelligence data for a trip.
 * This is called server-side when the page loads to pre-populate the cache.
 */
export async function batchFetchIntelligence(tripId: string) {
  try {
    // Fetch the TripIntelligence record with all related data in a single query
    const intelligence = await prisma.tripIntelligence.findUnique({
      where: { tripId },
      include: {
        currencyAdvice: true,
        emergencyInfo: true,
        culturalEvents: true,
        activitySuggestions: true,
        diningRecommendations: true,
        packingList: true,
      },
    })

    if (!intelligence) {
      return {
        currency: null,
        emergency: null,
        cultural: null,
        activities: null,
        dining: null,
        language: null, // Language is not persisted in DB
        packing: null,
      }
    }

    // Transform data into the format expected by the views
    return {
      currency: intelligence.hasCurrencyAdvice && intelligence.currencyAdvice.length > 0
        ? { advice: intelligence.currencyAdvice }
        : null,
      emergency: intelligence.hasEmergencyInfo && intelligence.emergencyInfo.length > 0
        ? { info: intelligence.emergencyInfo }
        : null,
      cultural: intelligence.hasCulturalCalendar && intelligence.culturalEvents.length > 0
        ? { events: intelligence.culturalEvents }
        : null,
      activities: intelligence.hasActivitySuggestions && intelligence.activitySuggestions.length > 0
        ? { suggestions: intelligence.activitySuggestions }
        : null,
      dining: intelligence.hasDiningRecommendations && intelligence.diningRecommendations.length > 0
        ? { recommendations: intelligence.diningRecommendations }
        : null,
      language: null, // Language guides are not persisted to DB currently
      packing: intelligence.hasPackingList && intelligence.packingList.length > 0
        ? { items: intelligence.packingList }
        : null,
    }
  } catch (error) {
    console.error('Error batch fetching intelligence:', error)
    return {
      currency: null,
      emergency: null,
      cultural: null,
      activities: null,
      dining: null,
      language: null,
      packing: null,
    }
  }
}

/**
 * Type for the intelligence cache
 */
export interface IntelligenceCache {
  currency?: { advice: any[] } | null
  emergency?: { info: any[] } | null
  cultural?: { events: any[] } | null
  activities?: { suggestions: any[] } | null
  dining?: { recommendations: any[] } | null
  language?: { guides: any[] } | null
  packing?: { items: any[] } | null
}

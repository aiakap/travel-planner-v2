'use server'

import { prisma } from '@/lib/prisma'

/**
 * Batch fetch all intelligence data for a trip.
 * This is called server-side when the page loads to pre-populate the cache.
 */
export async function batchFetchIntelligence(tripId: string) {
  try {
    // Fetch the TripIntelligence record with all related data in a single query
    const [intelligence, weatherCache] = await Promise.all([
      prisma.tripIntelligence.findUnique({
        where: { tripId },
        include: {
          currencyAdvice: true,
          emergencyInfo: true,
          culturalEvents: true,
          activitySuggestions: true,
          diningRecommendations: true,
          packingList: true,
          languageGuides: {
            include: {
              scenarios: {
                include: {
                  phrases: true,
                  verbs: true,
                },
              },
            },
          },
          visaRequirements: true,
        },
      }),
      // Fetch weather cache - only if not expired (1 hour TTL)
      prisma.tripWeatherCache.findMany({
        where: {
          tripId,
          expiresAt: { gt: new Date() },
        },
      }),
    ])

    if (!intelligence) {
      return {
        currency: null,
        emergency: null,
        cultural: null,
        activities: null,
        dining: null,
        language: null,
        packing: null,
        documents: null,
        weather: weatherCache.length > 0 ? { locations: weatherCache } : null,
      }
    }

    // Transform language guides to match the format expected by language-view
    const transformedLanguageGuides = intelligence.languageGuides.map(guide => ({
      id: guide.id,
      targetLanguage: guide.targetLanguage,
      targetLanguageCode: guide.targetLanguageCode,
      userProficiency: guide.userProficiency,
      destinations: guide.destinations,
      scenarios: guide.scenarios.map(scenario => ({
        id: scenario.id,
        scenario: scenario.scenario,
        relevanceScore: scenario.relevanceScore,
        reasoning: scenario.reasoning,
        phrases: scenario.phrases.map(phrase => ({
          phrase: phrase.phrase,
          translation: phrase.translation,
          romanization: phrase.romanization,
          reasoning: phrase.reasoning,
        })),
        verbs: scenario.verbs.map(verb => ({
          verb: verb.verb,
          conjugation: verb.conjugation,
          usage: verb.usage,
        })),
      })),
    }))

    // Transform visa requirements to match the format expected by documents-view
    const transformedVisaRequirements = intelligence.visaRequirements.map(visa => ({
      destination: visa.destination,
      country: visa.country,
      visaRequired: visa.visaRequired,
      visaType: visa.visaType,
      duration: visa.duration,
      advanceRegistration: visa.advanceRegistration,
      requirements: visa.requirements,
      processingTime: visa.processingTime,
      cost: visa.cost,
      sources: visa.sources,
      importantNotes: visa.importantNotes,
      lastChecked: visa.createdAt,
    }))

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
      language: intelligence.hasLanguageGuides && transformedLanguageGuides.length > 0
        ? { guides: transformedLanguageGuides }
        : null,
      packing: intelligence.hasPackingList && intelligence.packingList.length > 0
        ? { items: intelligence.packingList }
        : null,
      documents: intelligence.hasVisaRequirements && transformedVisaRequirements.length > 0
        ? { results: transformedVisaRequirements }
        : null,
      weather: weatherCache.length > 0 
        ? { locations: weatherCache }
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
      documents: null,
      weather: null,
    }
  }
}

/**
 * Save weather data to cache with 1-hour TTL
 */
export async function saveWeatherCache(
  tripId: string,
  locationKey: string,
  weatherData: any
) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now

  try {
    await prisma.tripWeatherCache.upsert({
      where: {
        tripId_locationKey: { tripId, locationKey },
      },
      create: {
        tripId,
        locationKey,
        weatherData,
        fetchedAt: now,
        expiresAt,
      },
      update: {
        weatherData,
        fetchedAt: now,
        expiresAt,
      },
    })
    return true
  } catch (error) {
    console.error('Error saving weather cache:', error)
    return false
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
  documents?: { results: any[] } | null
  weather?: { locations: any[] } | null
}

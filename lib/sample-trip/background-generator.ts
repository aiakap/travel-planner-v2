/**
 * Background Trip Generator
 * 
 * Handles progressive generation of AI sample trips to avoid timeouts.
 * Creates the trip first, then populates it step by step.
 */

import { prisma } from '@/lib/prisma';
import { generateSampleItinerary, type AIGeneratedItinerary } from '@/lib/ai/generate-sample-itinerary';
import { 
  loadDatabaseCache, 
  createTrip, 
  createSegment, 
  createReservation,
  updateTripProgress,
  type DatabaseCache,
  type TripCreationData,
  type SegmentCreationData,
} from '@/lib/seed-data/trip-creation-utils';
import {
  fetchFlightReservation,
  fetchHotelReservation,
  fetchRestaurantReservation,
  fetchActivityReservation,
} from './fetch-real-data';
import type { AITripSuggestion } from '@/lib/ai/generate-trip-suggestions';
import type { ProfileGraphItem } from '@/lib/types/profile-graph';
import type { AnyReservation } from '@/lib/seed-data/trip-templates';

// ============================================================================
// TYPES
// ============================================================================

export interface GenerationParams {
  userId: string;
  suggestion: AITripSuggestion;
  profileItems: ProfileGraphItem[];
  userProfile: {
    name: string;
    city: string | null;
    country: string | null;
    dateOfBirth: Date | null;
  };
  homeAirport?: string;
  startDate?: string;
}

export interface GenerationProgress {
  step: string;
  completed: string[];
  failed: string[];
  percentComplete: number;
}

export interface GenerationResult {
  tripId: string;
  success: boolean;
  error?: string;
}

// Progress steps with their weight
const PROGRESS_STEPS = {
  itinerary: { weight: 20, label: 'Generating itinerary' },
  flights: { weight: 20, label: 'Searching for flights' },
  hotels: { weight: 20, label: 'Finding hotels' },
  restaurants: { weight: 20, label: 'Discovering restaurants' },
  activities: { weight: 20, label: 'Selecting activities' },
};

// ============================================================================
// MAIN GENERATOR
// ============================================================================

/**
 * Generate a sample trip in the background with progressive updates
 */
export async function generateTripInBackground(
  tripId: string,
  params: GenerationParams
): Promise<void> {
  let cache: DatabaseCache | null = null;
  
  try {
    console.log(`🚀 Starting background generation for trip ${tripId}`);
    
    // Load database cache
    cache = await loadDatabaseCache();
    
    // Step 1: Generate AI itinerary
    await updateTripProgress(tripId, 'itinerary', 'in_progress');
    const itinerary = await generateSampleItinerary({
      suggestion: params.suggestion,
      profileItems: params.profileItems,
      userProfile: params.userProfile,
      startDate: params.startDate,
    });
    
    // Update trip with the AI-generated data
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        title: itinerary.title,
        description: itinerary.description,
        startDate: new Date(itinerary.startDate),
        endDate: new Date(itinerary.endDate),
        suggestionSummary: itinerary.tripExplanation.summary,
        suggestionParameters: itinerary.tripExplanation.parameters,
        profileReferences: itinerary.tripExplanation.profileReferences,
      },
    });
    
    // Create segments
    const segmentIds: string[] = [];
    for (let i = 0; i < itinerary.segments.length; i++) {
      const segmentData = itinerary.segments[i];
      const segment = await createSegment(
        prisma,
        tripId,
        {
          name: segmentData.name,
          startLocation: segmentData.startLocation,
          endLocation: segmentData.endLocation,
          startTime: segmentData.startTime,
          endTime: segmentData.endTime,
          type: segmentData.type,
          suggestionReason: segmentData.segmentExplanation.reason,
          profileReferences: segmentData.segmentExplanation.profileReferences,
        },
        cache,
        i
      );
      segmentIds.push(segment.id);
    }
    
    await updateTripProgress(tripId, 'itinerary', 'complete');
    console.log(`✅ Itinerary created with ${segmentIds.length} segments`);
    
    // Step 2: Fetch and create flights
    await updateTripProgress(tripId, 'flights', 'in_progress');
    await createFlightReservations(tripId, itinerary, segmentIds, params, cache);
    await updateTripProgress(tripId, 'flights', 'complete');
    console.log('✅ Flights processed');
    
    // Step 3: Fetch and create hotels
    await updateTripProgress(tripId, 'hotels', 'in_progress');
    await createHotelReservations(tripId, itinerary, segmentIds, cache);
    await updateTripProgress(tripId, 'hotels', 'complete');
    console.log('✅ Hotels processed');
    
    // Step 4: Fetch and create restaurants
    await updateTripProgress(tripId, 'restaurants', 'in_progress');
    await createRestaurantReservations(tripId, itinerary, segmentIds, cache);
    await updateTripProgress(tripId, 'restaurants', 'complete');
    console.log('✅ Restaurants processed');
    
    // Step 5: Fetch and create activities
    await updateTripProgress(tripId, 'activities', 'in_progress');
    await createActivityReservations(tripId, itinerary, segmentIds, cache);
    await updateTripProgress(tripId, 'activities', 'complete');
    console.log('✅ Activities processed');
    
    // Mark as complete
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'DRAFT',
        generationProgress: {
          step: 'complete',
          completed: Object.keys(PROGRESS_STEPS),
          failed: [],
        },
      },
    });
    
    console.log(`🎉 Trip ${tripId} generation complete!`);
    
  } catch (error: any) {
    console.error(`❌ Error generating trip ${tripId}:`, error);
    
    // Mark as failed but keep the trip
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'DRAFT',
        generationError: error.message || 'Unknown error during generation',
      },
    });
  }
}

// ============================================================================
// RESERVATION CREATORS
// ============================================================================

async function createFlightReservations(
  tripId: string,
  itinerary: AIGeneratedItinerary,
  segmentIds: string[],
  params: GenerationParams,
  cache: DatabaseCache
): Promise<void> {
  for (let i = 0; i < itinerary.segments.length; i++) {
    const segment = itinerary.segments[i];
    if (!segment.flightSearch) continue;
    
    const segmentId = segmentIds[i];
    const result = await fetchFlightReservation(
      segment.flightSearch,
      params.homeAirport
    );
    
    if (result) {
      await createReservation(prisma, {
        segmentId,
        template: result.reservation as AnyReservation,
        cache,
        sampleData: {
          isSample: true,
          suggestionReason: result.suggestionReason,
          profileReferences: result.profileReferences,
        },
      });
    }
  }
}

async function createHotelReservations(
  tripId: string,
  itinerary: AIGeneratedItinerary,
  segmentIds: string[],
  cache: DatabaseCache
): Promise<void> {
  for (let i = 0; i < itinerary.segments.length; i++) {
    const segment = itinerary.segments[i];
    if (!segment.hotelSearch) continue;
    
    const segmentId = segmentIds[i];
    const result = await fetchHotelReservation(
      segment.hotelSearch,
      {
        lat: segment.endLocation.lat,
        lng: segment.endLocation.lng,
      }
    );
    
    if (result) {
      await createReservation(prisma, {
        segmentId,
        template: result.reservation as AnyReservation,
        cache,
        sampleData: {
          isSample: true,
          suggestionReason: result.suggestionReason,
          profileReferences: result.profileReferences,
        },
      });
    }
  }
}

async function createRestaurantReservations(
  tripId: string,
  itinerary: AIGeneratedItinerary,
  segmentIds: string[],
  cache: DatabaseCache
): Promise<void> {
  for (let i = 0; i < itinerary.segments.length; i++) {
    const segment = itinerary.segments[i];
    const segmentId = segmentIds[i];
    
    // Process restaurants in parallel (limited concurrency)
    const promises = segment.restaurantSearches.map(async (search) => {
      const result = await fetchRestaurantReservation(search, {
        lat: segment.endLocation.lat,
        lng: segment.endLocation.lng,
      });
      
      if (result) {
        await createReservation(prisma, {
          segmentId,
          template: result.reservation as AnyReservation,
          cache,
          sampleData: {
            isSample: true,
            suggestionReason: result.suggestionReason,
            profileReferences: result.profileReferences,
          },
        });
      }
    });
    
    await Promise.all(promises);
  }
}

async function createActivityReservations(
  tripId: string,
  itinerary: AIGeneratedItinerary,
  segmentIds: string[],
  cache: DatabaseCache
): Promise<void> {
  for (let i = 0; i < itinerary.segments.length; i++) {
    const segment = itinerary.segments[i];
    const segmentId = segmentIds[i];
    
    // Process activities in parallel
    const promises = segment.activitySearches.map(async (search) => {
      const result = await fetchActivityReservation(search, {
        lat: segment.endLocation.lat,
        lng: segment.endLocation.lng,
      });
      
      if (result) {
        await createReservation(prisma, {
          segmentId,
          template: result.reservation as AnyReservation,
          cache,
          sampleData: {
            isSample: true,
            suggestionReason: result.suggestionReason,
            profileReferences: result.profileReferences,
          },
        });
      }
    });
    
    await Promise.all(promises);
  }
}

// ============================================================================
// PROGRESS HELPERS
// ============================================================================

/**
 * Calculate completion percentage based on current progress
 */
export function calculateProgressPercentage(progress: GenerationProgress | null): number {
  if (!progress) return 0;
  
  let completedWeight = 0;
  for (const completed of progress.completed) {
    const step = PROGRESS_STEPS[completed as keyof typeof PROGRESS_STEPS];
    if (step) {
      completedWeight += step.weight;
    }
  }
  
  // Add partial progress for current step (assume 50% of that step)
  const currentStep = PROGRESS_STEPS[progress.step as keyof typeof PROGRESS_STEPS];
  if (currentStep && !progress.completed.includes(progress.step)) {
    completedWeight += currentStep.weight * 0.5;
  }
  
  return Math.min(100, completedWeight);
}

/**
 * Get human-readable status message
 */
export function getProgressMessage(progress: GenerationProgress | null): string {
  if (!progress) return 'Starting generation...';
  
  if (progress.step === 'complete') {
    return 'Trip generation complete!';
  }
  
  const step = PROGRESS_STEPS[progress.step as keyof typeof PROGRESS_STEPS];
  return step?.label || `Processing: ${progress.step}`;
}

/**
 * Create initial trip record for generation
 */
export async function createInitialTrip(
  params: GenerationParams
): Promise<string> {
  const trip = await createTrip(prisma, {
    title: params.suggestion.title,
    description: params.suggestion.description,
    startDate: params.startDate || getDefaultStartDate(),
    endDate: addDays(params.startDate || getDefaultStartDate(), parseDuration(params.suggestion.duration)),
    userId: params.userId,
    status: 'GENERATING',
    isSample: true,
    suggestionSummary: `Generating: ${params.suggestion.title}`,
    profileReferences: params.suggestion.combinedInterests.map(i => `interest-${i.toLowerCase().replace(/\s+/g, '-')}`),
  });
  
  // Initialize progress tracking
  await prisma.trip.update({
    where: { id: trip.id },
    data: {
      generationProgress: {
        step: 'starting',
        completed: [],
        failed: [],
      },
    },
  });
  
  return trip.id;
}

function getDefaultStartDate(): string {
  const now = new Date();
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  return twoWeeksFromNow.toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function parseDuration(duration: string): number {
  const lower = duration.toLowerCase();
  
  if (lower.includes('week')) {
    const match = lower.match(/(\d+)/);
    return match ? parseInt(match[1]) * 7 : 7;
  }
  if (lower.includes('weekend')) return 3;
  if (lower.includes('day')) {
    const match = lower.match(/(\d+)/);
    return match ? parseInt(match[1]) : 5;
  }
  if (lower.includes('hour')) return 1;
  
  const match = lower.match(/(\d+)/);
  return match ? parseInt(match[1]) : 5;
}

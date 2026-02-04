import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { 
  createInitialTrip, 
  generateTripInBackground,
  type GenerationParams,
} from '@/lib/sample-trip/background-generator';
import type { AITripSuggestion } from '@/lib/ai/generate-trip-suggestions';
import type { ProfileGraphItem } from '@/lib/types/profile-graph';

interface CreateSampleTripRequest {
  suggestion: AITripSuggestion;
  profileItems: ProfileGraphItem[];
  userProfile: {
    name: string;
    city: string | null;
    country: string | null;
    dateOfBirth: Date | null;
  };
  startDate?: string;
}

/**
 * POST /api/suggestions/create-sample-trip
 * 
 * Creates an AI-generated sample trip from a suggestion.
 * Returns immediately with tripId, then continues generation in background.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateSampleTripRequest = await request.json();
    const { suggestion, profileItems, userProfile, startDate } = body;

    // Validate required fields
    if (!suggestion) {
      return NextResponse.json(
        { error: 'Missing suggestion' },
        { status: 400 }
      );
    }

    if (!profileItems || !Array.isArray(profileItems)) {
      return NextResponse.json(
        { error: 'Missing or invalid profileItems' },
        { status: 400 }
      );
    }

    // Determine home airport from user profile
    const homeAirport = deriveHomeAirport(userProfile.city, userProfile.country);

    // Prepare generation params
    const params: GenerationParams = {
      userId: session.user.id,
      suggestion,
      profileItems,
      userProfile: {
        name: userProfile.name || session.user.name || 'Traveler',
        city: userProfile.city,
        country: userProfile.country,
        dateOfBirth: userProfile.dateOfBirth ? new Date(userProfile.dateOfBirth) : null,
      },
      homeAirport,
      startDate,
    };

    // Create initial trip record with GENERATING status
    const tripId = await createInitialTrip(params);

    console.log(`🎬 Starting background generation for trip ${tripId}`);

    // Start background generation (don't await)
    // Use setImmediate to ensure the response is sent first
    setImmediate(() => {
      generateTripInBackground(tripId, params).catch((error) => {
        console.error(`Background generation error for trip ${tripId}:`, error);
      });
    });

    // Return immediately with tripId
    return NextResponse.json({
      tripId,
      status: 'generating',
      message: 'Trip generation started. Poll /api/trips/[tripId]/generation-status for progress.',
    });

  } catch (error) {
    console.error('Error creating sample trip:', error);
    return NextResponse.json(
      { error: 'Failed to create sample trip' },
      { status: 500 }
    );
  }
}

/**
 * Derive home airport from city/country
 */
function deriveHomeAirport(city: string | null, country: string | null): string {
  if (!city) return 'SFO'; // Default

  const cityAirportMap: Record<string, string> = {
    'san francisco': 'SFO',
    'los angeles': 'LAX',
    'new york': 'JFK',
    'chicago': 'ORD',
    'boston': 'BOS',
    'seattle': 'SEA',
    'miami': 'MIA',
    'dallas': 'DFW',
    'houston': 'IAH',
    'denver': 'DEN',
    'atlanta': 'ATL',
    'phoenix': 'PHX',
    'washington': 'IAD',
    'london': 'LHR',
    'paris': 'CDG',
    'tokyo': 'NRT',
    'sydney': 'SYD',
    'berlin': 'BER',
    'amsterdam': 'AMS',
    'singapore': 'SIN',
    'hong kong': 'HKG',
    'dubai': 'DXB',
    'toronto': 'YYZ',
    'vancouver': 'YVR',
    'mexico city': 'MEX',
  };

  const normalizedCity = city.toLowerCase();
  
  for (const [cityName, airport] of Object.entries(cityAirportMap)) {
    if (normalizedCity.includes(cityName)) {
      return airport;
    }
  }

  // Return a default based on country
  if (country?.toLowerCase().includes('united states') || country?.toLowerCase() === 'usa') {
    return 'SFO';
  }
  if (country?.toLowerCase().includes('united kingdom') || country?.toLowerCase() === 'uk') {
    return 'LHR';
  }

  return 'SFO'; // Ultimate fallback
}

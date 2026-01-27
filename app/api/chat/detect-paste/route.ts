import { NextRequest, NextResponse } from "next/server";

/**
 * Fast detection API to determine if pasted text contains a reservation
 * Uses lightweight keyword matching to avoid expensive AI calls
 */

type ReservationType = "hotel" | "flight" | "car-rental" | "restaurant" | "event" | "train" | "cruise";

interface DetectionResult {
  isReservation: boolean;
  confidence: number; // 0-1
  detectedType?: ReservationType;
  suggestedAction: "extract" | "ignore" | "ask_user";
}

// Keyword sets for each reservation type
const KEYWORD_SETS: Record<ReservationType, string[]> = {
  hotel: [
    'hotel', 'reservation', 'check-in', 'check-out', 'room', 'guest',
    'nights', 'accommodation', 'booking', 'stay', 'resort', 'inn', 'lodge',
    'hotels.com', 'booking.com', 'expedia', 'airbnb', 'marriott', 'hilton',
    'hyatt', 'confirmation number', 'booking confirmation'
  ],
  flight: [
    'flight', 'airline', 'boarding', 'departure', 'arrival',
    'terminal', 'gate', 'seat', 'passenger', 'aircraft',
    'aviation', 'e-ticket', 'confirmation code', 'record locator',
    'united', 'delta', 'american airlines', 'southwest', 'jetblue',
    'boarding pass', 'flight number'
  ],
  'car-rental': [
    'car rental', 'rent a car', 'rental car', 'vehicle rental',
    'pick-up', 'pickup', 'drop-off', 'return location',
    'hertz', 'enterprise', 'avis', 'budget', 'toyota rent',
    'sixt', 'alamo', 'national', 'thrifty', 'europcar', 'dollar',
    'reservation number', 'rental agreement', 'vehicle class',
    'rental confirmation', 'car hire'
  ],
  restaurant: [
    'restaurant', 'reservation', 'table for', 'dining', 'dinner',
    'lunch', 'breakfast', 'opentable', 'resy', 'party of',
    'reservation confirmed', 'dining reservation', 'table reservation'
  ],
  event: [
    'ticket', 'event', 'admission', 'concert', 'show', 'performance',
    'ticketmaster', 'eventbrite', 'venue', 'seats', 'section',
    'row', 'general admission', 'event ticket', 'ticket confirmation'
  ],
  train: [
    'train', 'railway', 'rail', 'amtrak', 'station', 'platform',
    'coach', 'carriage', 'departure', 'arrival', 'train ticket',
    'rail ticket', 'train reservation'
  ],
  cruise: [
    'cruise', 'ship', 'sailing', 'embarkation', 'disembarkation',
    'cabin', 'stateroom', 'cruise line', 'port', 'voyage',
    'cruise booking', 'cruise confirmation'
  ]
};

// Strong confirmation indicators
const CONFIRMATION_KEYWORDS = [
  'confirmation number',
  'booking reference',
  'reservation code',
  'confirmation code',
  'booking confirmed',
  'reservation confirmed',
  'thank you for your booking',
  'your reservation',
  'booking details',
  'itinerary',
  'receipt'
];

function countKeywords(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  return keywords.filter(kw => lowerText.includes(kw)).length;
}

function detectReservationType(text: string): { type: ReservationType; score: number } | null {
  let bestMatch: { type: ReservationType; score: number } | null = null;

  for (const [type, keywords] of Object.entries(KEYWORD_SETS)) {
    const score = countKeywords(text, keywords);
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { type: type as ReservationType, score };
    }
  }

  return bestMatch;
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Quick rejection for very short text
    if (text.length < 100) {
      return NextResponse.json<DetectionResult>({
        isReservation: false,
        confidence: 0,
        suggestedAction: "ignore"
      });
    }

    // Check for confirmation keywords
    const confirmationScore = countKeywords(text, CONFIRMATION_KEYWORDS);
    
    // Detect reservation type
    const typeMatch = detectReservationType(text);

    if (!typeMatch) {
      return NextResponse.json<DetectionResult>({
        isReservation: false,
        confidence: 0,
        suggestedAction: "ignore"
      });
    }

    // Calculate confidence based on:
    // 1. Number of type-specific keywords
    // 2. Presence of confirmation keywords
    // 3. Text length (longer = more likely to be a full email)
    
    const typeConfidence = Math.min(typeMatch.score / 5, 1); // 5+ keywords = max confidence
    const confirmationConfidence = Math.min(confirmationScore / 2, 1); // 2+ confirmation keywords = max
    const lengthConfidence = Math.min(text.length / 500, 1); // 500+ chars = max
    
    // Weighted average: type keywords are most important
    const confidence = (
      typeConfidence * 0.5 +
      confirmationConfidence * 0.3 +
      lengthConfidence * 0.2
    );

    // Determine suggested action based on confidence
    let suggestedAction: "extract" | "ignore" | "ask_user";
    if (confidence >= 0.7) {
      suggestedAction = "extract";
    } else if (confidence >= 0.4) {
      suggestedAction = "ask_user";
    } else {
      suggestedAction = "ignore";
    }

    const isReservation = confidence >= 0.4; // Lower threshold to catch more cases

    console.log(`[DetectPaste] Detected: ${isReservation ? 'YES' : 'NO'}, Type: ${typeMatch.type}, Confidence: ${confidence.toFixed(2)}, Action: ${suggestedAction}`);

    return NextResponse.json<DetectionResult>({
      isReservation,
      confidence,
      detectedType: isReservation ? typeMatch.type : undefined,
      suggestedAction
    });

  } catch (error: any) {
    console.error("[DetectPaste] Error:", error);
    return NextResponse.json(
      { error: error.message || "Detection failed" },
      { status: 500 }
    );
  }
}

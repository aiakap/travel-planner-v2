import { NextRequest, NextResponse } from "next/server";

/**
 * Fast detection API to determine if pasted text contains a reservation
 * Uses lightweight keyword matching to avoid expensive AI calls
 */

type ReservationType = "hotel" | "flight" | "car-rental" | "restaurant" | "event" | "train" | "cruise";

interface TypeMatch {
  type: ReservationType;
  score: number;
  confidence: number;
  matchedKeywords: string[];
}

interface DetectionResult {
  isReservation: boolean;
  confidence: number; // 0-1
  detectedType?: ReservationType;
  suggestedAction: "extract" | "ignore" | "ask_user";
  alternativeTypes?: TypeMatch[];
  detectedKeywords?: string[];
}

// Keyword sets for each reservation type
const KEYWORD_SETS: Record<ReservationType, string[]> = {
  hotel: [
    'hotel', 'check-in', 'check-out', 'room', 'guest',
    'nights', 'accommodation', 'stay', 'resort', 'inn', 'lodge',
    'hotels.com', 'booking.com', 'expedia', 'airbnb', 'marriott', 'hilton',
    'hyatt', 'check-in date', 'check-out date', 'room type', 'suite',
    'floor', 'bed', 'amenities'
  ],
  flight: [
    'flight', 'airline', 'boarding', 'terminal',
    'gate', 'seat', 'aircraft',
    'aviation', 'e-ticket', 'record locator',
    'united', 'delta', 'american airlines', 'southwest', 'jetblue',
    'boarding pass', 'boarding time', 'departure gate',
    'arrival gate', 'baggage claim'
  ],
  'car-rental': [
    'car rental', 'rent a car', 'rental car', 'vehicle rental',
    'pick-up', 'pickup', 'drop-off', 'return location',
    'hertz', 'enterprise', 'avis', 'budget', 'toyota rent',
    'sixt', 'alamo', 'national', 'thrifty', 'europcar', 'dollar',
    'rental agreement', 'vehicle class',
    'rental confirmation', 'car hire', 'transfer', 'transfer service',
    'airport transfer', 'private transfer', 'shuttle', 'driver',
    'alphard', 'vellfire', 'vehicle type', 'luggage', 'ski bags',
    'pickup location', 'destination', 'eta', 'drive time'
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
  'receipt',
  'booking request',
  'booking no',
  'please accept an invoice',
  'payment due'
];

// Strong positive signals - if these appear, strongly boost confidence for the type
const STRONG_SIGNALS: Record<ReservationType, string[]> = {
  'car-rental': [
    'transfer service', 'airport transfer', 'private transfer',
    'driver will be waiting', 'pickup location', 'destination',
    'rental agreement', 'vehicle class', 'car type',
    'alphard', 'vellfire', 'drive time', 'drive normally takes'
  ],
  'hotel': [
    'check-in date', 'check-out date', 'room type', 'room number',
    'suite', 'floor', 'bed type', 'king bed', 'queen bed'
  ],
  'flight': [
    'boarding pass', 'seat assignment', 'boarding time',
    'departure gate', 'arrival gate', 'terminal', 'e-ticket'
  ],
  'restaurant': ['table for', 'party of', 'dining time', 'covers'],
  'event': ['ticket number', 'seat', 'section', 'row', 'venue'],
  'train': ['platform', 'carriage', 'coach', 'rail pass'],
  'cruise': ['cabin', 'stateroom', 'deck', 'sailing date']
};

// Negative keywords - if these appear, reduce confidence for certain types
const NEGATIVE_KEYWORDS: Record<ReservationType, string[]> = {
  'car-rental': [
    'check-in date', 'check-out date', 'room type', 'suite', 'floor',
    'boarding pass', 'seat assignment', 'boarding time',
    'table reservation', 'dining time'
  ],
  'hotel': [
    'boarding', 'departure gate', 'arrival gate',
    'rental agreement', 'vehicle class', 'pickup counter',
    'transfer service'
  ],
  'flight': [
    'check-in date', 'check-out date', 'room number',
    'rental agreement', 'transfer service', 'driver will be waiting'
  ],
  'restaurant': [],
  'event': [],
  'train': [],
  'cruise': []
};

function findMatchedKeywords(text: string, keywords: string[]): string[] {
  const lowerText = text.toLowerCase();
  return keywords.filter(kw => lowerText.includes(kw));
}

function countKeywords(text: string, keywords: string[]): number {
  return findMatchedKeywords(text, keywords).length;
}

function detectAllReservationTypes(text: string): TypeMatch[] {
  const matches: TypeMatch[] = [];

  for (const [type, keywords] of Object.entries(KEYWORD_SETS)) {
    const matchedKeywords = findMatchedKeywords(text, keywords);
    const score = matchedKeywords.length;
    
    if (score > 0) {
      // Calculate confidence based on keyword diversity
      const uniqueKeywordPrefixes = new Set(matchedKeywords.map(kw => kw.split(' ')[0]));
      const diversity = uniqueKeywordPrefixes.size / Math.min(keywords.length, 10);
      
      // Check for strong positive signals
      const strongSignals = STRONG_SIGNALS[type as ReservationType] || [];
      const strongMatches = findMatchedKeywords(text, strongSignals);
      const strongBonus = Math.min(strongMatches.length * 0.2, 0.6); // Up to 60% bonus for strong signals
      
      // Apply negative keyword penalty
      const negativeKeywords = NEGATIVE_KEYWORDS[type as ReservationType] || [];
      const negativeMatches = findMatchedKeywords(text, negativeKeywords);
      const penalty = Math.min(negativeMatches.length * 0.15, 0.5); // Max 50% penalty
      
      const rawConfidence = Math.min((score / 5) * diversity, 1);
      const adjustedConfidence = Math.max(Math.min(rawConfidence + strongBonus - penalty, 1), 0);
      
      matches.push({
        type: type as ReservationType,
        score,
        confidence: adjustedConfidence,
        matchedKeywords
      });
    }
  }

  // Sort by confidence descending (not just raw score)
  return matches.sort((a, b) => b.confidence - a.confidence);
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
    const confirmationKeywords = findMatchedKeywords(text, CONFIRMATION_KEYWORDS);
    const confirmationScore = confirmationKeywords.length;
    
    // Detect all reservation types with scores
    const allTypeMatches = detectAllReservationTypes(text);

    if (allTypeMatches.length === 0) {
      return NextResponse.json<DetectionResult>({
        isReservation: false,
        confidence: 0,
        suggestedAction: "ignore"
      });
    }

    // Get the best match
    const bestMatch = allTypeMatches[0];
    
    // Calculate overall confidence based on:
    // 1. Type-specific keywords (with diversity and negative penalties)
    // 2. Presence of confirmation keywords
    // 3. Text length (longer = more likely to be a full email)
    // 4. Gap between top match and second match (clearer signal)
    
    const typeConfidence = bestMatch.confidence;
    const confirmationConfidence = Math.min(confirmationScore / 2, 1); // 2+ confirmation keywords = max
    const lengthConfidence = Math.min(text.length / 500, 1); // 500+ chars = max
    
    // If there's a second match, check the confidence gap
    const secondMatch = allTypeMatches[1];
    const gapBonus = secondMatch 
      ? Math.min((bestMatch.confidence - secondMatch.confidence) / 0.5, 0.2) // Up to 20% bonus for clear winner
      : 0.2; // 20% bonus if only one type detected
    
    // Weighted calculation
    const confidence = Math.min(
      typeConfidence * 0.5 +
      confirmationConfidence * 0.25 +
      lengthConfidence * 0.05 +
      gapBonus,
      1
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

    // Prepare alternative types (top 3, excluding the best match)
    const alternativeTypes = allTypeMatches.slice(1, 4);

    console.log(`[DetectPaste] Detected: ${isReservation ? 'YES' : 'NO'}, Type: ${bestMatch.type}, Confidence: ${confidence.toFixed(2)}, Action: ${suggestedAction}`);
    console.log(`[DetectPaste] Type scores:`, allTypeMatches.map(m => `${m.type}:${m.confidence.toFixed(2)}`).join(', '));
    console.log(`[DetectPaste] Matched keywords (${bestMatch.type}):`, bestMatch.matchedKeywords.slice(0, 5).join(', '));
    console.log(`[DetectPaste] Confirmation keywords:`, confirmationKeywords.slice(0, 5).join(', '));

    return NextResponse.json<DetectionResult>({
      isReservation,
      confidence,
      detectedType: isReservation ? bestMatch.type : undefined,
      suggestedAction,
      alternativeTypes,
      detectedKeywords: [...bestMatch.matchedKeywords.slice(0, 5), ...confirmationKeywords.slice(0, 5)]
    });

  } catch (error: any) {
    console.error("[DetectPaste] Error:", error);
    return NextResponse.json(
      { error: error.message || "Detection failed" },
      { status: 500 }
    );
  }
}

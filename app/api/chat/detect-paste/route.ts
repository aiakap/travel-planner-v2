import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Enhanced detection API with semantic analysis
 * Uses company names, domains, and phrases for accurate classification
 */

interface DetectionType {
  name: string;          // "Car Rental", "Flight", "Hotel", etc.
  category: string;      // "Travel", "Stay", "Activity", "Dining"
  handler: string;       // "car-rental", "flight", "hotel" (for routing to actions)
}

interface TypeMatch {
  type: DetectionType;
  score: number;
  confidence: number;
  matchedKeywords: string[];
  matchedCompanies: string[];
  matchedDomains: string[];
  matchedPhrases: string[];
}

interface DetectionResult {
  isReservation: boolean;
  confidence: number; // 0-1
  detectedType?: string;  // DB type name
  category?: string;      // DB category name
  handler?: string;       // Action handler name
  suggestedAction: "extract" | "ignore" | "ask_user";
  alternativeTypes?: TypeMatch[];
  debug?: {
    companies: string[];
    domains: string[];
    phrases: string[];
    keywords: string[];
  };
}

// Cache for database reservation types
let RESERVATION_TYPES_CACHE: Map<string, DetectionType> | null = null;

// Known companies/brands by DB type name
const KNOWN_COMPANIES: Record<string, string[]> = {
  // Travel - Flight
  "Flight": [
    'united airlines', 'delta airlines', 'american airlines', 'southwest airlines',
    'jetblue', 'alaska airlines', 'lufthansa', 'air france', 'british airways',
    'ana', 'japan airlines', 'cathay pacific', 'singapore airlines', 'emirates',
    'qatar airways', 'etihad', 'virgin atlantic', 'ryanair', 'easyjet'
  ],
  
  // Travel - Private Driver
  "Private Driver": [
    'sansui niseko', 'niseko transfer', 'blacklane', 'welcome pickups',
    'jayride', 'hoppa', 'alpine transfer', 'viator transfers'
  ],
  
  // Travel - Ride Share
  "Ride Share": [
    'uber', 'lyft', 'grab', 'bolt', 'didi', 'ola', 'free now'
  ],
  
  // Travel - Taxi
  "Taxi": [
    'yellow cab', 'flywheel', 'curb', 'gett', 'free now taxi'
  ],
  
  // Travel - Car Rental
  "Car Rental": [
    'hertz', 'enterprise', 'avis', 'budget', 'alamo', 'national',
    'sixt', 'thrifty', 'europcar', 'dollar', 'advantage', 'ace rent a car',
    'fox rent a car'
  ],
  
  // Travel - Train
  "Train": [
    'amtrak', 'eurostar', 'renfe', 'trenitalia', 'sncf', 'deutsche bahn',
    'jr east', 'jr west', 'jr central', 'thetrainline'
  ],
  
  // Travel - Cruise
  "Cruise": [
    'carnival', 'royal caribbean', 'norwegian cruise', 'princess cruises',
    'holland america', 'celebrity cruises', 'msc cruises', 'cunard',
    'viking cruises'
  ],
  
  // Travel - Parking
  "Parking": [
    "park 'n fly", 'parkwhiz', 'spothero', 'parkopedia', 'justpark'
  ],
  
  // Stay
  "Hotel": [
    'marriott', 'hilton', 'hyatt', 'intercontinental', 'ihg', 'sheraton',
    'westin', 'ritz-carlton', 'four seasons', 'peninsula', 'mandarin oriental',
    'accor', 'choice hotels', 'best western', 'holiday inn', 'radisson', 'wyndham'
  ],
  
  // Activity - Event Tickets
  "Event Tickets": [
    'ticketmaster', 'eventbrite', 'stubhub', 'seatgeek', 'vivid seats',
    'viagogo', 'axs', 'etix'
  ],
  
  // Activity - Sport
  "Sport": [
    'classpass', 'mindbody', 'peloton', "barry's bootcamp", 'soulcycle',
    'orangetheory', '24 hour fitness', 'la fitness', 'equinox', 'ymca',
    'lifetime fitness', 'strava', 'parkrun'
  ],
  
  // Activity - Ski Pass
  "Ski Pass": [
    'epic pass', 'ikon pass', 'lift tickets', 'liftopia', 'mountain collective'
  ],
  
  // Activity - Spa & Wellness
  "Spa & Wellness": [
    'spa finder', 'spafinder', 'mindbody', 'massage envy', 'hand & stone',
    'elements massage', 'zeel'
  ],
  
  // Activity - Golf
  "Golf": [
    'golfnow', 'teeoff', 'supreme golf', 'golfswitch'
  ],
  
  // Dining
  "Restaurant": [
    'opentable', 'resy', 'yelp reservations', 'tock', 'the fork',
    'quandoo', 'bookatable', 'sevenrooms'
  ]
};

// Domain patterns by DB type name
const DOMAIN_PATTERNS: Record<string, RegExp[]> = {
  "Flight": [
    /united\.com/, /delta\.com/, /aa\.com/, /southwest\.com/, /jetblue\.com/,
    /alaskaair\.com/, /lufthansa\.com/, /britishairways\.com/, /airfrance\.com/,
    /ana\.co\.jp/, /expedia\.com\/flights/, /kayak\.com\/flights/,
    /skyscanner\.com/, /google\.com\/flights/
  ],
  
  "Private Driver": [
    /transfer/i, /shuttle/i, /chauffeur/i, /limo/i, /blacklane/,
    /veritrans/, /driver/i
  ],
  
  "Ride Share": [
    /uber\.com/, /lyft\.com/, /grab\.com/, /bolt\.eu/, /didi\.com/
  ],
  
  "Taxi": [
    /taxi/i, /cab/i, /flywheel/, /gett\.com/, /curb\.com/
  ],
  
  "Car Rental": [
    /hertz\.com/, /enterprise\.com/, /avis\.com/, /budget\.com/,
    /alamo\.com/, /national\.com/, /sixt\.com/, /thrifty\.com/,
    /europcar\.com/, /dollar\.com/
  ],
  
  "Hotel": [
    /marriott\.com/, /hilton\.com/, /hyatt\.com/, /ihg\.com/,
    /fourseasons\.com/, /ritzcarlton\.com/, /booking\.com/,
    /hotels\.com/, /expedia\.com\/hotel/, /airbnb\.com/, /vrbo\.com/
  ],
  
  "Restaurant": [
    /opentable\.com/, /resy\.com/, /yelp\.com\/reservations/,
    /tock\.com/, /sevenrooms\.com/
  ],
  
  "Event Tickets": [
    /ticketmaster\.com/, /eventbrite\.com/, /stubhub\.com/,
    /seatgeek\.com/, /axs\.com/
  ],
  
  "Sport": [
    /classpass/, /mindbody/, /barrys/, /soulcycle/, /orangetheory/,
    /fitness/i, /gym/i, /yoga/i
  ],
  
  "Ski Pass": [
    /epicpass/, /ikonpass/, /liftopia/
  ],
  
  "Spa & Wellness": [
    /spa/i, /wellness/i, /massage/i, /mindbody/, /zeel\.com/
  ],
  
  "Golf": [
    /golfnow/, /teeoff/, /golf/i
  ],
  
  "Parking": [
    /parking/i, /parkwhiz/, /spothero/
  ]
};

// Semantic phrases by DB type name
const SEMANTIC_PHRASES: Record<string, string[]> = {
  "Private Driver": [
    'provide the transfer service', 'transfer service for you',
    'the driver will be waiting', 'driver will be waiting',
    'driver waiting for you', 'driver will meet you',
    'meet and greet service', 'chauffeur will meet',
    'private car service', 'airport pickup service',
    'we will pick you up', 'meet you at arrivals',
    'waiting in arrivals hall', 'showing a name board',
    'holding a sign', 'drive normally takes', 'drive time is'
  ],
  
  "Ride Share": [
    'your uber is confirmed', 'ride scheduled', 'pickup confirmed',
    'your driver will arrive', 'estimated pickup time', 'uber reservation',
    'lyft scheduled'
  ],
  
  "Taxi": [
    'taxi booking confirmed', 'cab reservation', 'pickup time confirmed',
    'taxi will arrive', 'cab service'
  ],
  
  "Car Rental": [
    'rental agreement', 'vehicle class', 'pickup counter',
    'return location', 'rental confirmation', 'car hire confirmed',
    'vehicle rental'
  ],
  
  "Flight": [
    'your flight is confirmed', 'flight confirmation',
    'boarding pass attached', 'online check-in available',
    'seat selection available', 'baggage allowance',
    'carry-on baggage', 'e-ticket number'
  ],
  
  "Hotel": [
    'welcome to our hotel', 'your room reservation',
    'your room is ready', 'check-in is at', 'check-out is at',
    'room has been reserved', 'room confirmation',
    'your stay with us', 'looking forward to welcoming you'
  ],
  
  "Restaurant": [
    'your table reservation', 'table for', 'party of',
    'dining reservation confirmed', 'reservation at our restaurant',
    'table reserved for'
  ],
  
  "Sport": [
    'class booking confirmed', 'workout session booked',
    'yoga class reserved', 'fitness class', 'spin class',
    'personal training session', 'gym session booked',
    'run club registration', 'swim session', 'pilates class',
    'crossfit session', 'boot camp session', 'cycling class'
  ],
  
  "Ski Pass": [
    'lift ticket confirmed', 'ski pass purchased', 'season pass',
    'day pass confirmed', 'resort access'
  ],
  
  "Equipment Rental": [
    'equipment rental confirmed', 'ski rental', 'bike rental',
    'gear rental', 'rental period'
  ],
  
  "Spa & Wellness": [
    'spa appointment confirmed', 'massage booking', 'massage appointment',
    'bodywork session', 'treatment confirmed', 'spa reservation',
    'wellness booking', 'therapy session', 'deep tissue massage',
    'hot stone massage', 'facial appointment'
  ],
  
  "Golf": [
    'tee time confirmed', 'golf reservation', 'tee time booking',
    'course reservation'
  ],
  
  "Event Tickets": [
    'your tickets are confirmed', 'ticket confirmation',
    'event admission', 'your seats are', 'section and row',
    'mobile ticket attached'
  ]
};

// Confirmation keywords (universal)
const CONFIRMATION_KEYWORDS = [
  'confirmation number', 'booking reference', 'reservation code',
  'confirmation code', 'booking confirmed', 'reservation confirmed',
  'thank you for your booking', 'your reservation', 'booking details',
  'itinerary', 'receipt', 'booking request', 'booking no',
  'please accept an invoice', 'payment due'
];

/**
 * Load reservation types from database and cache them
 */
async function getReservationTypes(): Promise<Map<string, DetectionType>> {
  if (RESERVATION_TYPES_CACHE) {
    return RESERVATION_TYPES_CACHE;
  }

  try {
    const types = await prisma.reservationType.findMany({
      include: { category: true }
    });

    RESERVATION_TYPES_CACHE = new Map(
      types.map(t => [
        t.name.toLowerCase(),
        {
          name: t.name,
          category: t.category.name,
          handler: mapTypeToHandler(t.name, t.category.name)
        }
      ])
    );

    console.log(`[DetectPaste] ✅ Loaded ${types.length} reservation types from database`);
    return RESERVATION_TYPES_CACHE;
  } catch (error) {
    console.error('[DetectPaste] ❌ Failed to load reservation types from database:', error);
    // Return empty map as fallback - detection will fail gracefully
    return new Map();
  }
}

/**
 * Map database type to handler action name
 * 
 * NOTE: This function is duplicated in lib/email-extraction/type-mapping.ts
 * to maintain consistency between detection and extraction APIs.
 * Any changes here should be reflected there as well.
 * 
 * TODO: Consider importing from shared utility instead of duplicating.
 */
function mapTypeToHandler(typeName: string, categoryName: string): string {
  if (categoryName === "Travel") {
    if (typeName === "Flight") return "flight";
    if (typeName === "Train") return "train";
    if (typeName === "Cruise") return "cruise";
    if (["Car Rental", "Private Driver", "Ride Share", "Taxi"].includes(typeName)) {
      return "car-rental";
    }
    if (typeName === "Bus") return "train";
    if (typeName === "Ferry") return "cruise";
    if (typeName === "Parking") return "generic";
  }

  if (categoryName === "Stay") {
    return "hotel";
  }

  if (categoryName === "Activity") {
    if (["Equipment Rental", "Spa & Wellness"].includes(typeName)) {
      return "generic";
    }
    return "event";
  }

  if (categoryName === "Dining") {
    return "restaurant";
  }

  return "generic";
}

/**
 * Find matched items in text (case-insensitive)
 */
function findMatches(text: string, items: string[]): string[] {
  const lowerText = text.toLowerCase();
  return items.filter(item => lowerText.includes(item.toLowerCase()));
}

/**
 * Extract domains/URLs from text
 */
function extractDomains(text: string): string[] {
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi;
  const matches = text.match(urlRegex) || [];
  return matches.map(m => m.replace(/^(?:https?:\/\/)?(?:www\.)?/, '').toLowerCase());
}

/**
 * Detect all possible reservation types with semantic analysis
 */
async function detectAllReservationTypes(text: string): Promise<TypeMatch[]> {
  const types = await getReservationTypes();
  const matches: TypeMatch[] = [];
  const domains = extractDomains(text);

  for (const [_, typeInfo] of types) {
    const typeName = typeInfo.name;

    // Match companies
    const companies = KNOWN_COMPANIES[typeName] || [];
    const matchedCompanies = findMatches(text, companies);
    const companyBoost = Math.min(matchedCompanies.length * 0.8, 0.8);

    // Match domains
    const domainPatterns = DOMAIN_PATTERNS[typeName] || [];
    const matchedDomains = domains.filter(d => 
      domainPatterns.some(pattern => pattern.test(d))
    );
    const domainBoost = Math.min(matchedDomains.length * 0.6, 0.6);

    // Match semantic phrases
    const phrases = SEMANTIC_PHRASES[typeName] || [];
    const matchedPhrases = findMatches(text, phrases);
    const phraseBoost = Math.min(matchedPhrases.length * 0.4, 0.8);

    // Calculate base confidence
    const totalBoost = companyBoost + domainBoost + phraseBoost;
    
    if (totalBoost > 0) {
      const confidence = Math.min(totalBoost, 0.95);
      
      matches.push({
        type: typeInfo,
        score: matchedCompanies.length + matchedDomains.length + matchedPhrases.length,
        confidence,
        matchedKeywords: [],
        matchedCompanies,
        matchedDomains,
        matchedPhrases
      });
    }
  }

  // Sort by confidence descending
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
    const confirmationKeywords = findMatches(text, CONFIRMATION_KEYWORDS);
    const confirmationBoost = Math.min(confirmationKeywords.length / 2, 0.3);

    // Detect all types with semantic analysis
    const allTypeMatches = await detectAllReservationTypes(text);

    if (allTypeMatches.length === 0) {
      return NextResponse.json<DetectionResult>({
        isReservation: false,
        confidence: 0,
        suggestedAction: "ignore"
      });
    }

    // Get the best match
    const bestMatch = allTypeMatches[0];
    const secondMatch = allTypeMatches[1];

    // Apply confirmation boost and gap bonus
    const gapBonus = secondMatch
      ? Math.min((bestMatch.confidence - secondMatch.confidence) / 0.5, 0.2)
      : 0.2;

    const finalConfidence = Math.min(
      bestMatch.confidence + confirmationBoost + gapBonus,
      0.99
    );

    // Determine action
    let suggestedAction: "extract" | "ignore" | "ask_user";
    if (finalConfidence >= 0.7) {
      suggestedAction = "extract";
    } else if (finalConfidence >= 0.4) {
      suggestedAction = "ask_user";
    } else {
      suggestedAction = "ignore";
    }

    const isReservation = finalConfidence >= 0.4;

    console.log(`[DetectPaste] Detected: ${isReservation ? 'YES' : 'NO'}, Type: ${bestMatch.type.name}, Confidence: ${finalConfidence.toFixed(2)}, Action: ${suggestedAction}`);
    console.log(`[DetectPaste] Companies: ${bestMatch.matchedCompanies.join(', ') || 'none'}`);
    console.log(`[DetectPaste] Domains: ${bestMatch.matchedDomains.join(', ') || 'none'}`);
    console.log(`[DetectPaste] Phrases: ${bestMatch.matchedPhrases.slice(0, 3).join(', ') || 'none'}`);
    console.log(`[DetectPaste] Alternatives: ${allTypeMatches.slice(1, 3).map(m => `${m.type.name}:${m.confidence.toFixed(2)}`).join(', ')}`);

    // Calculate individual boost components for scoring breakdown
    const companyBoost = Math.min(bestMatch.matchedCompanies.length * 0.8, 0.8);
    const domainBoost = Math.min(bestMatch.matchedDomains.length * 0.6, 0.6);
    const phraseBoost = Math.min(bestMatch.matchedPhrases.length * 0.4, 0.8);

    return NextResponse.json<DetectionResult>({
      isReservation,
      confidence: finalConfidence,
      detectedType: isReservation ? bestMatch.type.name : undefined,
      category: isReservation ? bestMatch.type.category : undefined,
      handler: isReservation ? bestMatch.type.handler : undefined,
      suggestedAction,
      alternativeTypes: allTypeMatches.slice(1, 4),
      debug: {
        companies: bestMatch.matchedCompanies,
        domains: bestMatch.matchedDomains,
        phrases: bestMatch.matchedPhrases.slice(0, 5),
        keywords: confirmationKeywords.slice(0, 5)
      },
      // Enhanced scoring breakdown for interactive approval
      scoringBreakdown: {
        companyMatches: {
          score: companyBoost,
          matches: bestMatch.matchedCompanies
        },
        semanticPhrases: {
          score: phraseBoost,
          matches: bestMatch.matchedPhrases.slice(0, 5)
        },
        domainMatches: {
          score: domainBoost,
          matches: bestMatch.matchedDomains
        },
        confirmationKeywords: {
          score: confirmationBoost,
          matches: confirmationKeywords.slice(0, 5)
        },
        gapBonus: {
          score: gapBonus,
          description: secondMatch 
            ? `Lead over second choice (${secondMatch.type.name}: ${secondMatch.confidence.toFixed(2)})`
            : 'No competing types'
        }
      },
      topMatch: {
        type: bestMatch.type.name,
        category: bestMatch.type.category,
        confidence: finalConfidence,
        score: bestMatch.score
      },
      allTypes: allTypeMatches.map(m => ({
        type: m.type.name,
        category: m.type.category,
        score: m.score,
        confidence: m.confidence,
        matchedCompanies: m.matchedCompanies,
        matchedDomains: m.matchedDomains,
        matchedPhrases: m.matchedPhrases.slice(0, 3)
      }))
    });

  } catch (error: any) {
    console.error("[DetectPaste] Error:", error);
    return NextResponse.json(
      { error: error.message || "Detection failed" },
      { status: 500 }
    );
  }
}

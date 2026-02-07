/**
 * Entity Matcher Service
 * Matches and deduplicates places across multiple API sources
 */

import type {
  GooglePlaceSourceData,
  YelpBusinessSourceData,
  AmadeusSourceData,
  EntityMatch,
} from "@/lib/types/consolidated-place";

// ============================================================================
// Types
// ============================================================================

export interface MatchCandidate {
  source: "google" | "yelp" | "amadeus";
  id: string;
  name: string;
  coordinates?: { lat: number; lng: number };
  address?: string;
  phone?: string;
  data: GooglePlaceSourceData | YelpBusinessSourceData | AmadeusSourceData;
}

export interface MatchGroup {
  matches: EntityMatch;
  candidates: MatchCandidate[];
  bestName: string;
  bestCoordinates?: { lat: number; lng: number };
}

export interface MatchingOptions {
  nameThreshold?: number; // 0-1, default 0.7
  coordinateRadiusMeters?: number; // default 100
  requireNameMatch?: boolean;
  requireCoordinateMatch?: boolean;
}

// ============================================================================
// String Similarity Functions
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create distance matrix
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize first column
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }

  // Initialize first row
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate normalized string similarity (0-1)
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  return 1 - distance / maxLength;
}

/**
 * Normalize a name for comparison
 * Removes common words, special characters, etc.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`]/g, "'") // Normalize quotes
    .replace(/[^\w\s']/g, " ") // Remove special chars except apostrophes
    .replace(/\b(the|a|an|and|of|in|at|on|for|to|by)\b/gi, "") // Remove common words
    .replace(/\b(restaurant|hotel|cafe|bar|bistro|inn|suite|suites)\b/gi, "") // Remove business types
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

/**
 * Check if two names are likely the same place
 */
function namesMatch(name1: string, name2: string, threshold: number = 0.7): boolean {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);

  // Exact normalized match
  if (norm1 === norm2) return true;

  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;

  // Fuzzy matching
  const similarity = stringSimilarity(norm1, norm2);
  return similarity >= threshold;
}

// ============================================================================
// Coordinate Functions
// ============================================================================

/**
 * Calculate distance between two coordinates in meters
 * Uses Haversine formula
 */
function calculateDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = (coord1.lat * Math.PI) / 180;
  const lat2Rad = (coord2.lat * Math.PI) / 180;
  const deltaLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if two coordinates are within a certain radius
 */
function coordinatesMatch(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number },
  radiusMeters: number = 100
): boolean {
  return calculateDistance(coord1, coord2) <= radiusMeters;
}

// ============================================================================
// Address Functions
// ============================================================================

/**
 * Normalize an address for comparison
 */
function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\b(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|way|place|pl)\b/gi, "")
    .replace(/\b(suite|ste|apt|apartment|unit|floor|fl)\b/gi, "")
    .replace(/\d+/g, (match) => match) // Keep numbers
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check if two addresses are likely the same
 */
function addressesMatch(addr1: string, addr2: string): boolean {
  const norm1 = normalizeAddress(addr1);
  const norm2 = normalizeAddress(addr2);

  if (norm1 === norm2) return true;

  // Check if addresses share key components
  const similarity = stringSimilarity(norm1, norm2);
  return similarity >= 0.8;
}

// ============================================================================
// Phone Functions
// ============================================================================

/**
 * Normalize a phone number
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10); // Keep last 10 digits
}

/**
 * Check if two phone numbers match
 */
function phonesMatch(phone1: string, phone2: string): boolean {
  const norm1 = normalizePhone(phone1);
  const norm2 = normalizePhone(phone2);
  return norm1.length >= 7 && norm1 === norm2;
}

// ============================================================================
// Main Matching Functions
// ============================================================================

/**
 * Convert source data to match candidate
 */
function toMatchCandidate(
  source: "google" | "yelp" | "amadeus",
  data: GooglePlaceSourceData | YelpBusinessSourceData | AmadeusSourceData
): MatchCandidate {
  if (source === "google") {
    const google = data as GooglePlaceSourceData;
    return {
      source: "google",
      id: google.placeId,
      name: google.name,
      coordinates: google.location,
      address: google.formattedAddress,
      phone: google.formattedPhoneNumber || google.internationalPhoneNumber,
      data,
    };
  }

  if (source === "yelp") {
    const yelp = data as YelpBusinessSourceData;
    return {
      source: "yelp",
      id: yelp.businessId,
      name: yelp.name,
      coordinates: {
        lat: yelp.coordinates.latitude,
        lng: yelp.coordinates.longitude,
      },
      address: yelp.location.displayAddress.join(", "),
      phone: yelp.phone,
      data,
    };
  }

  // Amadeus
  const amadeus = data as AmadeusSourceData;
  return {
    source: "amadeus",
    id: amadeus.hotelId || amadeus.activityId || "",
    name: amadeus.hotelName || amadeus.activityName || "",
    coordinates: amadeus.location
      ? { lat: amadeus.location.latitude, lng: amadeus.location.longitude }
      : undefined,
    address: amadeus.address,
    data,
  };
}

/**
 * Match two candidates and return confidence score
 */
function matchCandidates(
  c1: MatchCandidate,
  c2: MatchCandidate,
  options: MatchingOptions = {}
): { matched: boolean; confidence: number; matchedBy: EntityMatch["matchedBy"] } {
  const matchedBy: EntityMatch["matchedBy"] = [];
  let confidence = 0;

  const nameThreshold = options.nameThreshold || 0.7;
  const coordinateRadius = options.coordinateRadiusMeters || 100;

  // Name matching (weight: 0.4)
  if (c1.name && c2.name && namesMatch(c1.name, c2.name, nameThreshold)) {
    matchedBy.push("name");
    confidence += 0.4;
  }

  // Coordinate matching (weight: 0.3)
  if (c1.coordinates && c2.coordinates) {
    if (coordinatesMatch(c1.coordinates, c2.coordinates, coordinateRadius)) {
      matchedBy.push("coordinates");
      confidence += 0.3;
    }
  }

  // Address matching (weight: 0.2)
  if (c1.address && c2.address && addressesMatch(c1.address, c2.address)) {
    matchedBy.push("address");
    confidence += 0.2;
  }

  // Phone matching (weight: 0.1)
  if (c1.phone && c2.phone && phonesMatch(c1.phone, c2.phone)) {
    matchedBy.push("phone");
    confidence += 0.1;
  }

  // Determine if matched based on options
  let matched = false;

  if (options.requireNameMatch && options.requireCoordinateMatch) {
    matched = matchedBy.includes("name") && matchedBy.includes("coordinates");
  } else if (options.requireNameMatch) {
    matched = matchedBy.includes("name") && matchedBy.length >= 2;
  } else if (options.requireCoordinateMatch) {
    matched = matchedBy.includes("coordinates") && matchedBy.length >= 2;
  } else {
    // Default: at least 2 matching criteria OR high confidence
    matched = matchedBy.length >= 2 || confidence >= 0.7;
  }

  return { matched, confidence, matchedBy };
}

/**
 * Match entities across all sources
 */
export function matchEntities(
  google: Map<string, GooglePlaceSourceData>,
  yelp: Map<string, YelpBusinessSourceData>,
  amadeus: Map<string, AmadeusSourceData>,
  options: MatchingOptions = {}
): MatchGroup[] {
  const groups: MatchGroup[] = [];
  const processed = new Set<string>();

  // Convert all to candidates
  const allCandidates: MatchCandidate[] = [];

  google.forEach((data, key) => {
    allCandidates.push(toMatchCandidate("google", data));
  });

  yelp.forEach((data, key) => {
    allCandidates.push(toMatchCandidate("yelp", data));
  });

  amadeus.forEach((data, key) => {
    allCandidates.push(toMatchCandidate("amadeus", data));
  });

  // Group matching candidates
  for (let i = 0; i < allCandidates.length; i++) {
    const candidate = allCandidates[i];
    const candidateKey = `${candidate.source}:${candidate.id}`;

    if (processed.has(candidateKey)) continue;

    const group: MatchCandidate[] = [candidate];
    processed.add(candidateKey);

    // Find all matching candidates
    for (let j = i + 1; j < allCandidates.length; j++) {
      const other = allCandidates[j];
      const otherKey = `${other.source}:${other.id}`;

      if (processed.has(otherKey)) continue;
      if (other.source === candidate.source) continue; // Skip same source

      const matchResult = matchCandidates(candidate, other, options);

      if (matchResult.matched) {
        group.push(other);
        processed.add(otherKey);
      }
    }

    // Create match group
    const entityMatch: EntityMatch = {
      confidence: 0,
      matchedBy: [],
    };

    group.forEach((c) => {
      if (c.source === "google") entityMatch.googleId = c.id;
      if (c.source === "yelp") entityMatch.yelpId = c.id;
      if (c.source === "amadeus") entityMatch.amadeusId = c.id;
    });

    // Calculate overall confidence
    if (group.length > 1) {
      let totalConfidence = 0;
      let matchCount = 0;
      const allMatchedBy = new Set<string>();

      for (let a = 0; a < group.length; a++) {
        for (let b = a + 1; b < group.length; b++) {
          const result = matchCandidates(group[a], group[b], options);
          totalConfidence += result.confidence;
          matchCount++;
          result.matchedBy.forEach((m) => allMatchedBy.add(m));
        }
      }

      entityMatch.confidence = matchCount > 0 ? totalConfidence / matchCount : 0;
      entityMatch.matchedBy = Array.from(allMatchedBy) as EntityMatch["matchedBy"];
    } else {
      entityMatch.confidence = 1;
      entityMatch.matchedBy = ["name"];
    }

    // Determine best name and coordinates
    const googleCandidate = group.find((c) => c.source === "google");
    const yelpCandidate = group.find((c) => c.source === "yelp");
    const amadeusCandidate = group.find((c) => c.source === "amadeus");

    // Prefer Google for name, then Yelp, then Amadeus
    const bestName =
      googleCandidate?.name ||
      yelpCandidate?.name ||
      amadeusCandidate?.name ||
      "Unknown";

    // Prefer Google for coordinates, then Yelp
    const bestCoordinates =
      googleCandidate?.coordinates ||
      yelpCandidate?.coordinates ||
      amadeusCandidate?.coordinates;

    groups.push({
      matches: entityMatch,
      candidates: group,
      bestName,
      bestCoordinates,
    });
  }

  return groups;
}

/**
 * Find matching entities for a specific place name
 */
export function findMatchForName(
  name: string,
  google: Map<string, GooglePlaceSourceData>,
  yelp: Map<string, YelpBusinessSourceData>,
  amadeus: Map<string, AmadeusSourceData>,
  options: MatchingOptions = {}
): MatchGroup | null {
  const threshold = options.nameThreshold || 0.7;

  const candidates: MatchCandidate[] = [];

  // Find matches by name
  google.forEach((data, key) => {
    if (namesMatch(name, data.name, threshold)) {
      candidates.push(toMatchCandidate("google", data));
    }
  });

  yelp.forEach((data, key) => {
    if (namesMatch(name, data.name, threshold)) {
      candidates.push(toMatchCandidate("yelp", data));
    }
  });

  amadeus.forEach((data, key) => {
    const amadeusName = data.hotelName || data.activityName || "";
    if (amadeusName && namesMatch(name, amadeusName, threshold)) {
      candidates.push(toMatchCandidate("amadeus", data));
    }
  });

  if (candidates.length === 0) {
    return null;
  }

  // Create match group
  const entityMatch: EntityMatch = {
    confidence: 0,
    matchedBy: ["name"],
  };

  candidates.forEach((c) => {
    if (c.source === "google") entityMatch.googleId = c.id;
    if (c.source === "yelp") entityMatch.yelpId = c.id;
    if (c.source === "amadeus") entityMatch.amadeusId = c.id;
  });

  entityMatch.confidence = candidates.length > 1 ? 0.8 : 1;

  const googleCandidate = candidates.find((c) => c.source === "google");
  const yelpCandidate = candidates.find((c) => c.source === "yelp");

  return {
    matches: entityMatch,
    candidates,
    bestName: googleCandidate?.name || yelpCandidate?.name || name,
    bestCoordinates: googleCandidate?.coordinates || yelpCandidate?.coordinates,
  };
}

// ============================================================================
// Exports
// ============================================================================

export const entityMatcher = {
  matchEntities,
  findMatchForName,
  namesMatch,
  coordinatesMatch,
  addressesMatch,
  phonesMatch,
  stringSimilarity,
  calculateDistance,
};

export default entityMatcher;

/**
 * Parse multi-city trip intent from natural language
 * Detects patterns like:
 * - "Paris 3 days, Rome 4 days, Barcelona 2 days"
 * - "3 days in Paris, then 4 days in Rome"
 * - "Visit Paris, Rome, and Barcelona for a week each"
 */

interface CityStop {
  city: string
  durationDays: number
}

interface MultiCityIntent {
  isMultiCity: boolean
  cities: CityStop[]
  startDate?: Date
  title?: string
}

/**
 * Parse multi-city intent from user message
 */
export function parseMultiCityIntent(text: string): MultiCityIntent {
  const lowerText = text.toLowerCase()

  // Pattern 1: "City X days, City Y days"
  // Example: "Paris 3 days, Rome 4 days, Barcelona 2 days"
  const pattern1 = /([a-z\s,]+?)\s+(\d+)\s*days?/gi
  const matches1 = Array.from(text.matchAll(pattern1))

  if (matches1.length >= 2) {
    const cities: CityStop[] = matches1.map(match => ({
      city: match[1].trim(),
      durationDays: parseInt(match[2])
    }))

    return {
      isMultiCity: true,
      cities,
    }
  }

  // Pattern 2: "X days in City, then Y days in City"
  // Example: "3 days in Paris, then 4 days in Rome"
  const pattern2 = /(\d+)\s*days?\s+in\s+([a-z\s,]+?)(?:,?\s+then|\s+and|$)/gi
  const matches2 = Array.from(text.matchAll(pattern2))

  if (matches2.length >= 2) {
    const cities: CityStop[] = matches2.map(match => ({
      city: match[2].trim(),
      durationDays: parseInt(match[1])
    }))

    return {
      isMultiCity: true,
      cities,
    }
  }

  // Pattern 3: "Visit City, City, and City for X days each"
  // Example: "Visit Paris, Rome, and Barcelona for a week each"
  const weekMatch = text.match(/visit\s+(.*?)\s+for\s+(?:a\s+)?(\d+|week|weeks?)/i)
  if (weekMatch) {
    const cityList = weekMatch[1]
    const duration = weekMatch[2].toLowerCase().includes('week') ? 7 : parseInt(weekMatch[2])
    
    // Split cities by commas and "and"
    const cityNames = cityList
      .split(/,|\s+and\s+/)
      .map(c => c.trim())
      .filter(c => c.length > 0)

    if (cityNames.length >= 2) {
      const cities: CityStop[] = cityNames.map(city => ({
        city,
        durationDays: duration
      }))

      return {
        isMultiCity: true,
        cities,
      }
    }
  }

  // Pattern 4: "City to City to City" (assumes equal duration)
  // Example: "Paris to Rome to Barcelona"
  const pattern4 = /([a-z\s,]+?)\s+to\s+([a-z\s,]+?)(?:\s+to\s+([a-z\s,]+?))?/i
  const match4 = text.match(pattern4)
  
  if (match4 && match4.length >= 3) {
    const cityNames = [match4[1], match4[2], match4[3]].filter(Boolean).map(c => c.trim())
    
    if (cityNames.length >= 2) {
      // Default to 3 days per city if not specified
      const cities: CityStop[] = cityNames.map(city => ({
        city,
        durationDays: 3
      }))

      return {
        isMultiCity: true,
        cities,
      }
    }
  }

  // Not a multi-city intent
  return {
    isMultiCity: false,
    cities: [],
  }
}

/**
 * Extract start date from text if present
 */
export function extractStartDate(text: string): Date | undefined {
  // Pattern: "starting March 15" or "starting on March 15"
  const startingMatch = text.match(/starting\s+(?:on\s+)?([a-z]+\s+\d{1,2}(?:,?\s+\d{4})?)/i)
  if (startingMatch) {
    const date = new Date(startingMatch[1])
    if (!isNaN(date.getTime())) {
      return date
    }
  }

  // Pattern: "from March 15" or "beginning March 15"
  const fromMatch = text.match(/(?:from|beginning)\s+([a-z]+\s+\d{1,2}(?:,?\s+\d{4})?)/i)
  if (fromMatch) {
    const date = new Date(fromMatch[1])
    if (!isNaN(date.getTime())) {
      return date
    }
  }

  return undefined
}

/**
 * Extract trip title from text if present
 */
export function extractTripTitle(text: string): string | undefined {
  // Pattern: "called X" or "named X" or "title X"
  const titleMatch = text.match(/(?:called|named|title)\s+"([^"]+)"/i)
  if (titleMatch) {
    return titleMatch[1]
  }

  return undefined
}

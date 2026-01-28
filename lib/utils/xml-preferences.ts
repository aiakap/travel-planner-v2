/**
 * XML Preferences Utility
 * 
 * Handles parsing and serialization of trip intelligence preferences
 * stored in UserProfileGraph.graphData XML field
 */

export interface TripIntelligencePreferences {
  currency?: {
    citizenship?: string
    residence?: string
  }
  emergency?: {
    citizenship?: string
    residence?: string
    medicalConditions?: string
  }
  cultural?: {
    interestedInEvents?: boolean
    crowdPreference?: 'avoid' | 'embrace' | 'flexible'
  }
  activities?: {
    activityPace?: 'relaxed' | 'moderate' | 'packed'
    dailyBudget?: '0-50' | '50-100' | '100-200' | '200+'
  }
  dining?: {
    adventurousness?: 'safe' | 'somewhat' | 'very'
    mealBudget?: '$' | '$$' | '$$$' | '$$$$'
  }
  packing?: {
    packingStyle?: 'light' | 'moderate' | 'everything'
    hasGear?: 'lots' | 'some' | 'none'
  }
}

/**
 * Parse XML string to TripIntelligencePreferences object
 */
export function parsePreferencesXML(xml: string | null): TripIntelligencePreferences {
  if (!xml) {
    return {}
  }

  try {
    const preferences: TripIntelligencePreferences = {}

    // Currency preferences
    const currencyMatch = xml.match(/<currency>([\s\S]*?)<\/currency>/)
    if (currencyMatch) {
      preferences.currency = {}
      const citizenshipMatch = currencyMatch[1].match(/<citizenship>(.*?)<\/citizenship>/)
      const residenceMatch = currencyMatch[1].match(/<residence>(.*?)<\/residence>/)
      if (citizenshipMatch) preferences.currency.citizenship = citizenshipMatch[1]
      if (residenceMatch) preferences.currency.residence = residenceMatch[1]
    }

    // Emergency preferences
    const emergencyMatch = xml.match(/<emergency>([\s\S]*?)<\/emergency>/)
    if (emergencyMatch) {
      preferences.emergency = {}
      const citizenshipMatch = emergencyMatch[1].match(/<citizenship>(.*?)<\/citizenship>/)
      const residenceMatch = emergencyMatch[1].match(/<residence>(.*?)<\/residence>/)
      const medicalMatch = emergencyMatch[1].match(/<medicalConditions>(.*?)<\/medicalConditions>/)
      if (citizenshipMatch) preferences.emergency.citizenship = citizenshipMatch[1]
      if (residenceMatch) preferences.emergency.residence = residenceMatch[1]
      if (medicalMatch) preferences.emergency.medicalConditions = medicalMatch[1]
    }

    // Cultural preferences
    const culturalMatch = xml.match(/<cultural>([\s\S]*?)<\/cultural>/)
    if (culturalMatch) {
      preferences.cultural = {}
      const eventsMatch = culturalMatch[1].match(/<interestedInEvents>(.*?)<\/interestedInEvents>/)
      const crowdMatch = culturalMatch[1].match(/<crowdPreference>(.*?)<\/crowdPreference>/)
      if (eventsMatch) preferences.cultural.interestedInEvents = eventsMatch[1] === 'true'
      if (crowdMatch) preferences.cultural.crowdPreference = crowdMatch[1] as any
    }

    // Activities preferences
    const activitiesMatch = xml.match(/<activities>([\s\S]*?)<\/activities>/)
    if (activitiesMatch) {
      preferences.activities = {}
      const paceMatch = activitiesMatch[1].match(/<activityPace>(.*?)<\/activityPace>/)
      const budgetMatch = activitiesMatch[1].match(/<dailyBudget>(.*?)<\/dailyBudget>/)
      if (paceMatch) preferences.activities.activityPace = paceMatch[1] as any
      if (budgetMatch) preferences.activities.dailyBudget = budgetMatch[1] as any
    }

    // Dining preferences
    const diningMatch = xml.match(/<dining>([\s\S]*?)<\/dining>/)
    if (diningMatch) {
      preferences.dining = {}
      const adventureMatch = diningMatch[1].match(/<adventurousness>(.*?)<\/adventurousness>/)
      const budgetMatch = diningMatch[1].match(/<mealBudget>(.*?)<\/mealBudget>/)
      if (adventureMatch) preferences.dining.adventurousness = adventureMatch[1] as any
      if (budgetMatch) preferences.dining.mealBudget = budgetMatch[1] as any
    }

    // Packing preferences
    const packingMatch = xml.match(/<packing>([\s\S]*?)<\/packing>/)
    if (packingMatch) {
      preferences.packing = {}
      const styleMatch = packingMatch[1].match(/<packingStyle>(.*?)<\/packingStyle>/)
      const gearMatch = packingMatch[1].match(/<hasGear>(.*?)<\/hasGear>/)
      if (styleMatch) preferences.packing.packingStyle = styleMatch[1] as any
      if (gearMatch) preferences.packing.hasGear = gearMatch[1] as any
    }

    return preferences
  } catch (error) {
    console.error('Error parsing preferences XML:', error)
    return {}
  }
}

/**
 * Serialize TripIntelligencePreferences object to XML string
 */
export function serializePreferencesXML(preferences: TripIntelligencePreferences): string {
  const parts: string[] = ['<tripIntelligencePreferences>']

  // Currency
  if (preferences.currency) {
    parts.push('  <currency>')
    if (preferences.currency.citizenship) {
      parts.push(`    <citizenship>${escapeXML(preferences.currency.citizenship)}</citizenship>`)
    }
    if (preferences.currency.residence) {
      parts.push(`    <residence>${escapeXML(preferences.currency.residence)}</residence>`)
    }
    parts.push('  </currency>')
  }

  // Emergency
  if (preferences.emergency) {
    parts.push('  <emergency>')
    if (preferences.emergency.citizenship) {
      parts.push(`    <citizenship>${escapeXML(preferences.emergency.citizenship)}</citizenship>`)
    }
    if (preferences.emergency.residence) {
      parts.push(`    <residence>${escapeXML(preferences.emergency.residence)}</residence>`)
    }
    if (preferences.emergency.medicalConditions) {
      parts.push(`    <medicalConditions>${escapeXML(preferences.emergency.medicalConditions)}</medicalConditions>`)
    }
    parts.push('  </emergency>')
  }

  // Cultural
  if (preferences.cultural) {
    parts.push('  <cultural>')
    if (preferences.cultural.interestedInEvents !== undefined) {
      parts.push(`    <interestedInEvents>${preferences.cultural.interestedInEvents}</interestedInEvents>`)
    }
    if (preferences.cultural.crowdPreference) {
      parts.push(`    <crowdPreference>${preferences.cultural.crowdPreference}</crowdPreference>`)
    }
    parts.push('  </cultural>')
  }

  // Activities
  if (preferences.activities) {
    parts.push('  <activities>')
    if (preferences.activities.activityPace) {
      parts.push(`    <activityPace>${preferences.activities.activityPace}</activityPace>`)
    }
    if (preferences.activities.dailyBudget) {
      parts.push(`    <dailyBudget>${preferences.activities.dailyBudget}</dailyBudget>`)
    }
    parts.push('  </activities>')
  }

  // Dining
  if (preferences.dining) {
    parts.push('  <dining>')
    if (preferences.dining.adventurousness) {
      parts.push(`    <adventurousness>${preferences.dining.adventurousness}</adventurousness>`)
    }
    if (preferences.dining.mealBudget) {
      parts.push(`    <mealBudget>${preferences.dining.mealBudget}</mealBudget>`)
    }
    parts.push('  </dining>')
  }

  // Packing
  if (preferences.packing) {
    parts.push('  <packing>')
    if (preferences.packing.packingStyle) {
      parts.push(`    <packingStyle>${preferences.packing.packingStyle}</packingStyle>`)
    }
    if (preferences.packing.hasGear) {
      parts.push(`    <hasGear>${preferences.packing.hasGear}</hasGear>`)
    }
    parts.push('  </packing>')
  }

  parts.push('</tripIntelligencePreferences>')
  return parts.join('\n')
}

/**
 * Update specific feature preferences in existing XML
 */
export function updateFeaturePreferences(
  existingXML: string | null,
  feature: keyof TripIntelligencePreferences,
  featurePrefs: any
): string {
  const current = parsePreferencesXML(existingXML)
  current[feature] = featurePrefs
  return serializePreferencesXML(current)
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

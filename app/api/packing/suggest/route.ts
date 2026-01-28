import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

interface ReservationAnalysis {
  accommodations: Array<{
    name: string
    type: string
    priceLevel?: number
  }>
  dining: Array<{
    name: string
    type: string
    priceLevel?: number
  }>
  activities: Array<{
    name: string
    type: string
  }>
  transportation: Array<{
    name: string
    type: string
  }>
}

interface TripCharacteristics {
  isSkiTrip: boolean
  isBeachTrip: boolean
  hasFormalDining: boolean
  hasUpscaleAccommodations: boolean
  hasActiveAdventures: boolean
  hasPhotographyOpportunities: boolean
  weatherExtremes: {
    veryCold: boolean
    veryHot: boolean
    rainy: boolean
  }
}

interface WeatherAnalysis {
  tempRange: { min: number; max: number }
  avgTemp: number
  precipitationDays: number
  conditions: string[]
}

export async function POST(request: Request) {
  try {
    const { trip, profile, weather, packingStyle, hasGear } = await request.json()
    
    // Save packing preferences if provided
    if (packingStyle && hasGear) {
      try {
        await fetch(`${process.env.NEXTAUTH_URL}/api/profile/intelligence-preferences`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feature: 'packing',
            preferences: { packingStyle, hasGear }
          })
        })
      } catch (error) {
        console.error('Error saving packing preferences:', error)
      }
    }
    
    // ===== ENHANCED PROFILE DATA EXTRACTION =====
    const activities = profile
      ?.filter((p: any) => p.value?.category?.slug?.startsWith('activities'))
      .map((p: any) => p.value.name) || []
    
    const dietary = profile
      ?.filter((p: any) => p.value?.category?.slug?.includes('dietary'))
      .map((p: any) => p.value.name) || []
    
    const travelStyle = profile
      ?.find((p: any) => p.value?.category?.slug === 'travel-style')
      ?.value.name || 'casual'
    
    // Extract hobbies from profile
    const hobbies = profile
      ?.filter((p: any) => p.value?.category?.slug === 'hobbies')
      .map((p: any) => p.value.name) || []
    
    // Extract spending priorities
    const spendingPriorities = profile
      ?.filter((p: any) => p.value?.category?.slug === 'spending-priorities')
      .map((p: any) => p.value.name) || []
    
    // ===== RESERVATION ANALYSIS =====
    const reservationAnalysis: ReservationAnalysis = {
      accommodations: [],
      dining: [],
      activities: [],
      transportation: []
    }
    
    trip.segments?.forEach((segment: any) => {
      segment.reservations?.forEach((res: any) => {
        const categoryName = res.categoryName?.toLowerCase() || ''
        const resType = res.description || res.type || ''
        
        if (categoryName.includes('stay') || res.type === 'hotel') {
          reservationAnalysis.accommodations.push({
            name: res.title,
            type: resType,
            priceLevel: res.priceLevel
          })
        } else if (categoryName.includes('dining') || res.type === 'restaurant') {
          reservationAnalysis.dining.push({
            name: res.title,
            type: resType,
            priceLevel: res.priceLevel
          })
        } else if (categoryName.includes('activity') || res.type === 'activity') {
          reservationAnalysis.activities.push({
            name: res.title,
            type: resType
          })
        } else if (categoryName.includes('travel') || categoryName.includes('transport') || res.type === 'transport' || res.type === 'flight') {
          reservationAnalysis.transportation.push({
            name: res.title,
            type: resType
          })
        }
      })
    })
    
    // ===== TRIP CHARACTERISTICS DETECTION =====
    const characteristics: TripCharacteristics = {
      isSkiTrip: false,
      isBeachTrip: false,
      hasFormalDining: false,
      hasUpscaleAccommodations: false,
      hasActiveAdventures: false,
      hasPhotographyOpportunities: false,
      weatherExtremes: {
        veryCold: false,
        veryHot: false,
        rainy: false
      }
    }
    
    // Detect ski trip
    characteristics.isSkiTrip = reservationAnalysis.accommodations.some(a => 
      a.type.toLowerCase().includes('ski resort') || a.type.toLowerCase().includes('ski')
    ) || reservationAnalysis.activities.some(a => 
      a.type.toLowerCase().includes('ski') || a.name.toLowerCase().includes('ski')
    )
    
    // Detect beach trip
    const destinations = trip.segments?.map((s: any) => s.endTitle?.toLowerCase() || '').join(' ') || ''
    characteristics.isBeachTrip = destinations.includes('beach') || 
      destinations.includes('coast') || 
      destinations.includes('island') ||
      reservationAnalysis.activities.some(a => 
        a.name.toLowerCase().includes('beach') || 
        a.name.toLowerCase().includes('snorkel') ||
        a.name.toLowerCase().includes('surf')
      )
    
    // Detect formal dining
    characteristics.hasFormalDining = reservationAnalysis.dining.some(d => 
      (d.priceLevel && d.priceLevel >= 3)
    )
    
    // Detect upscale accommodations
    characteristics.hasUpscaleAccommodations = reservationAnalysis.accommodations.some(a => 
      (a.priceLevel && a.priceLevel >= 3) || 
      a.type.toLowerCase().includes('resort') ||
      a.type.toLowerCase().includes('luxury')
    )
    
    // Detect active adventures
    characteristics.hasActiveAdventures = reservationAnalysis.activities.some(a => 
      a.type.toLowerCase().includes('hike') ||
      a.type.toLowerCase().includes('sport') ||
      a.type.toLowerCase().includes('adventure') ||
      a.type.toLowerCase().includes('excursion') ||
      a.name.toLowerCase().includes('trek') ||
      a.name.toLowerCase().includes('climb')
    )
    
    // Detect photography opportunities
    characteristics.hasPhotographyOpportunities = reservationAnalysis.activities.some(a => 
      a.type.toLowerCase().includes('museum') ||
      a.type.toLowerCase().includes('tour') ||
      a.name.toLowerCase().includes('scenic') ||
      a.name.toLowerCase().includes('viewpoint')
    ) || hobbies.some(h => h.toLowerCase().includes('photography'))
    
    // ===== WEATHER ANALYSIS =====
    const weatherAnalysis: WeatherAnalysis = {
      tempRange: { min: Infinity, max: -Infinity },
      avgTemp: 0,
      precipitationDays: 0,
      conditions: []
    }
    
    let tempSum = 0
    let tempCount = 0
    const conditionsSet = new Set<string>()
    
    weather?.forEach((w: any) => {
      w.forecast?.forEach((f: any) => {
        if (f.temp_min !== undefined) {
          weatherAnalysis.tempRange.min = Math.min(weatherAnalysis.tempRange.min, f.temp_min)
        }
        if (f.temp_max !== undefined) {
          weatherAnalysis.tempRange.max = Math.max(weatherAnalysis.tempRange.max, f.temp_max)
        }
        if (f.temp !== undefined) {
          tempSum += f.temp
          tempCount++
        }
        if (f.precipitation > 0.3) {
          weatherAnalysis.precipitationDays++
        }
        if (f.description) {
          conditionsSet.add(f.description)
        }
      })
    })
    
    weatherAnalysis.avgTemp = tempCount > 0 ? tempSum / tempCount : 20
    weatherAnalysis.conditions = Array.from(conditionsSet)
    
    // Detect weather extremes
    characteristics.weatherExtremes.veryCold = weatherAnalysis.tempRange.min < 5
    characteristics.weatherExtremes.veryHot = weatherAnalysis.tempRange.max > 30
    characteristics.weatherExtremes.rainy = weatherAnalysis.precipitationDays >= 2
    
    // ===== BUILD COMPREHENSIVE PROMPT =====
    
    // Build trip analysis summary
    const tripAnalysisSummary = []
    if (characteristics.isSkiTrip) tripAnalysisSummary.push('Ski trip with winter sports activities')
    if (characteristics.isBeachTrip) tripAnalysisSummary.push('Beach/coastal destination')
    if (characteristics.hasFormalDining) tripAnalysisSummary.push('Fine dining reservations requiring formal attire')
    if (characteristics.hasUpscaleAccommodations) tripAnalysisSummary.push('Upscale/luxury accommodations')
    if (characteristics.hasActiveAdventures) tripAnalysisSummary.push('Active outdoor adventures')
    if (characteristics.hasPhotographyOpportunities) tripAnalysisSummary.push('Photography opportunities')
    
    // Build accommodation details
    const accommodationDetails = reservationAnalysis.accommodations.length > 0
      ? reservationAnalysis.accommodations.map(a => {
          const priceIndicator = a.priceLevel ? '$'.repeat(a.priceLevel) : ''
          return `- ${a.name} (${a.type}${priceIndicator ? ', ' + priceIndicator : ''})`
        }).join('\n')
      : 'No specific accommodations booked yet'
    
    // Build dining details
    const diningDetails = reservationAnalysis.dining.length > 0
      ? reservationAnalysis.dining.map(d => {
          const priceIndicator = d.priceLevel ? '$'.repeat(d.priceLevel) : ''
          return `- ${d.name} (${d.type}${priceIndicator ? ', ' + priceIndicator : ''})`
        }).join('\n')
      : 'No specific dining reservations yet'
    
    // Build activity details
    const activityDetails = reservationAnalysis.activities.length > 0
      ? reservationAnalysis.activities.map(a => `- ${a.name} (${a.type})`).join('\n')
      : 'General sightseeing and exploration'
    
    // Build detailed weather summary
    const weatherSummary = weather?.map((w: any) => {
      const forecasts = w.forecast || []
      if (forecasts.length === 0) return `${w.location}: Moderate weather expected`
      
      const temps = forecasts.map((f: any) => f.temp).filter((t: any) => t !== undefined)
      const minTemp = Math.min(...temps)
      const maxTemp = Math.max(...temps)
      const descriptions = forecasts.map((f: any) => f.description).filter(Boolean)
      const precipitation = forecasts.filter((f: any) => f.precipitation > 0.3).length
      
      return `${w.location}: ${minTemp}°C to ${maxTemp}°C, ${descriptions[0] || 'varied conditions'}${precipitation > 0 ? `, ${precipitation} days with rain` : ''}`
    }).join('\n') || 'Moderate temperatures expected'
    
    const prompt = `You are an expert packing consultant with years of experience helping travelers prepare for trips. Generate a comprehensive, highly detailed packing list with SPECIFIC REASONING for every single item.

TRIP OVERVIEW:
- Name: ${trip.title}
- Duration: ${trip.dayCount} days
- Destinations: ${trip.segments?.map((s: any) => s.endTitle).join(', ') || 'Multiple destinations'}

TRIP CHARACTERISTICS:
${tripAnalysisSummary.length > 0 ? tripAnalysisSummary.map(t => `- ${t}`).join('\n') : '- General leisure travel'}

ACCOMMODATIONS:
${accommodationDetails}

DINING RESERVATIONS:
${diningDetails}

PLANNED ACTIVITIES:
${activityDetails}

WEATHER FORECAST:
${weatherSummary}

USER PROFILE:
- Travel Style: ${travelStyle}
- Packing Style: ${packingStyle || 'moderate'}
- Has Travel Gear: ${hasGear || 'some'}
- Hobbies & Interests: ${hobbies.length > 0 ? hobbies.join(', ') : 'Not specified'}
- Spending Priorities: ${spendingPriorities.length > 0 ? spendingPriorities.join(', ') : 'Not specified'}
- Dietary Considerations: ${dietary.length > 0 ? dietary.join(', ') : 'None specified'}
- Profile Activities: ${activities.length > 0 ? activities.join(', ') : 'General interests'}

CRITICAL REQUIREMENTS:
1. For EVERY item, provide DETAILED, SPECIFIC reasoning that references:
   - Specific reservations by name (e.g., "For your stay at [Hotel Name]...")
   - Actual weather conditions (e.g., "Temperatures dropping to 5°C on Day 3...")
   - User's hobbies and interests (e.g., "Since you enjoy photography...")
   - Formality requirements (e.g., "Your dinner at [Restaurant Name] ($$$) requires...")

2. Think comprehensively about EVERYTHING the traveler might need:
   - Consider the specific activities booked
   - Account for weather variations throughout the trip
   - Include items for special interests (camera gear for photographers, etc.)
   - Don't forget practical items (adapters, medications, etc.)

3. PACKING STYLE ADJUSTMENTS:
   - If "light" packer: Emphasize multi-use items, minimal quantities, versatile pieces
   - If "moderate": Balanced approach with some extras
   - If "everything": Include backup items, comfort items, "just in case" gear

4. GEAR OWNERSHIP ADJUSTMENTS:
   - If "lots" of gear: Recommend specialized travel items (packing cubes, compression bags, travel towel)
   - If "some" basics: Mix of specialized and regular items
   - If "none" gear: Suggest budget-friendly alternatives:
     * Plastic ziplock bags instead of packing cubes (for organization and laundry)
     * Regular backpack instead of travel-specific pack
     * Regular items instead of travel-sized versions
     * Emphasize items they likely already own

5. For ski trips: Include ski-specific clothing and gear with explanations
6. For beach trips: Include beach essentials (sunscreen, swimwear, etc.) with reasons
7. For formal dining: Specify appropriate attire for upscale restaurants
8. For photography enthusiasts: Include camera equipment and backup batteries

LUGGAGE STRATEGY:
Recommend specific bags and organization strategy:
- How many bags (carry-on, checked, backpack, etc.)
- What to pack in each bag
- Weight distribution tips
- Organization strategy

PACKING TIPS:
Provide expert packing advice specific to this trip:
- Packing cubes, compression bags, etc.
- Rolling vs folding techniques
- Space-saving strategies
- Keeping items wrinkle-free
- Packing order recommendations

OUTPUT FORMAT (JSON):
{
  "clothing": [
    { "name": "specific item", "quantity": "number", "reason": "DETAILED reason referencing specific trip elements" }
  ],
  "footwear": [
    { "name": "specific item", "quantity": "number", "reason": "DETAILED reason for this specific trip" }
  ],
  "gear": [
    { "name": "specific item", "quantity": "number", "reason": "DETAILED reason based on activities/hobbies" }
  ],
  "toiletries": [
    { "name": "specific item", "quantity": "number", "reason": "DETAILED reason including any special needs" }
  ],
  "documents": [
    { "name": "specific item", "reason": "DETAILED reason for this trip" }
  ],
  "luggageStrategy": {
    "bags": [
      { "type": "bag type", "reason": "why this bag is needed" }
    ],
    "organization": "Detailed multi-sentence explanation of how to organize items across bags",
    "tips": ["Specific tip 1", "Specific tip 2", "Specific tip 3"]
  },
  "specialNotes": [
    "Personalized note based on user profile or trip characteristics",
    "Activity-specific reminder",
    "Weather-related advisory"
  ]
}

Be thorough and think of everything. Include 6-12 items per category. Make every reason specific and valuable.`

    const { text } = await generateText({
      model: openai('gpt-4-turbo'),
      prompt,
      temperature: 0.7,
    })
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON from AI response')
    }
    
    const packingList = JSON.parse(jsonMatch[0])
    
    return NextResponse.json(packingList)
  } catch (error) {
    console.error('Packing suggestion error:', error)
    
    // Return fallback packing list
    return NextResponse.json({
      clothing: [
        { name: "T-shirts", quantity: "3-4", reason: "Daily wear for warm weather" },
        { name: "Long pants", quantity: "2", reason: "Versatile for various activities" },
        { name: "Light jacket", quantity: "1", reason: "For cooler evenings" },
        { name: "Comfortable shoes", quantity: "1 pair", reason: "For walking and sightseeing" },
      ],
      footwear: [
        { name: "Walking shoes", quantity: "1 pair", reason: "Comfortable for sightseeing" },
        { name: "Sandals", quantity: "1 pair", reason: "For casual wear" },
      ],
      gear: [
        { name: "Day backpack", quantity: "1", reason: "For daily excursions" },
        { name: "Water bottle", quantity: "1", reason: "Stay hydrated while exploring" },
        { name: "Phone charger", quantity: "1", reason: "Keep devices charged" },
      ],
      toiletries: [
        { name: "Toothbrush & toothpaste", quantity: "1 set", reason: "Essential hygiene" },
        { name: "Sunscreen", quantity: "1", reason: "Sun protection" },
        { name: "Basic medications", quantity: "as needed", reason: "Health essentials" },
      ],
      documents: [
        { name: "Passport", reason: "Essential travel document" },
        { name: "Travel insurance", reason: "Coverage for unexpected events" },
        { name: "Booking confirmations", reason: "Proof of reservations" },
      ],
      luggageStrategy: {
        bags: [
          { type: "Carry-on suitcase", reason: "For main clothing and essentials" }
        ],
        organization: "Pack heavier items at the bottom, use packing cubes for organization.",
        tips: ["Roll clothes to save space", "Keep essentials in carry-on", "Use packing cubes"]
      },
      specialNotes: [
        "Check weather forecast closer to departure",
        "Verify passport validity"
      ]
    })
  }
}

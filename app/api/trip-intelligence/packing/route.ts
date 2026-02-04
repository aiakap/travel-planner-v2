import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

interface PackingRequest {
  tripId: string
  packingStyle: string
  hasGear: string
}

// Zod schema for packing list response with required bags array
const packingListResponseSchema = z.object({
  categories: z.array(
    z.object({
      category: z.string(),
      items: z.array(
        z.object({
          itemName: z.string(),
          quantity: z.string(),
          reason: z.string(),
          priority: z.string(),
          weatherBased: z.boolean(),
          profileBased: z.boolean(),
          relevanceScore: z.number(),
          profileReferences: z.array(
            z.object({
              category: z.string(),
              value: z.string(),
              relevance: z.string(),
            })
          ),
        })
      ),
    })
  ),
  luggageStrategy: z.object({
    bags: z.array(
      z.object({
        type: z.string(),
        reason: z.string(),
      })
    ),
    organization: z.string(),
    tips: z.array(z.string()),
  }),
  overallRelevanceScore: z.number(),
  reasoning: z.string(),
})

/**
 * POST /api/trip-intelligence/packing
 * 
 * Generate packing list for a trip
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: PackingRequest = await request.json()
    const { tripId, packingStyle, hasGear } = body

    if (!tripId || !packingStyle || !hasGear) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save preferences to user profile
    await fetch(`${process.env.NEXTAUTH_URL}/api/profile/intelligence-preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature: 'packing',
        preferences: { packingStyle, hasGear }
      })
    })

    // Get trip with segments and reservations
    const trip = await prisma.trip.findUnique({
      where: { id: tripId, userId: session.user.id },
      include: {
        segments: {
          include: {
            segmentType: true,
            reservations: {
              include: {
                reservationType: {
                  include: { category: true }
                },
                reservationStatus: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Fetch weather data for all segments
    const weatherPromises = trip.segments.map(seg =>
      fetch(`${process.env.NEXTAUTH_URL}/api/weather/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: seg.endLat,
          lng: seg.endLng,
          dates: { start: seg.startDate, end: seg.endDate }
        })
      })
        .then(r => r.json())
        .catch(() => null)
    )

    const weatherData = await Promise.all(weatherPromises)
    const validWeather = weatherData.filter(Boolean)

    // Analyze weather conditions
    const temperatures = validWeather.flatMap((w: any) =>
      w.daily?.map((d: any) => d.temp?.max || d.temp) || []
    ).filter(Boolean)

    const avgTemp = temperatures.length > 0
      ? temperatures.reduce((a: number, b: number) => a + b, 0) / temperatures.length
      : null

    const minTemp = temperatures.length > 0 ? Math.min(...temperatures) : null
    const maxTemp = temperatures.length > 0 ? Math.max(...temperatures) : null

    const hasRain = validWeather.some((w: any) =>
      w.daily?.some((d: any) => d.weather?.[0]?.main === 'Rain' || d.pop > 0.3)
    )

    const hasSnow = validWeather.some((w: any) =>
      w.daily?.some((d: any) => d.weather?.[0]?.main === 'Snow')
    )

    // Get user profile for activities and preferences
    const profileValues = await prisma.userProfileValue.findMany({
      where: { userId: session.user.id },
      include: {
        value: {
          include: {
            category: {
              include: {
                parent: {
                  include: { parent: true }
                }
              }
            }
          }
        }
      }
    })

    const hobbies = profileValues
      .filter(pv =>
        pv.value.category.slug?.includes('hobby') ||
        pv.value.category.slug?.includes('activity') ||
        pv.value.category.slug?.includes('interest')
      )
      .map(pv => pv.value.value)

    const outdoorActivities = hobbies.filter(h =>
      h.toLowerCase().includes('hiking') ||
      h.toLowerCase().includes('beach') ||
      h.toLowerCase().includes('outdoor') ||
      h.toLowerCase().includes('swim') ||
      h.toLowerCase().includes('sport')
    )

    const hasPhotography = hobbies.some(h =>
      h.toLowerCase().includes('photo')
    )

    const spendingStyle = profileValues
      .filter(pv =>
        pv.value.category.slug?.includes('spending') ||
        pv.value.category.slug?.includes('budget')
      )
      .map(pv => pv.value.value)

    const isBudgetConscious = spendingStyle.some(s =>
      s.toLowerCase().includes('budget') ||
      s.toLowerCase().includes('frugal') ||
      s.toLowerCase().includes('economical')
    )

    // Analyze trip activities
    const activities = trip.segments.flatMap(seg =>
      seg.reservations
        .filter(res => res.reservationType.category.name === 'Activity')
        .map(res => res.name)
    )

    const hasActiveActivities = activities.some(act =>
      act.toLowerCase().includes('hike') ||
      act.toLowerCase().includes('sport') ||
      act.toLowerCase().includes('swim') ||
      act.toLowerCase().includes('bike')
    )

    const hasFormalEvents = activities.some(act =>
      act.toLowerCase().includes('dinner') ||
      act.toLowerCase().includes('theater') ||
      act.toLowerCase().includes('opera') ||
      act.toLowerCase().includes('gala')
    )

    // Build destinations summary
    const destinations = Array.from(
      new Set(trip.segments.map(s => s.endTitle))
    ).join(', ')

    const duration = Math.ceil(
      (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
    )

    // Build weather summary
    const weatherSummary = avgTemp
      ? `Average: ${avgTemp.toFixed(0)}°F (${minTemp?.toFixed(0)}°F - ${maxTemp?.toFixed(0)}°F). ${hasRain ? 'Rain expected.' : ''} ${hasSnow ? 'Snow possible.' : ''}`
      : 'Weather data unavailable'

    // Generate AI packing recommendations
    const prompt = `You are an expert travel packing advisor. Generate a comprehensive packing list for this trip.

TRIP OVERVIEW:
- Title: ${trip.title}
- Duration: ${duration} days
- Destinations: ${destinations}
- Weather: ${weatherSummary}

TRAVELER PROFILE:
- Packing Style: ${packingStyle === 'light' ? 'Light packer - minimalist' : packingStyle === 'moderate' ? 'Moderate - balanced' : 'Bring everything - cautious'}
- Has Travel Gear: ${hasGear === 'lots' ? 'Lots of specialized gear' : hasGear === 'some' ? 'Some basics' : 'No specialized gear'}
- Budget Conscious: ${isBudgetConscious ? 'Yes' : 'No'}
- Hobbies: ${hobbies.length > 0 ? hobbies.join(', ') : 'Not specified'}
- Outdoor Activities: ${outdoorActivities.length > 0 ? 'Yes - ' + outdoorActivities.join(', ') : 'No'}
- Photography Interest: ${hasPhotography ? 'Yes' : 'No'}

TRIP ACTIVITIES:
- Booked Activities: ${activities.length > 0 ? activities.join(', ') : 'None booked yet'}
- Active/Outdoor Activities: ${hasActiveActivities ? 'Yes' : 'No'}
- Formal Events: ${hasFormalEvents ? 'Yes' : 'No'}

PACKING REQUIREMENTS:
1. Tailor to packing style (light = fewer items, essentials only; moderate = balanced; everything = comprehensive)
2. Match gear recommendations to what traveler owns (${hasGear})
   - If "none": Suggest regular items, plastic bags instead of packing cubes, DIY solutions
   - If "some": Mix of basic gear and regular items
   - If "lots": Assume full travel gear arsenal available
3. Weather-appropriate clothing (${weatherSummary})
4. Activity-specific items for hobbies and booked activities
5. Budget-conscious alternatives if traveler is budget-minded

Generate packing list organized by category: Clothing, Toiletries, Electronics, Documents, Activity Gear, Health & Safety, Miscellaneous.

For each item:
- Specify quantity appropriate to packing style and trip duration
- Explain WHY it's recommended (weather, activities, profile match)
- Mark priority: Essential, Recommended, or Optional
- Note if weather-based or profile-based

Calculate relevance score (0-100):
- Base: 40 (packing always relevant)
- +20 if outdoor activities or active hobbies (need specialized items)
- +15 if photography interest (camera gear important)
- +10 if formal events planned (need dress clothes)
- +15 if budget conscious (appreciate money-saving alternatives)

OUTPUT FORMAT (JSON):
{
  "categories": [
    {
      "category": "Clothing",
      "items": [
        {
          "itemName": "Lightweight rain jacket",
          "quantity": "1",
          "reason": "Rain expected during trip. Packable and versatile.",
          "priority": "Essential",
          "weatherBased": true,
          "profileBased": false,
          "relevanceScore": 90,
          "profileReferences": []
        },
        {
          "itemName": "Hiking boots",
          "quantity": "1 pair",
          "reason": "You have hiking activities booked and enjoy outdoor activities.",
          "priority": "Essential",
          "weatherBased": false,
          "profileBased": true,
          "relevanceScore": 95,
          "profileReferences": [
            {
              "category": "Hobbies",
              "value": "Hiking",
              "relevance": "Essential footwear for your hiking activities"
            }
          ]
        }
      ]
    }
  ],
  "luggageStrategy": {
    "bags": [
      {
        "type": "Carry-on suitcase",
        "reason": "Perfect for your ${duration}-day trip with ${packingStyle} packing style"
      },
      {
        "type": "Personal item backpack",
        "reason": "Keep essentials accessible during travel"
      }
    ],
    "organization": "Use packing cubes or plastic bags to organize by category. Roll clothes to maximize space.",
    "tips": [
      "Roll clothes to save space",
      "Use plastic bags for organization (budget alternative to packing cubes)",
      "Wear bulkiest items on plane"
    ]
  },
  "overallRelevanceScore": 85,
  "reasoning": "Comprehensive explanation of packing recommendations based on weather, activities, and traveler profile."
}

Be specific and reference actual trip details, weather, and profile items. ${isBudgetConscious ? 'Emphasize budget-friendly alternatives like plastic bags, multipurpose items, and borrowing vs buying.' : ''} ${hasGear === 'none' ? 'Focus on regular household items and DIY solutions since traveler has no specialized gear.' : ''}

IMPORTANT: The luggageStrategy.bags array MUST contain at least one bag recommendation. Each bag should have a type (e.g., "Carry-on suitcase", "Backpack", "Checked bag") and a reason explaining why it's recommended for this trip.`

    console.log('🔵 [PACKING API DEBUG] Step 1: Prompt generated')
    console.log('🔵 [PACKING API DEBUG] Prompt length:', prompt.length)
    console.log('🔵 [PACKING API DEBUG] Prompt preview (first 500 chars):', prompt.substring(0, 500))
    console.log('🔵 [PACKING API DEBUG] Prompt preview (last 500 chars):', prompt.substring(prompt.length - 500))

    let result
    try {
      console.log('🔵 [PACKING API DEBUG] Step 2: Calling generateObject...')
      console.log('🔵 [PACKING API DEBUG] Model: gpt-4o')
      console.log('🔵 [PACKING API DEBUG] Schema name: PackingListResponse')
      
      result = await generateObject({
        model: openai('gpt-4o'),
        schema: packingListResponseSchema,
        prompt,
        temperature: 0.7,
        mode: 'json',
        schemaName: 'PackingListResponse',
        schemaDescription: 'Comprehensive packing list with categories, items, luggage strategy, and recommendations',
      })
      
      console.log('🔵 [PACKING API DEBUG] Step 3: generateObject completed successfully')
      console.log('🔵 [PACKING API DEBUG] Result object keys:', Object.keys(result.object))
    } catch (schemaError: any) {
      console.error('🔴 [PACKING API DEBUG] Schema validation error:', schemaError)
      console.error('🔴 [PACKING API DEBUG] Error name:', schemaError?.name)
      console.error('🔴 [PACKING API DEBUG] Error message:', schemaError?.message)
      console.error('🔴 [PACKING API DEBUG] Error details:', JSON.stringify(schemaError, null, 2))
      if (schemaError.cause) {
        console.error('🔴 [PACKING API DEBUG] Error cause:', schemaError.cause)
      }
      if (schemaError.stack) {
        console.error('🔴 [PACKING API DEBUG] Error stack:', schemaError.stack)
      }
      throw new Error(`Failed to generate packing list: ${schemaError.message || 'Schema validation failed'}`)
    }

    const aiResponse = result.object
    console.log('🔵 [PACKING API DEBUG] Step 4: AI response received')
    console.log('🔵 [PACKING API DEBUG] Categories count:', aiResponse.categories?.length || 0)
    console.log('🔵 [PACKING API DEBUG] Luggage strategy:', JSON.stringify(aiResponse.luggageStrategy, null, 2))
    console.log('🔵 [PACKING API DEBUG] Bags count:', aiResponse.luggageStrategy?.bags?.length || 0)

    // Ensure bags array has at least one item (post-validation normalization)
    if (!aiResponse.luggageStrategy.bags || aiResponse.luggageStrategy.bags.length === 0) {
      console.warn('🔴 [PACKING API DEBUG] Generated luggageStrategy has no bags, adding default recommendation')
      aiResponse.luggageStrategy.bags = [
        {
          type: 'Carry-on suitcase',
          reason: 'Recommended for your trip duration and packing style'
        }
      ]
      console.log('🔵 [PACKING API DEBUG] Added default bag recommendation')
    }
    
    console.log('🔵 [PACKING API DEBUG] Step 5: Final luggageStrategy after normalization:', JSON.stringify(aiResponse.luggageStrategy, null, 2))

    // Create or update TripIntelligence record
    let intelligence = await prisma.tripIntelligence.findUnique({
      where: { tripId }
    })

    if (!intelligence) {
      intelligence = await prisma.tripIntelligence.create({
        data: {
          tripId,
          hasPackingList: true,
          packingGeneratedAt: new Date()
        }
      })
    } else {
      // Delete old packing list
      await prisma.packingList.deleteMany({
        where: { intelligenceId: intelligence.id }
      })

      intelligence = await prisma.tripIntelligence.update({
        where: { id: intelligence.id },
        data: {
          hasPackingList: true,
          packingGeneratedAt: new Date()
        }
      })
    }

    // Save packing list to database
    const savedItems = await Promise.all(
      aiResponse.categories.flatMap((cat: any) =>
        cat.items.map((item: any) =>
          prisma.packingList.create({
            data: {
              intelligenceId: intelligence!.id,
              category: cat.category,
              itemName: item.itemName,
              quantity: item.quantity,
              reason: item.reason,
              priority: item.priority,
              weatherBased: item.weatherBased,
              profileBased: item.profileBased,
              reasoning: aiResponse.reasoning,
              relevanceScore: item.relevanceScore,
              profileReferences: item.profileReferences || []
            }
          })
        )
      )
    )

    const responseData = {
      success: true,
      packingList: savedItems,
      luggageStrategy: aiResponse.luggageStrategy,
      overallRelevanceScore: aiResponse.overallRelevanceScore
    }
    
    console.log('🔵 [PACKING API DEBUG] Step 6: Preparing response')
    console.log('🔵 [PACKING API DEBUG] Saved items count:', savedItems.length)
    console.log('🔵 [PACKING API DEBUG] Response luggageStrategy:', JSON.stringify(responseData.luggageStrategy, null, 2))
    
    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('Error generating packing list:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error message:', error?.message)
    return NextResponse.json(
      { 
        error: 'Failed to generate packing list',
        details: error?.message || 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/trip-intelligence/packing?tripId=xxx
 * 
 * Retrieve existing packing list for a trip
 */
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId')

    if (!tripId) {
      return NextResponse.json({ error: 'Missing tripId' }, { status: 400 })
    }

    // Verify trip ownership
    const trip = await prisma.trip.findUnique({
      where: { id: tripId, userId: session.user.id }
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Get intelligence record
    const intelligence = await prisma.tripIntelligence.findUnique({
      where: { tripId },
      include: {
        packingList: {
          orderBy: [
            { category: 'asc' },
            { priority: 'asc' }
          ]
        }
      }
    })

    if (!intelligence || !intelligence.hasPackingList) {
      return NextResponse.json({ packingList: null })
    }

    // Group items by category
    const categorizedItems = intelligence.packingList.reduce((acc: any, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    }, {})

    return NextResponse.json({
      packingList: categorizedItems,
      generatedAt: intelligence.packingGeneratedAt
    })
  } catch (error) {
    console.error('Error fetching packing list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch packing list' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/trip-intelligence/packing?tripId=xxx
 * 
 * Clear existing packing list for a trip
 */
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId')

    if (!tripId) {
      return NextResponse.json({ error: 'Missing tripId' }, { status: 400 })
    }

    // Verify trip ownership
    const trip = await prisma.trip.findUnique({
      where: { id: tripId, userId: session.user.id }
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Find and update intelligence record
    const intelligence = await prisma.tripIntelligence.findUnique({
      where: { tripId }
    })

    if (intelligence) {
      // Delete packing list items
      await prisma.packingList.deleteMany({
        where: { intelligenceId: intelligence.id }
      })

      // Update intelligence record
      await prisma.tripIntelligence.update({
        where: { id: intelligence.id },
        data: {
          hasPackingList: false,
          packingGeneratedAt: null
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing packing list:', error)
    return NextResponse.json(
      { error: 'Failed to clear packing list' },
      { status: 500 }
    )
  }
}

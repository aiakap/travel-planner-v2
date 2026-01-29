import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

interface PackingRequest {
  tripId: string
  packingStyle: string
  hasGear: string
}

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
    "recommendedBag": "Description based on packing style and gear ownership",
    "packingTips": [
      "Roll clothes to save space",
      "Use plastic bags for organization (budget alternative to packing cubes)",
      "Wear bulkiest items on plane"
    ]
  },
  "overallRelevanceScore": 85,
  "reasoning": "Comprehensive explanation of packing recommendations based on weather, activities, and traveler profile."
}

Be specific and reference actual trip details, weather, and profile items. ${isBudgetConscious ? 'Emphasize budget-friendly alternatives like plastic bags, multipurpose items, and borrowing vs buying.' : ''} ${hasGear === 'none' ? 'Focus on regular household items and DIY solutions since traveler has no specialized gear.' : ''}`

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

    const aiResponse = JSON.parse(jsonMatch[0])

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

    return NextResponse.json({
      success: true,
      packingList: savedItems,
      luggageStrategy: aiResponse.luggageStrategy,
      overallRelevanceScore: aiResponse.overallRelevanceScore
    })
  } catch (error) {
    console.error('Error generating packing list:', error)
    return NextResponse.json(
      { error: 'Failed to generate packing list' },
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

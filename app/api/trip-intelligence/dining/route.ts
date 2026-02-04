import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

interface DiningRequest {
  tripId: string
  adventurousness: 'safe' | 'somewhat' | 'very'
  mealBudget: '$' | '$$' | '$$$' | '$$$$'
}

/**
 * POST /api/trip-intelligence/dining
 * 
 * Generate dining recommendations for a trip
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: DiningRequest = await request.json()
    const { tripId, adventurousness, mealBudget } = body

    if (!tripId || !adventurousness || !mealBudget) {
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
        feature: 'dining',
        preferences: { adventurousness, mealBudget }
      })
    })

    // Get trip with segments and accommodations
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
              },
              orderBy: { startTime: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Get user profile for cuisine preferences and dietary restrictions
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

    const cuisinePreferences = profileValues
      .filter(pv => pv.value.category.slug?.includes('cuisine'))
      .map(pv => pv.value.value)

    const dietaryRestrictions = profileValues
      .filter(pv => pv.value.category.slug?.includes('dietary'))
      .map(pv => pv.value.value)

    const diningStyle = profileValues
      .filter(pv => pv.value.category.slug?.includes('dining-style'))
      .map(pv => pv.value.value)

    // Identify meal times without dining reservations
    const mealOpportunities: Array<{
      segmentId: string
      dayNumber: number
      mealType: 'breakfast' | 'lunch' | 'dinner'
      time: Date
      location: string
      accommodationName?: string
    }> = []

    let dayNumber = 1

    trip.segments.forEach(segment => {
      if (!segment.startTime || !segment.endTime) return

      const segmentStart = new Date(segment.startTime)
      const segmentEnd = new Date(segment.endTime)
      
      // Get accommodation for this segment
      const accommodation = segment.reservations.find(r => 
        r.reservationType.category.name === 'Stay'
      )

      // Check for existing dining reservations
      const diningReservations = segment.reservations.filter(r => 
        r.reservationType.category.name === 'Dining'
      )

      // Generate meal times for each day in segment
      let currentDate = new Date(segmentStart)
      while (currentDate <= segmentEnd) {
        const hasDinner = diningReservations.some(r => {
          if (!r.startTime) return false
          const resTime = new Date(r.startTime)
          return resTime.toDateString() === currentDate.toDateString() && 
                 resTime.getHours() >= 17
        })

        const hasLunch = diningReservations.some(r => {
          if (!r.startTime) return false
          const resTime = new Date(r.startTime)
          return resTime.toDateString() === currentDate.toDateString() && 
                 resTime.getHours() >= 11 && resTime.getHours() < 15
        })

        if (!hasDinner) {
          mealOpportunities.push({
            segmentId: segment.id,
            dayNumber,
            mealType: 'dinner',
            time: new Date(currentDate.setHours(19, 0, 0, 0)),
            location: segment.endTitle,
            accommodationName: accommodation?.name
          })
        }

        if (!hasLunch) {
          mealOpportunities.push({
            segmentId: segment.id,
            dayNumber,
            mealType: 'lunch',
            time: new Date(currentDate.setHours(12, 30, 0, 0)),
            location: segment.endTitle,
            accommodationName: accommodation?.name
          })
        }

        currentDate.setDate(currentDate.getDate() + 1)
        dayNumber++
      }
    })

    if (mealOpportunities.length === 0) {
      return NextResponse.json({
        success: true,
        recommendations: [],
        message: 'All meals already have reservations'
      })
    }

    // Fetch Yelp recommendations for each location
    const yelpApiKey = process.env.YELP_API_KEY
    const yelpRecommendations: Record<string, any[]> = {}

    for (const location of new Set(mealOpportunities.map(m => m.location))) {
      try {
        if (yelpApiKey) {
          const response = await fetch(
            `https://api.yelp.com/v3/businesses/search?location=${encodeURIComponent(location)}&categories=restaurants&limit=10&price=${mealBudget}`,
            {
              headers: {
                Authorization: `Bearer ${yelpApiKey}`,
                'Content-Type': 'application/json'
              }
            }
          )

          if (response.ok) {
            const data = await response.json()
            yelpRecommendations[location] = data.businesses || []
          }
        }
      } catch (error) {
        console.error(`Error fetching Yelp data for ${location}:`, error)
      }
    }

    // Build meal opportunities summary
    const mealsSummary = mealOpportunities.slice(0, 10).map(meal => 
      `Day ${meal.dayNumber}, ${meal.mealType}: ${meal.location}${meal.accommodationName ? ` (near ${meal.accommodationName})` : ''}`
    ).join('\n')

    // Generate AI recommendations
    const prompt = `You are an expert dining advisor. Generate personalized restaurant recommendations for this trip.

TRIP OVERVIEW:
- Title: ${trip.title}
- Destinations: ${trip.segments.map(s => s.endTitle).join(', ')}

TRAVELER PROFILE:
- Food Adventurousness: ${adventurousness}
- Meal Budget: ${mealBudget}
- Cuisine Preferences: ${cuisinePreferences.length > 0 ? cuisinePreferences.join(', ') : 'Open to all cuisines'}
- Dietary Restrictions: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'None'}
- Dining Style: ${diningStyle.length > 0 ? diningStyle.join(', ') : 'Flexible'}

MEAL OPPORTUNITIES (no reservations yet):
${mealsSummary}

${Object.keys(yelpRecommendations).length > 0 ? `
YELP TOP RESTAURANTS:
${Object.entries(yelpRecommendations).map(([loc, businesses]) => 
  `${loc}:\n${businesses.slice(0, 3).map(b => `- ${b.name} (${b.rating}⭐, ${b.price || '$$'}, ${b.categories?.map((c: any) => c.title).join(', ')})`).join('\n')}`
).join('\n\n')}
` : ''}

For EACH meal opportunity (up to 10), recommend ONE restaurant that:
1. Matches the budget (${mealBudget})
2. Accommodates dietary restrictions
3. Fits the adventurousness level
4. Is appropriate for the meal type
5. Preferably from the Yelp list if available

For each recommendation, provide:
- Restaurant name
- Cuisine type
- Price range
- Location/address
- Distance from accommodation (if known)
- Description and why it's great
- Specialties (signature dishes)
- Which dietary restrictions it accommodates

Calculate a relevance score (0-100) based on:
- Base: 50
- +20 per cuisine preference match
- +15 per dietary restriction accommodation
- +10 if price range matches budget
- +10 if dining style matches (fine dining → upscale restaurants)

OUTPUT FORMAT (JSON):
{
  "recommendations": [
    {
      "dayNumber": 1,
      "mealType": "dinner",
      "restaurantName": "Sukiyabashi Jiro",
      "cuisineType": "Japanese Sushi",
      "priceRange": "$$$$",
      "location": "Ginza, Tokyo",
      "distance": "0.5 miles from your hotel",
      "description": "World-renowned sushi restaurant...",
      "specialties": ["Omakase", "Fresh sashimi", "Traditional nigiri"],
      "dietaryMatch": ["Pescatarian-friendly"],
      "reasoning": "Matches your interest in authentic Japanese cuisine...",
      "relevanceScore": 90,
      "profileReferences": [
        {
          "category": "Cuisine Preferences",
          "value": "Japanese",
          "relevance": "Direct match with your favorite cuisine"
        }
      ]
    }
  ]
}

Be specific and reference actual Yelp restaurants when available. Only recommend restaurants that match the criteria.`

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
          hasDiningRecommendations: true,
          diningGeneratedAt: new Date()
        }
      })
    } else {
      // Delete old dining recommendations
      await prisma.diningRecommendation.deleteMany({
        where: { intelligenceId: intelligence.id }
      })

      intelligence = await prisma.tripIntelligence.update({
        where: { id: intelligence.id },
        data: {
          hasDiningRecommendations: true,
          diningGeneratedAt: new Date()
        }
      })
    }

    // Save dining recommendations to database
    const savedRecommendations = await Promise.all(
      aiResponse.recommendations.map((rec: any) => {
        const meal = mealOpportunities.find(m => 
          m.dayNumber === rec.dayNumber && m.mealType === rec.mealType
        )

        // Try to find Yelp ID if restaurant name matches
        const yelpBusiness = yelpRecommendations[meal?.location || '']?.find(b => 
          b.name.toLowerCase().includes(rec.restaurantName.toLowerCase()) ||
          rec.restaurantName.toLowerCase().includes(b.name.toLowerCase())
        )

        return prisma.diningRecommendation.create({
          data: {
            intelligenceId: intelligence!.id,
            segmentId: meal?.segmentId || null,
            dayNumber: rec.dayNumber,
            mealType: rec.mealType,
            restaurantName: rec.restaurantName,
            cuisineType: rec.cuisineType,
            priceRange: rec.priceRange,
            location: rec.location,
            distance: rec.distance,
            yelpId: yelpBusiness?.id || null,
            yelpUrl: yelpBusiness?.url || null,
            yelpRating: yelpBusiness?.rating || null,
            yelpReviewCount: yelpBusiness?.review_count || null,
            description: rec.description,
            specialties: rec.specialties,
            dietaryMatch: rec.dietaryMatch,
            reasoning: rec.reasoning,
            relevanceScore: rec.relevanceScore,
            profileReferences: rec.profileReferences || []
          }
        })
      })
    )

    return NextResponse.json({
      success: true,
      recommendations: savedRecommendations,
      mealsAnalyzed: mealOpportunities.length
    })
  } catch (error) {
    console.error('Error generating dining recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to generate dining recommendations' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/trip-intelligence/dining?tripId=xxx
 * 
 * Retrieve existing dining recommendations for a trip
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
        diningRecommendations: {
          orderBy: [
            { dayNumber: 'asc' },
            { mealType: 'asc' }
          ]
        }
      }
    })

    if (!intelligence || !intelligence.hasDiningRecommendations) {
      return NextResponse.json({ recommendations: null })
    }

    return NextResponse.json({
      recommendations: intelligence.diningRecommendations,
      generatedAt: intelligence.diningGeneratedAt
    })
  } catch (error) {
    console.error('Error fetching dining recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dining recommendations' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/trip-intelligence/dining?tripId=xxx
 * 
 * Clear existing dining recommendations for a trip
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

    const trip = await prisma.trip.findUnique({
      where: { id: tripId, userId: session.user.id }
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const intelligence = await prisma.tripIntelligence.findUnique({
      where: { tripId }
    })

    if (intelligence) {
      await prisma.diningRecommendation.deleteMany({
        where: { intelligenceId: intelligence.id }
      })

      await prisma.tripIntelligence.update({
        where: { id: intelligence.id },
        data: {
          hasDiningRecommendations: false,
          diningGeneratedAt: null
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing dining recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to clear dining recommendations' },
      { status: 500 }
    )
  }
}

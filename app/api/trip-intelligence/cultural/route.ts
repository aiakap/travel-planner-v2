import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

interface CulturalRequest {
  tripId: string
  interestedInEvents: boolean
  crowdPreference: 'avoid' | 'embrace' | 'flexible'
}

/**
 * POST /api/trip-intelligence/cultural
 * 
 * Generate cultural calendar and events for a trip
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CulturalRequest = await request.json()
    const { tripId, interestedInEvents, crowdPreference } = body

    if (!tripId || interestedInEvents === undefined || !crowdPreference) {
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
        feature: 'cultural',
        preferences: { interestedInEvents, crowdPreference }
      })
    })

    // Get trip with segments
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
                }
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

    // Extract destinations with dates
    const destinationDates: Array<{ destination: string; startDate: Date; endDate: Date }> = []
    
    trip.segments.forEach(seg => {
      if (seg.startTime && seg.endTime) {
        destinationDates.push({
          destination: seg.endTitle,
          startDate: new Date(seg.startTime),
          endDate: new Date(seg.endTime)
        })
      }
    })

    // Get user profile for interests
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

    const culturalInterests = profileValues
      .filter(pv => 
        pv.value.category.slug?.includes('activities-cultural') ||
        pv.value.category.slug?.includes('activities-arts') ||
        pv.value.value.toLowerCase().includes('festival') ||
        pv.value.value.toLowerCase().includes('culture')
      )
      .map(pv => pv.value.value)

    const photographyInterest = profileValues.some(pv => 
      pv.value.value.toLowerCase().includes('photography')
    )

    const travelStyle = profileValues
      .find(pv => pv.value.category.slug === 'travel-style')
      ?.value.value || 'moderate'

    // Build destinations and dates summary
    const destinationsSummary = destinationDates.map(dd => 
      `${dd.destination}: ${dd.startDate.toLocaleDateString()} to ${dd.endDate.toLocaleDateString()}`
    ).join('\n')

    // Generate AI advice
    const prompt = `You are an expert cultural travel advisor. Generate a cultural calendar for this trip with holidays, festivals, and events.

TRIP OVERVIEW:
- Title: ${trip.title}
- Start Date: ${new Date(trip.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- End Date: ${new Date(trip.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Destinations and Dates:
${destinationsSummary}

TRAVELER PROFILE:
- Interested in Events: ${interestedInEvents ? 'Yes' : 'No'}
- Crowd Preference: ${crowdPreference}
- Cultural Interests: ${culturalInterests.length > 0 ? culturalInterests.join(', ') : 'General interest'}
- Photography Interest: ${photographyInterest ? 'Yes' : 'No'}
- Travel Style: ${travelStyle}

For EACH destination, identify:
1. National holidays during the trip dates
2. Local festivals and cultural events
3. Religious observances
4. Special events (concerts, exhibitions, markets)

For EACH event, provide:
- Event name and type (Holiday, Festival, Cultural Event, Religious, Special Event)
- Exact date
- Description (what it is, significance)
- Impact on travel (businesses closed, heavy crowds, price increases, etc.)
- Recommendation (book in advance, avoid certain areas, great photo opportunity, etc.)

Calculate a relevance score (0-100) based on:
- Base: 40
- +20 per matching cultural interest
- +15 if photography interest and event is photo-worthy
- +10 if travel style is "immersive" or "cultural"
- +10 if interested in events
- -10 if crowd preference is "avoid" and event causes crowds

OUTPUT FORMAT (JSON):
{
  "events": [
    {
      "destination": "City, Country",
      "eventName": "Cherry Blossom Festival",
      "eventType": "Festival",
      "date": "2024-04-05",
      "description": "Annual celebration of cherry blossoms...",
      "impact": "Heavy crowds at parks, restaurants fully booked, prices 20% higher",
      "recommendation": "Book restaurants 2 weeks in advance, visit parks early morning",
      "reasoning": "Detailed explanation of why this matters for this traveler...",
      "relevanceScore": 85,
      "profileReferences": [
        {
          "category": "Cultural Interests",
          "value": "Photography",
          "relevance": "Cherry blossoms provide stunning photo opportunities"
        }
      ]
    }
  ]
}

Only include events that actually occur during the trip dates. Be specific about dates and impacts.`

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
          hasCulturalCalendar: true,
          culturalGeneratedAt: new Date()
        }
      })
    } else {
      // Delete old cultural events
      await prisma.culturalEvent.deleteMany({
        where: { intelligenceId: intelligence.id }
      })

      intelligence = await prisma.tripIntelligence.update({
        where: { id: intelligence.id },
        data: {
          hasCulturalCalendar: true,
          culturalGeneratedAt: new Date()
        }
      })
    }

    // Save cultural events to database
    const savedEvents = await Promise.all(
      aiResponse.events.map((event: any) =>
        prisma.culturalEvent.create({
          data: {
            intelligenceId: intelligence!.id,
            destination: event.destination,
            eventName: event.eventName,
            eventType: event.eventType,
            date: new Date(event.date),
            description: event.description,
            impact: event.impact,
            recommendation: event.recommendation,
            reasoning: event.reasoning,
            relevanceScore: event.relevanceScore,
            profileReferences: event.profileReferences || []
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      events: savedEvents
    })
  } catch (error) {
    console.error('Error generating cultural calendar:', error)
    return NextResponse.json(
      { error: 'Failed to generate cultural calendar' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/trip-intelligence/cultural?tripId=xxx
 * 
 * Retrieve existing cultural events for a trip
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
        culturalEvents: {
          orderBy: { date: 'asc' }
        }
      }
    })

    if (!intelligence || !intelligence.hasCulturalCalendar) {
      return NextResponse.json({ events: null })
    }

    return NextResponse.json({
      events: intelligence.culturalEvents,
      generatedAt: intelligence.culturalGeneratedAt
    })
  } catch (error) {
    console.error('Error fetching cultural events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cultural events' },
      { status: 500 }
    )
  }
}

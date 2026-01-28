import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

interface ActivitiesRequest {
  tripId: string
  activityPace: 'relaxed' | 'moderate' | 'packed'
  dailyBudget: '0-50' | '50-100' | '100-200' | '200+'
}

interface TimeGap {
  segmentId: string
  dayNumber: number
  startTime: Date
  endTime: Date
  duration: number // hours
  location: string
  timeSlot: 'morning' | 'afternoon' | 'evening'
}

/**
 * POST /api/trip-intelligence/activities
 * 
 * Generate activity suggestions for free time gaps
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ActivitiesRequest = await request.json()
    const { tripId, activityPace, dailyBudget } = body

    if (!tripId || !activityPace || !dailyBudget) {
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
        feature: 'activities',
        preferences: { activityPace, dailyBudget }
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

    // Detect time gaps (3+ hours without reservations)
    const gaps: TimeGap[] = []
    let dayNumber = 1
    const tripStartDate = new Date(trip.startDate)

    trip.segments.forEach(segment => {
      if (!segment.startTime || !segment.endTime) return

      const segmentStart = new Date(segment.startTime)
      const segmentEnd = new Date(segment.endTime)
      const reservations = segment.reservations.filter(r => r.startTime)

      if (reservations.length === 0) {
        // Entire segment is free
        const duration = (segmentEnd.getTime() - segmentStart.getTime()) / (1000 * 60 * 60)
        if (duration >= 3) {
          gaps.push({
            segmentId: segment.id,
            dayNumber,
            startTime: segmentStart,
            endTime: segmentEnd,
            duration,
            location: segment.endTitle,
            timeSlot: getTimeSlot(segmentStart)
          })
        }
      } else {
        // Check gaps between reservations
        for (let i = 0; i < reservations.length; i++) {
          const current = reservations[i]
          const next = reservations[i + 1]

          if (next && current.endTime) {
            const gapStart = new Date(current.endTime)
            const gapEnd = new Date(next.startTime!)
            const duration = (gapEnd.getTime() - gapStart.getTime()) / (1000 * 60 * 60)

            if (duration >= 3) {
              gaps.push({
                segmentId: segment.id,
                dayNumber,
                startTime: gapStart,
                endTime: gapEnd,
                duration,
                location: segment.endTitle,
                timeSlot: getTimeSlot(gapStart)
              })
            }
          }
        }
      }

      dayNumber++
    })

    // Get user profile for activity interests
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

    const activityInterests = profileValues
      .filter(pv => pv.value.category.slug?.startsWith('activities'))
      .map(pv => pv.value.value)

    const hobbies = profileValues
      .filter(pv => pv.value.category.slug === 'hobbies')
      .map(pv => pv.value.value)

    const travelStyle = profileValues
      .find(pv => pv.value.category.slug === 'travel-style')
      ?.value.value || 'moderate'

    // Build gaps summary
    const gapsSummary = gaps.map(gap => 
      `Day ${gap.dayNumber}, ${gap.timeSlot}: ${gap.duration.toFixed(1)} hours free in ${gap.location} (${gap.startTime.toLocaleTimeString()} - ${gap.endTime.toLocaleTimeString()})`
    ).join('\n')

    if (gaps.length === 0) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'No significant time gaps detected (3+ hours)'
      })
    }

    // Generate AI suggestions
    const prompt = `You are an expert activity planner. Generate personalized activity suggestions for free time gaps in this trip.

TRIP OVERVIEW:
- Title: ${trip.title}
- Destinations: ${trip.segments.map(s => s.endTitle).join(', ')}

TRAVELER PROFILE:
- Activity Pace: ${activityPace}
- Daily Budget: $${dailyBudget}
- Activity Interests: ${activityInterests.length > 0 ? activityInterests.join(', ') : 'General interests'}
- Hobbies: ${hobbies.length > 0 ? hobbies.join(', ') : 'Not specified'}
- Travel Style: ${travelStyle}

FREE TIME GAPS (3+ hours):
${gapsSummary}

For EACH gap, suggest 1-2 activities that:
1. Fit within the time available
2. Match the traveler's interests and hobbies
3. Fit the budget range
4. Are appropriate for the time of day
5. Are located in or near the gap location

For each suggestion, provide:
- Activity name and type (Museum, Hiking, Cultural Experience, Food Tour, etc.)
- Location (specific place or area)
- Estimated duration (in hours)
- Estimated cost range
- Description (what you'll do, why it's great)
- Why it's relevant to this traveler (reference specific interests/hobbies)

Calculate a relevance score (0-100) based on:
- Base: 30
- +15 per matching hobby/interest
- +10 per matching activity preference
- +20 if activity type in profile
- +15 if matches travel style (adventure → outdoor activities)

OUTPUT FORMAT (JSON):
{
  "suggestions": [
    {
      "dayNumber": 1,
      "timeSlot": "morning",
      "gapDuration": 4.5,
      "activityName": "Tokyo National Museum",
      "activityType": "Museum",
      "location": "Ueno Park, Tokyo",
      "estimatedDuration": 2.5,
      "estimatedCost": "$15-25",
      "description": "Explore Japan's largest museum with extensive collections...",
      "whyRelevant": "Matches your interest in cultural experiences and history",
      "reasoning": "Perfect for a morning activity, fits your moderate pace...",
      "relevanceScore": 85,
      "profileReferences": [
        {
          "category": "Activities",
          "value": "Museums",
          "relevance": "Direct match with your cultural activity preferences"
        },
        {
          "category": "Hobbies",
          "value": "Photography",
          "relevance": "Museum has beautiful architecture for photos"
        }
      ]
    }
  ]
}

Be specific and actionable. Only suggest activities that fit the time and budget constraints.`

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
          hasActivitySuggestions: true,
          activityGeneratedAt: new Date()
        }
      })
    } else {
      // Delete old activity suggestions
      await prisma.activitySuggestion.deleteMany({
        where: { intelligenceId: intelligence.id }
      })

      intelligence = await prisma.tripIntelligence.update({
        where: { id: intelligence.id },
        data: {
          hasActivitySuggestions: true,
          activityGeneratedAt: new Date()
        }
      })
    }

    // Save activity suggestions to database
    const savedSuggestions = await Promise.all(
      aiResponse.suggestions.map((suggestion: any) => {
        const gap = gaps.find(g => g.dayNumber === suggestion.dayNumber && g.timeSlot === suggestion.timeSlot)
        
        return prisma.activitySuggestion.create({
          data: {
            intelligenceId: intelligence!.id,
            segmentId: gap?.segmentId || null,
            dayNumber: suggestion.dayNumber,
            timeSlot: suggestion.timeSlot,
            gapStartTime: gap?.startTime || new Date(),
            gapEndTime: gap?.endTime || new Date(),
            gapDuration: suggestion.gapDuration,
            activityName: suggestion.activityName,
            activityType: suggestion.activityType,
            location: suggestion.location,
            estimatedDuration: suggestion.estimatedDuration,
            estimatedCost: suggestion.estimatedCost,
            viatorProductId: null,
            viatorUrl: null,
            viatorRating: null,
            description: suggestion.description,
            whyRelevant: suggestion.whyRelevant,
            reasoning: suggestion.reasoning,
            relevanceScore: suggestion.relevanceScore,
            profileReferences: suggestion.profileReferences || []
          }
        })
      })
    )

    return NextResponse.json({
      success: true,
      suggestions: savedSuggestions,
      gapsDetected: gaps.length
    })
  } catch (error) {
    console.error('Error generating activity suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate activity suggestions' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/trip-intelligence/activities?tripId=xxx
 * 
 * Retrieve existing activity suggestions for a trip
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
        activitySuggestions: {
          orderBy: [
            { dayNumber: 'asc' },
            { gapStartTime: 'asc' }
          ]
        }
      }
    })

    if (!intelligence || !intelligence.hasActivitySuggestions) {
      return NextResponse.json({ suggestions: null })
    }

    return NextResponse.json({
      suggestions: intelligence.activitySuggestions,
      generatedAt: intelligence.activityGeneratedAt
    })
  } catch (error) {
    console.error('Error fetching activity suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity suggestions' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to determine time slot from date
 */
function getTimeSlot(date: Date): 'morning' | 'afternoon' | 'evening' {
  const hour = date.getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

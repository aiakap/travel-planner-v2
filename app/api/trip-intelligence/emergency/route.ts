import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

interface EmergencyRequest {
  tripId: string
  citizenship: string
  residence: string
  medicalConditions?: string
}

/**
 * POST /api/trip-intelligence/emergency
 * 
 * Generate emergency information for a trip
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: EmergencyRequest = await request.json()
    const { tripId, citizenship, residence, medicalConditions } = body

    if (!tripId || !citizenship || !residence) {
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
        feature: 'emergency',
        preferences: { citizenship, residence, medicalConditions }
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

    // Extract unique countries
    const countries = new Set<string>()
    const accommodations: Array<{ name: string; location: string; lat?: number; lng?: number }> = []
    
    trip.segments.forEach(seg => {
      const country = seg.endTitle.split(',').pop()?.trim() || seg.endTitle
      countries.add(country)
      
      // Collect accommodations for hospital proximity
      seg.reservations
        .filter(res => res.reservationType.category.name === 'Stay')
        .forEach(res => {
          accommodations.push({
            name: res.name,
            location: res.location || seg.endTitle,
            lat: res.latitude || undefined,
            lng: res.longitude || undefined
          })
        })
    })

    // Get user profile for family composition
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

    const travelCompanions = profileValues
      .filter(pv => 
        pv.value.category.slug?.includes('travel-companions') ||
        pv.value.category.slug?.includes('family')
      )
      .map(pv => pv.value.value)

    const hasFamilyMembers = travelCompanions.some(tc => 
      tc.toLowerCase().includes('family') || 
      tc.toLowerCase().includes('children') ||
      tc.toLowerCase().includes('spouse')
    )

    const isSoloTraveler = travelCompanions.some(tc => 
      tc.toLowerCase().includes('solo')
    )

    // Build countries list
    const countriesList = Array.from(countries).join(', ')
    const accommodationsList = accommodations.map(acc => 
      `${acc.name} (${acc.location})`
    ).join('\n')

    // Generate AI advice
    const prompt = `You are an expert travel safety advisor. Generate comprehensive emergency information for this trip.

TRIP OVERVIEW:
- Title: ${trip.title}
- Duration: ${Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
- Countries: ${countriesList}

TRAVELER PROFILE:
- Citizenship: ${citizenship}
- Residence: ${residence}
- Medical Conditions: ${medicalConditions || 'None specified'}
- Travel Companions: ${travelCompanions.length > 0 ? travelCompanions.join(', ') : 'Not specified'}
- Traveling with family: ${hasFamilyMembers ? 'Yes' : 'No'}
- Solo traveler: ${isSoloTraveler ? 'Yes' : 'No'}

ACCOMMODATIONS:
${accommodationsList || 'No accommodations booked yet'}

For EACH country, provide:
1. ${citizenship} Embassy/Consulate information (name, address, phone, email)
2. Emergency numbers (police, ambulance, fire, tourist police)
3. 2-3 nearest hospitals to the accommodations (name, address, phone, specialties)
4. Pharmacy information (how to find pharmacies, prescription requirements)
5. Safety level assessment (Low Risk, Moderate, High Risk)
6. Common scams targeting tourists (be specific)
7. Cultural safety considerations (dress codes, behavior norms, areas to avoid)

Calculate a relevance score (0-100) based on:
- Base: 60 (safety always important)
- +15 if traveling with family (higher priority for family safety)
- +10 if solo traveler (extra precautions needed)
- +15 if medical conditions specified (health concerns)

OUTPUT FORMAT (JSON):
{
  "countries": [
    {
      "destination": "City, Country",
      "country": "Country",
      "embassyName": "${citizenship} Embassy in Country",
      "embassyAddress": "Full address",
      "embassyPhone": "+XX XXX XXX XXXX",
      "embassyEmail": "email@embassy.gov",
      "emergencyNumbers": {
        "police": "110",
        "ambulance": "119",
        "fire": "119",
        "touristPolice": "1155"
      },
      "nearestHospitals": [
        {
          "name": "Hospital Name",
          "address": "Full address",
          "phone": "+XX XXX XXX XXXX",
          "specialties": "Emergency, International patients"
        }
      ],
      "pharmacyInfo": "Detailed pharmacy information...",
      "safetyLevel": "Low Risk",
      "commonScams": [
        "Specific scam description and how to avoid it",
        "Another scam..."
      ],
      "culturalSafety": "Cultural norms and safety considerations...",
      "reasoning": "Detailed explanation referencing trip specifics and medical conditions...",
      "relevanceScore": 85,
      "profileReferences": [
        {
          "category": "Travel Companions",
          "value": "Family with children",
          "relevance": "Extra safety precautions for traveling with children"
        }
      ]
    }
  ]
}

Be specific and actionable. Reference actual medical conditions if provided.`

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
          hasEmergencyInfo: true,
          emergencyGeneratedAt: new Date()
        }
      })
    } else {
      // Delete old emergency info
      await prisma.emergencyInfo.deleteMany({
        where: { intelligenceId: intelligence.id }
      })

      intelligence = await prisma.tripIntelligence.update({
        where: { id: intelligence.id },
        data: {
          hasEmergencyInfo: true,
          emergencyGeneratedAt: new Date()
        }
      })
    }

    // Save emergency info to database
    const savedInfo = await Promise.all(
      aiResponse.countries.map((country: any) =>
        prisma.emergencyInfo.create({
          data: {
            intelligenceId: intelligence!.id,
            destination: country.destination,
            country: country.country,
            embassyName: country.embassyName,
            embassyAddress: country.embassyAddress,
            embassyPhone: country.embassyPhone,
            embassyEmail: country.embassyEmail || null,
            emergencyNumbers: country.emergencyNumbers,
            nearestHospitals: country.nearestHospitals,
            pharmacyInfo: country.pharmacyInfo,
            safetyLevel: country.safetyLevel,
            commonScams: country.commonScams,
            culturalSafety: country.culturalSafety,
            reasoning: country.reasoning,
            relevanceScore: country.relevanceScore,
            profileReferences: country.profileReferences || []
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      info: savedInfo
    })
  } catch (error) {
    console.error('Error generating emergency info:', error)
    return NextResponse.json(
      { error: 'Failed to generate emergency info' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/trip-intelligence/emergency?tripId=xxx
 * 
 * Retrieve existing emergency info for a trip
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
        emergencyInfo: true
      }
    })

    if (!intelligence || !intelligence.hasEmergencyInfo) {
      return NextResponse.json({ info: null })
    }

    return NextResponse.json({
      info: intelligence.emergencyInfo,
      generatedAt: intelligence.emergencyGeneratedAt
    })
  } catch (error) {
    console.error('Error fetching emergency info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch emergency info' },
      { status: 500 }
    )
  }
}

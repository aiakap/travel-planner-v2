import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { getExchangeRates } from '@/lib/utils/exchange-rate-cache'

interface CurrencyRequest {
  tripId: string
  citizenship: string
  residence: string
}

/**
 * POST /api/trip-intelligence/currency
 * 
 * Generate currency advice for a trip
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CurrencyRequest = await request.json()
    const { tripId, citizenship, residence } = body

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
        feature: 'currency',
        preferences: { citizenship, residence }
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

    // Extract unique destinations
    const destinations = new Set<string>()
    trip.segments.forEach(seg => {
      destinations.add(seg.endTitle)
    })

    // Fetch exchange rates using shared cache (single API call, 24hr cache, fallback rates)
    const allRates = await getExchangeRates()
    const exchangeRates: Record<string, { currency: string; rate: number }> = {}
    
    for (const dest of destinations) {
      // Extract country from destination (simplified - in production, use geocoding)
      const country = dest.split(',').pop()?.trim() || dest
      
      // Get currency code for country (simplified mapping)
      const currencyCode = getCurrencyForCountry(country)
      
      if (currencyCode && currencyCode !== 'USD') {
        exchangeRates[dest] = {
          currency: currencyCode,
          rate: allRates[currencyCode] || 1
        }
      } else {
        exchangeRates[dest] = { currency: 'USD', rate: 1 }
      }
    }

    // Get user profile for spending priorities
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

    const spendingPriorities = profileValues
      .filter(pv => pv.value.category.slug?.includes('spending') || pv.value.category.slug?.includes('budget'))
      .map(pv => pv.value.value)

    // Analyze accommodations for luxury level
    const accommodations = trip.segments.flatMap(seg =>
      seg.reservations.filter(res => res.reservationType.category.name === 'Stay')
    )
    const hasLuxuryAccommodations = accommodations.some(acc => 
      acc.name.toLowerCase().includes('resort') || 
      acc.name.toLowerCase().includes('luxury') ||
      (acc.cost && acc.cost > 300)
    )

    // Build destinations summary
    const destinationsList = Array.from(destinations).join(', ')
    const exchangeRatesSummary = Array.from(destinations).map(dest => {
      const info = exchangeRates[dest]
      return `${dest}: ${info.currency} (1 USD = ${info.rate.toFixed(2)} ${info.currency})`
    }).join('\n')

    // Generate AI advice
    const prompt = `You are an expert travel financial advisor. Generate comprehensive currency advice for this trip.

TRIP OVERVIEW:
- Title: ${trip.title}
- Duration: ${Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
- Destinations: ${destinationsList}

TRAVELER PROFILE:
- Citizenship: ${citizenship}
- Residence: ${residence}
- Spending Priorities: ${spendingPriorities.length > 0 ? spendingPriorities.join(', ') : 'Not specified'}
- Accommodation Style: ${hasLuxuryAccommodations ? 'Upscale/Luxury' : 'Standard'}

EXCHANGE RATES:
${exchangeRatesSummary}

For EACH destination, provide:
1. Tipping customs (specific percentages and situations)
2. ATM locations and fees (where to find ATMs, typical fees)
3. Credit card acceptance rate and best cards to use
4. Daily cash recommendation in local currency
5. Money-saving tips specific to that destination

Calculate a relevance score (0-100) based on:
- Base: 50 (always relevant)
- +10 if spending priorities include budget/savings
- +20 if luxury accommodations (may need more cash/premium cards)
- +10 if multiple currencies involved

OUTPUT FORMAT (JSON):
{
  "destinations": [
    {
      "destination": "City, Country",
      "currency": "JPY",
      "exchangeRate": 150.25,
      "tippingCustom": "Detailed tipping customs...",
      "atmLocations": "Where to find ATMs, typical fees...",
      "cardAcceptance": "70% acceptance, Visa/Mastercard preferred...",
      "cashRecommendation": "Carry ¥20,000-30,000 daily...",
      "reasoning": "Detailed explanation referencing trip specifics...",
      "relevanceScore": 85,
      "profileReferences": [
        {
          "category": "Spending Priorities",
          "value": "Budget-conscious",
          "relevance": "Cash recommendations help you stay within budget"
        }
      ]
    }
  ]
}

Be specific and reference the actual trip details. Make every recommendation actionable.`

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
          hasCurrencyAdvice: true,
          currencyGeneratedAt: new Date()
        }
      })
    } else {
      // Delete old currency advice
      await prisma.currencyAdvice.deleteMany({
        where: { intelligenceId: intelligence.id }
      })

      intelligence = await prisma.tripIntelligence.update({
        where: { id: intelligence.id },
        data: {
          hasCurrencyAdvice: true,
          currencyGeneratedAt: new Date()
        }
      })
    }

    // Save currency advice to database
    const savedAdvice = await Promise.all(
      aiResponse.destinations.map((dest: any) =>
        prisma.currencyAdvice.create({
          data: {
            intelligenceId: intelligence!.id,
            destination: dest.destination,
            currency: dest.currency,
            exchangeRate: dest.exchangeRate,
            baseCurrency: 'USD',
            tippingCustom: dest.tippingCustom,
            atmLocations: dest.atmLocations,
            cardAcceptance: dest.cardAcceptance,
            cashRecommendation: dest.cashRecommendation,
            reasoning: dest.reasoning,
            relevanceScore: dest.relevanceScore,
            profileReferences: dest.profileReferences || []
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      advice: savedAdvice
    })
  } catch (error) {
    console.error('Error generating currency advice:', error)
    return NextResponse.json(
      { error: 'Failed to generate currency advice' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/trip-intelligence/currency?tripId=xxx
 * 
 * Retrieve existing currency advice for a trip
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
        currencyAdvice: true
      }
    })

    if (!intelligence || !intelligence.hasCurrencyAdvice) {
      return NextResponse.json({ advice: null })
    }

    return NextResponse.json({
      advice: intelligence.currencyAdvice,
      generatedAt: intelligence.currencyGeneratedAt
    })
  } catch (error) {
    console.error('Error fetching currency advice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch currency advice' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to get currency code for a country
 * In production, this should use a comprehensive mapping or API
 */
function getCurrencyForCountry(country: string): string {
  const currencyMap: Record<string, string> = {
    'Japan': 'JPY',
    'United Kingdom': 'GBP',
    'UK': 'GBP',
    'France': 'EUR',
    'Germany': 'EUR',
    'Italy': 'EUR',
    'Spain': 'EUR',
    'Canada': 'CAD',
    'Australia': 'AUD',
    'Mexico': 'MXN',
    'Thailand': 'THB',
    'Singapore': 'SGD',
    'Switzerland': 'CHF',
    'Sweden': 'SEK',
    'Norway': 'NOK',
    'Denmark': 'DKK',
    'India': 'INR',
    'China': 'CNY',
    'South Korea': 'KRW',
    'Brazil': 'BRL',
    'Argentina': 'ARS',
    'Chile': 'CLP',
    'Colombia': 'COP',
    'Peru': 'PEN',
    'New Zealand': 'NZD',
    'South Africa': 'ZAR',
    'Turkey': 'TRY',
    'UAE': 'AED',
    'Israel': 'ILS',
    'Egypt': 'EGP',
    'Morocco': 'MAD',
    'Kenya': 'KES',
    'Indonesia': 'IDR',
    'Malaysia': 'MYR',
    'Philippines': 'PHP',
    'Vietnam': 'VND',
    'Iceland': 'ISK',
    'Poland': 'PLN',
    'Czech Republic': 'CZK',
    'Hungary': 'HUF',
    'Romania': 'RON',
    'Croatia': 'HRK',
    'Russia': 'RUB',
    'Hong Kong': 'HKD',
    'Taiwan': 'TWD',
  }

  return currencyMap[country] || 'USD'
}

/**
 * DELETE /api/trip-intelligence/currency?tripId=xxx
 * 
 * Clear existing currency advice for a trip
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
      // Delete currency advice items
      await prisma.currencyAdvice.deleteMany({
        where: { intelligenceId: intelligence.id }
      })

      // Update intelligence record
      await prisma.tripIntelligence.update({
        where: { id: intelligence.id },
        data: {
          hasCurrencyAdvice: false,
          currencyGeneratedAt: null
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing currency advice:', error)
    return NextResponse.json(
      { error: 'Failed to clear currency advice' },
      { status: 500 }
    )
  }
}

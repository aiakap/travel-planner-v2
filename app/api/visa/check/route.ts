import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/visa/check?tripId=xxx
 * Retrieve existing visa requirements for a trip
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
        visaRequirements: true
      }
    })

    if (!intelligence || !intelligence.hasVisaRequirements) {
      return NextResponse.json({ results: null })
    }

    // Transform to match the expected format
    const results = intelligence.visaRequirements.map(visa => ({
      destination: visa.destination,
      country: visa.country,
      visaRequired: visa.visaRequired,
      visaType: visa.visaType,
      duration: visa.duration,
      advanceRegistration: visa.advanceRegistration,
      requirements: visa.requirements,
      processingTime: visa.processingTime,
      cost: visa.cost,
      sources: visa.sources,
      importantNotes: visa.importantNotes,
      lastChecked: visa.createdAt
    }))

    return NextResponse.json({
      results,
      generatedAt: intelligence.visaGeneratedAt
    })
  } catch (error) {
    console.error('Error fetching visa requirements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch visa requirements' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/visa/check
 * Check and save visa requirements for a trip
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tripId, destinations, citizenship, residence } = await request.json()
    
    // Validation
    if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return NextResponse.json(
        { error: "Destinations array is required" },
        { status: 400 }
      )
    }
    
    if (!citizenship) {
      return NextResponse.json(
        { error: "Citizenship is required" },
        { status: 400 }
      )
    }

    // If tripId provided, verify ownership
    if (tripId) {
      const trip = await prisma.trip.findUnique({
        where: { id: tripId, userId: session.user.id }
      })
      if (!trip) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
      }
    }
    
    const residenceCountry = residence || citizenship
    const destinationList = destinations.join(", ")
    
    // Build comprehensive prompt for travel documentation
    const prompt = `You are a travel documentation expert. A traveler holds a ${citizenship} passport, lives in ${residenceCountry}, and is traveling to: ${destinationList}.

Provide COMPREHENSIVE travel documentation requirements for EACH destination, including:

**VISAS & ENTRY PERMITS:**
- Traditional visas (tourist, business, transit)
- Electronic travel authorizations (e.g., UK ETA, US ESTA, Canada eTA, Australia ETA, New Zealand NZeTA)
- Visa on arrival options
- Visa waiver programs and their conditions

**PRE-ARRIVAL REQUIREMENTS:**
- Digital registration systems (e.g., Japan Visit Japan Web, EU ETIAS when active, Korea K-ETA)
- Customs declaration forms that must be completed before arrival
- Health declarations or apps
- Advance passenger information requirements

**ENTRY DOCUMENTS:**
- Passport validity requirements (many countries require 6 months validity beyond stay)
- Blank passport pages needed
- Return or onward ticket requirements
- Proof of accommodation
- Financial proof requirements (bank statements, credit cards)
- Travel insurance requirements (mandatory in some countries)

**HEALTH REQUIREMENTS:**
- Required vaccinations (e.g., Yellow Fever for certain countries)
- Health certificates
- COVID-related requirements (if any remain)

**SPECIAL CONSIDERATIONS:**
- Different requirements for air vs. land vs. sea entry
- Transit requirements (even if not leaving airport)
- Reciprocity fees (e.g., Chile, Argentina for some nationalities)
- Special permits for restricted areas

For each destination, format as JSON:
{
  "results": [
    {
      "destination": "Country Name",
      "visaRequired": true/false,
      "visaType": "e.g., Electronic Travel Authorization (ETA), Visa on Arrival, eVisa, or None",
      "duration": "e.g., 90 days visa-free",
      "advanceRegistration": "Any pre-arrival digital systems (Visit Japan Web, K-ETA, etc.) or null",
      "requirements": [
        "Passport valid for 6 months beyond stay",
        "Return ticket required",
        "Proof of accommodation",
        "Travel insurance mandatory",
        etc.
      ],
      "processingTime": "How far in advance to apply (if applicable)",
      "cost": "Fees if any",
      "sources": [
        {
          "title": "Official government or embassy source name",
          "url": "https://official-government-site.gov",
          "domain": "gov domain"
        }
      ],
      "importantNotes": "Any critical information travelers often miss"
    }
  ]
}

Focus on authoritative sources like:
- Official government immigration/visa websites
- Embassy/consulate websites
- IATA Travel Centre (iatatravelcentre.com)
- Trusted travel advisory sites (gov.uk/foreign-travel-advice, travel.state.gov, etc.)

Be thorough and accurate. Include lesser-known requirements that travelers often miss.`

    console.log("Calling OpenAI for visa requirements...")
    
    // Call OpenAI for visa information
    const result = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.3, // Lower temperature for more factual responses
    })
    
    console.log("OpenAI response received:", result.text.substring(0, 200))
    
    // Parse response
    let parsedData
    try {
      // Try to extract JSON from response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        // Fallback if no JSON found
        throw new Error("No JSON in response")
      }
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError)
      console.log("Raw response:", result.text)
      
      // Return fallback structure
      return NextResponse.json({
        results: destinations.map((dest: string) => ({
          destination: dest,
          country: dest,
          visaRequired: true,
          duration: undefined,
          requirements: [
            "Valid passport (at least 6 months validity)",
            "Proof of return travel",
            "Proof of sufficient funds"
          ],
          sources: [
            {
              title: `${dest} visa information`,
              url: `https://www.google.com/search?q=${encodeURIComponent(`${dest} visa requirements ${citizenship}`)}`,
              domain: "google.com"
            }
          ],
          lastChecked: new Date()
        })),
        disclaimer: "Visa requirements can change. Always verify with official sources.",
        note: "AI response parsing failed. Please verify with official sources."
      })
    }
    
    // Add lastChecked timestamp to each result
    const results = (parsedData.results || []).map((result: any) => ({
      ...result,
      country: result.destination,
      lastChecked: new Date()
    }))
    
    console.log(`Processed ${results.length} visa results`)

    // Save to database if tripId provided
    if (tripId) {
      try {
        // Create or update TripIntelligence record
        let intelligence = await prisma.tripIntelligence.findUnique({
          where: { tripId }
        })

        if (!intelligence) {
          intelligence = await prisma.tripIntelligence.create({
            data: {
              tripId,
              hasVisaRequirements: true,
              visaGeneratedAt: new Date()
            }
          })
        } else {
          // Delete old visa requirements
          await prisma.tripVisaRequirement.deleteMany({
            where: { intelligenceId: intelligence.id }
          })

          intelligence = await prisma.tripIntelligence.update({
            where: { id: intelligence.id },
            data: {
              hasVisaRequirements: true,
              visaGeneratedAt: new Date()
            }
          })
        }

        // Save visa requirements to database
        await Promise.all(
          results.map((visa: any) =>
            prisma.tripVisaRequirement.create({
              data: {
                intelligenceId: intelligence!.id,
                destination: visa.destination,
                country: visa.country || visa.destination,
                visaRequired: visa.visaRequired || false,
                visaType: visa.visaType || null,
                duration: visa.duration || null,
                advanceRegistration: visa.advanceRegistration || null,
                requirements: visa.requirements || [],
                processingTime: visa.processingTime || null,
                cost: visa.cost || null,
                sources: visa.sources || [],
                importantNotes: visa.importantNotes || null,
                citizenship,
                residence: residenceCountry,
              }
            })
          )
        )

        console.log(`Saved ${results.length} visa requirements to database`)
      } catch (dbError) {
        console.error("Error saving visa requirements to database:", dbError)
        // Continue and return results even if DB save fails
      }
    }
    
    return NextResponse.json({
      results,
      disclaimer: "Visa requirements can change. Always verify with official sources."
    })
    
  } catch (error) {
    console.error("Visa check error:", error)
    return NextResponse.json(
      { error: "Failed to check visa requirements" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/visa/check?tripId=xxx
 * Clear existing visa requirements for a trip
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
      await prisma.tripVisaRequirement.deleteMany({
        where: { intelligenceId: intelligence.id }
      })

      await prisma.tripIntelligence.update({
        where: { id: intelligence.id },
        data: {
          hasVisaRequirements: false,
          visaGeneratedAt: null
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing visa requirements:', error)
    return NextResponse.json(
      { error: 'Failed to clear visa requirements' },
      { status: 500 }
    )
  }
}

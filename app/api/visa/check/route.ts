import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { destinations, citizenship, residence } = await request.json()
    
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
      console.error("Failed to parse Gemini response:", parseError)
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

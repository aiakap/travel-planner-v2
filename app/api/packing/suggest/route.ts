import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(request: Request) {
  try {
    const { trip, profile, weather } = await request.json()
    
    // Extract relevant profile data
    const activities = profile
      ?.filter((p: any) => p.value?.category?.slug?.startsWith('activities'))
      .map((p: any) => p.value.name) || []
    
    const dietary = profile
      ?.filter((p: any) => p.value?.category?.slug?.includes('dietary'))
      .map((p: any) => p.value.name) || []
    
    const travelStyle = profile
      ?.find((p: any) => p.value?.category?.slug === 'travel-style')
      ?.value.name || 'casual'
    
    // Build comprehensive prompt
    const prompt = `Generate a detailed packing list for this trip in JSON format.

Trip Details:
- Name: ${trip.title}
- Duration: ${trip.dayCount} days
- Destinations: ${trip.segments?.map((s: any) => s.endTitle).join(', ') || 'Multiple destinations'}

Planned Activities:
${activities.length > 0 ? activities.join(', ') : 'General sightseeing and relaxation'}

Dietary Restrictions:
${dietary.length > 0 ? dietary.join(', ') : 'None specified'}

Travel Style: ${travelStyle}

Weather Forecast:
${weather?.map((w: any) => `${w.location}: ${w.forecast?.[0]?.temp || 20}°C, ${w.forecast?.[0]?.description || 'moderate weather'}`).join('\n') || 'Moderate temperatures expected'}

Generate a JSON object with these exact categories:
{
  "clothing": [
    { "name": "item name", "quantity": "number", "reason": "why needed based on weather/activities" }
  ],
  "footwear": [
    { "name": "item name", "quantity": "number", "reason": "why needed for activities" }
  ],
  "gear": [
    { "name": "item name", "quantity": "number", "reason": "why needed for trip" }
  ],
  "toiletries": [
    { "name": "item name", "quantity": "number", "reason": "including dietary-specific items" }
  ],
  "documents": [
    { "name": "item name", "reason": "essential documents" }
  ]
}

Be specific to the activities, weather, and travel style. Include 4-8 items per category. Focus on essentials.`

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
    })
  }
}

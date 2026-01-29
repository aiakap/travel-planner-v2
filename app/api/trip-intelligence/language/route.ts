import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { updateFeaturePreferences } from '@/lib/utils/xml-preferences'

interface LanguageRequest {
  tripId: string
  knownLanguages: Array<{
    code: string
    name: string
    proficiency: 'beginner' | 'intermediate' | 'advanced'
  }>
}

interface LanguagePhrase {
  phrase: string
  translation: string
  romanization?: string
  reasoning?: string
}

interface LanguageVerb {
  verb: string
  conjugation: string
  usage: string
}

interface LanguageScenario {
  id: string
  scenario: string
  phrases: LanguagePhrase[]
  verbs: LanguageVerb[]
  relevanceScore: number
  reasoning: string
}

interface LanguageGuide {
  id: string
  targetLanguage: string
  targetLanguageCode: string
  userProficiency: 'beginner' | 'intermediate' | 'advanced'
  destinations?: string
  scenarios: LanguageScenario[]
}

/**
 * POST /api/trip-intelligence/language
 * 
 * Generate personalized language guide for a trip
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: LanguageRequest = await request.json()
    const { tripId, knownLanguages } = body

    if (!tripId || !knownLanguages || knownLanguages.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save preferences to user profile
    try {
      const profileGraph = await prisma.userProfileGraph.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          graphData: null
        },
        update: {}
      })

      const updatedXML = updateFeaturePreferences(
        profileGraph.graphData,
        'language',
        { knownLanguages }
      )

      await prisma.userProfileGraph.update({
        where: { userId: session.user.id },
        data: { graphData: updatedXML }
      })
    } catch (prefError) {
      console.error('Error saving preferences:', prefError)
      // Continue even if preference saving fails
    }

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

    // Extract unique destinations with their countries
    const destinationMap = new Map<string, string[]>() // language code -> [destinations]
    trip.segments.forEach(seg => {
      const destination = seg.endTitle
      const language = determineTargetLanguage(destination)
      
      if (!destinationMap.has(language.code)) {
        destinationMap.set(language.code, [])
      }
      if (!destinationMap.get(language.code)!.includes(destination)) {
        destinationMap.get(language.code)!.push(destination)
      }
    })

    // Get user profile for personalization
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

    // Analyze profile for personalization
    const hobbies = profileValues
      .filter(pv => pv.value.category.slug?.includes('hobby') || pv.value.category.slug?.includes('interest'))
      .map(pv => pv.value.value)

    const travelStyle = profileValues
      .filter(pv => pv.value.category.slug?.includes('travel-style') || pv.value.category.slug?.includes('accommodation'))
      .map(pv => pv.value.value)

    const spendingLevel = profileValues
      .filter(pv => pv.value.category.slug?.includes('spending') || pv.value.category.slug?.includes('budget'))
      .map(pv => pv.value.value)

    // Analyze accommodations for luxury level
    const accommodations = trip.segments.flatMap(seg =>
      seg.reservations.filter(res => res.reservationType.category.name === 'Stay')
    )
    const hasLuxuryAccommodations = accommodations.some(acc => 
      acc.name.toLowerCase().includes('resort') || 
      acc.name.toLowerCase().includes('luxury') ||
      acc.name.toLowerCase().includes('hotel') && (acc.cost && acc.cost > 200)
    )

    // Determine if budget traveler
    const isBudgetTraveler = spendingLevel.some(s => 
      s.toLowerCase().includes('budget') || 
      s.toLowerCase().includes('economical') ||
      s.toLowerCase().includes('save')
    )

    // Detect specific interests
    const hasSkiing = hobbies.some(h => h.toLowerCase().includes('ski'))
    const hasPhotography = hobbies.some(h => h.toLowerCase().includes('photo'))
    const hasFoodInterest = hobbies.some(h => 
      h.toLowerCase().includes('food') || 
      h.toLowerCase().includes('culinary') ||
      h.toLowerCase().includes('cooking')
    )

    // Build known languages summary
    const knownLanguagesSummary = knownLanguages
      .map(l => `${l.name} (${l.proficiency})`)
      .join(', ')

    // Generate a guide for each unique language
    const guides: LanguageGuide[] = []
    
    for (const [languageCode, destinations] of destinationMap.entries()) {
      const targetLanguage = getLanguageInfo(languageCode)
      const destinationsList = destinations.join(', ')
      
      // Find user's proficiency in target language
      const userProficiency = knownLanguages.find(l => 
        l.code === targetLanguage.code || l.name.toLowerCase() === targetLanguage.name.toLowerCase()
      )?.proficiency || 'beginner'

      // Generate AI language guide
      const prompt = `You are an expert language teacher specializing in travel phrases. Generate a personalized language guide for a traveler.

TRIP OVERVIEW:
- Title: ${trip.title}
- Duration: ${Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
- Destinations: ${destinationsList}
- Target Language: ${targetLanguage.name}

TRAVELER PROFILE:
- Known Languages: ${knownLanguagesSummary}
- Proficiency in ${targetLanguage.name}: ${userProficiency}
- Travel Style: ${hasLuxuryAccommodations ? 'Luxury/Upscale' : isBudgetTraveler ? 'Budget-conscious' : 'Standard'}
- Hobbies: ${hobbies.length > 0 ? hobbies.join(', ') : 'Not specified'}
- Special Interests: ${[hasSkiing && 'Skiing', hasPhotography && 'Photography', hasFoodInterest && 'Food/Culinary'].filter(Boolean).join(', ') || 'None'}

PERSONALIZATION RULES:
${hasLuxuryAccommodations ? '- Include phrases for concierge services, lounge access, reservations at upscale venues' : ''}
${isBudgetTraveler ? '- Include phrases for budget accommodations, public transportation, affordable dining' : ''}
${hasSkiing ? '- Include skiing-related phrases: equipment rental, lift tickets, snow conditions, ski lessons' : ''}
${hasPhotography ? '- Include photography phrases: permission to photograph, best viewpoints, photo restrictions' : ''}
${hasFoodInterest ? '- Include extra culinary phrases: local specialties, cooking methods, ingredients' : ''}

PROFICIENCY LEVEL GUIDELINES:
${userProficiency === 'beginner' ? '- Use simple present tense only\n- Focus on survival phrases\n- Include very basic vocabulary\n- Provide detailed pronunciation guides' : ''}
${userProficiency === 'intermediate' ? '- Include past and future tenses\n- Add polite/formal forms\n- Use more complex sentence structures\n- Include common idioms' : ''}
${userProficiency === 'advanced' ? '- Include cultural nuances and idioms\n- Use sophisticated vocabulary\n- Add regional variations\n- Include slang where appropriate' : ''}

Generate content for these scenarios: Airport, Hotel, Restaurant, Transportation, Emergency, Activities

For EACH scenario, provide:
1. 5-7 essential phrases (with translation and romanization if needed)
2. 2-3 key verbs with conjugation examples
3. Relevance score (0-100) based on trip and profile
4. Reasoning for why this scenario matters

OUTPUT FORMAT (JSON):
{
  "targetLanguage": "${targetLanguage.name}",
  "targetLanguageCode": "${targetLanguage.code}",
  "userProficiency": "${userProficiency}",
  "destinations": "${destinationsList}",
  "scenarios": [
    {
      "scenario": "Airport",
      "phrases": [
        {
          "phrase": "Where is gate 5?",
          "translation": "[translation in target language]",
          "romanization": "[romanization if applicable]",
          "reasoning": "Essential for navigating airport"
        }
      ],
      "verbs": [
        {
          "verb": "to go",
          "conjugation": "[conjugation in target language]",
          "usage": "Example: I go to the gate = [translation]"
        }
      ],
      "relevanceScore": 90,
      "reasoning": "Airport navigation is critical for ${userProficiency} travelers arriving in ${targetLanguage.name}-speaking destinations"
    }
  ]
}

Be practical and specific. Tailor every phrase to the user's profile and proficiency level.`

      const { text } = await generateText({
        model: openai('gpt-4-turbo'),
        prompt,
        temperature: 0.7,
      })

      // Parse AI response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('Failed to parse AI response for language:', targetLanguage.name)
        continue
      }

      const guideData = JSON.parse(jsonMatch[0])

      // Add IDs to scenarios
      const scenarios: LanguageScenario[] = guideData.scenarios.map((scenario: any, idx: number) => ({
        ...scenario,
        id: `scenario-${idx}`
      }))

      const guide: LanguageGuide = {
        id: `guide-${languageCode}-${Date.now()}`,
        targetLanguage: guideData.targetLanguage,
        targetLanguageCode: guideData.targetLanguageCode,
        userProficiency: guideData.userProficiency,
        destinations: guideData.destinations || destinationsList,
        scenarios
      }

      guides.push(guide)
    }

    return NextResponse.json({ guides })
  } catch (error) {
    console.error('Error generating language guide:', error)
    return NextResponse.json(
      { error: 'Failed to generate language guide' },
      { status: 500 }
    )
  }
}

/**
 * Determine target language based on destination
 */
function determineTargetLanguage(destination: string): { name: string; code: string } {
  const dest = destination.toLowerCase()
  
  // Simple mapping - in production, use proper geocoding
  if (dest.includes('japan') || dest.includes('tokyo') || dest.includes('osaka')) {
    return { name: 'Japanese', code: 'ja' }
  }
  if (dest.includes('spain') || dest.includes('madrid') || dest.includes('barcelona')) {
    return { name: 'Spanish', code: 'es' }
  }
  if (dest.includes('france') || dest.includes('paris')) {
    return { name: 'French', code: 'fr' }
  }
  if (dest.includes('germany') || dest.includes('berlin') || dest.includes('munich')) {
    return { name: 'German', code: 'de' }
  }
  if (dest.includes('italy') || dest.includes('rome') || dest.includes('milan')) {
    return { name: 'Italian', code: 'it' }
  }
  if (dest.includes('china') || dest.includes('beijing') || dest.includes('shanghai')) {
    return { name: 'Mandarin Chinese', code: 'zh' }
  }
  if (dest.includes('korea') || dest.includes('seoul')) {
    return { name: 'Korean', code: 'ko' }
  }
  if (dest.includes('portugal') || dest.includes('lisbon')) {
    return { name: 'Portuguese', code: 'pt' }
  }
  if (dest.includes('greece') || dest.includes('athens')) {
    return { name: 'Greek', code: 'el' }
  }
  if (dest.includes('mexico') || dest.includes('latin america')) {
    return { name: 'Spanish', code: 'es' }
  }
  
  // Default to local language learning
  return { name: 'Local Language', code: 'xx' }
}

/**
 * Get language info from code
 */
function getLanguageInfo(code: string): { name: string; code: string } {
  const languages: Record<string, string> = {
    'ja': 'Japanese',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'zh': 'Mandarin Chinese',
    'ko': 'Korean',
    'pt': 'Portuguese',
    'el': 'Greek',
    'xx': 'Local Language'
  }
  
  return { name: languages[code] || 'Local Language', code }
}

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { 
  parsePreferencesXML, 
  serializePreferencesXML, 
  updateFeaturePreferences,
  type TripIntelligencePreferences 
} from '@/lib/utils/xml-preferences'

/**
 * GET /api/profile/intelligence-preferences
 * 
 * Retrieve user's trip intelligence preferences from UserProfileGraph.graphData
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create UserProfileGraph
    let profileGraph = await prisma.userProfileGraph.findUnique({
      where: { userId: session.user.id }
    })

    if (!profileGraph) {
      // Create empty profile graph if doesn't exist
      profileGraph = await prisma.userProfileGraph.create({
        data: {
          userId: session.user.id,
          graphData: null
        }
      })
    }

    // Parse XML to preferences object
    const preferences = parsePreferencesXML(profileGraph.graphData)

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error fetching intelligence preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/profile/intelligence-preferences
 * 
 * Update user's trip intelligence preferences
 * 
 * Body: {
 *   feature: 'currency' | 'emergency' | 'cultural' | 'activities' | 'dining' | 'packing',
 *   preferences: { ... feature-specific preferences }
 * }
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { feature, preferences } = body

    if (!feature || !preferences) {
      return NextResponse.json(
        { error: 'Missing feature or preferences' },
        { status: 400 }
      )
    }

    // Validate feature
    const validFeatures = ['currency', 'emergency', 'cultural', 'activities', 'dining', 'packing']
    if (!validFeatures.includes(feature)) {
      return NextResponse.json(
        { error: 'Invalid feature' },
        { status: 400 }
      )
    }

    // Get or create UserProfileGraph
    let profileGraph = await prisma.userProfileGraph.findUnique({
      where: { userId: session.user.id }
    })

    if (!profileGraph) {
      profileGraph = await prisma.userProfileGraph.create({
        data: {
          userId: session.user.id,
          graphData: null
        }
      })
    }

    // Update feature preferences in XML
    const updatedXML = updateFeaturePreferences(
      profileGraph.graphData,
      feature as keyof TripIntelligencePreferences,
      preferences
    )

    // Save to database
    await prisma.userProfileGraph.update({
      where: { userId: session.user.id },
      data: { graphData: updatedXML }
    })

    // Return updated preferences
    const allPreferences = parsePreferencesXML(updatedXML)

    return NextResponse.json({ 
      success: true,
      preferences: allPreferences 
    })
  } catch (error) {
    console.error('Error updating intelligence preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/profile/intelligence-preferences
 * 
 * Replace all preferences (for bulk updates)
 * 
 * Body: {
 *   preferences: TripIntelligencePreferences
 * }
 */
export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { preferences } = body

    if (!preferences) {
      return NextResponse.json(
        { error: 'Missing preferences' },
        { status: 400 }
      )
    }

    // Serialize to XML
    const xml = serializePreferencesXML(preferences)

    // Get or create UserProfileGraph
    await prisma.userProfileGraph.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        graphData: xml
      },
      update: {
        graphData: xml
      }
    })

    return NextResponse.json({ 
      success: true,
      preferences 
    })
  } catch (error) {
    console.error('Error replacing intelligence preferences:', error)
    return NextResponse.json(
      { error: 'Failed to replace preferences' },
      { status: 500 }
    )
  }
}

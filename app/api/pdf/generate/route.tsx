/**
 * PDF Generation API Route
 * 
 * Generates a PDF for a trip itinerary using @react-pdf/renderer
 * Uploads to UploadThing and saves metadata to database
 */

import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { renderToBuffer } from '@react-pdf/renderer'
import { FullItineraryPDF } from '@/lib/pdf/components/FullItineraryPDF'
import { getTemplate, getDefaultTemplate } from '@/lib/pdf/templates'
import { utapi } from '@/lib/upload-thing-server'
import { mapCategoryToType, mapReservationStatus } from "@/lib/itinerary-view-types"
import { calculateDayCount, calculateSegmentColors } from "@/app/view/lib/view-utils"
import { pgDateToString, pgTimeToString } from "@/lib/utils/local-time"
import { convertToUSD, formatAsUSD } from "@/lib/utils/currency-converter"
import type { ViewItinerary, ViewReservation, PackingList } from "@/lib/itinerary-view-types"

/**
 * Budget category item with pre-calculated USD values
 */
interface BudgetCategoryItem {
  id: string
  title: string
  amountUSD: number
  amountLocal: number
  currency: string
  status: string
}

/**
 * Budget category with totals
 */
interface BudgetCategory {
  category: string
  total: number
  count: number
  items: BudgetCategoryItem[]
}

/**
 * Complete budget data for PDF rendering
 */
export interface PDFBudgetData {
  bookedTotal: number
  categoryTotals: BudgetCategory[]
  tripDays: number
  tripNights: number
  dailyAverage: number
}

/**
 * Map category names to standard categories
 */
function mapBudgetCategory(categoryName: string): string {
  const mapping: Record<string, string> = {
    "Flight": "Transport",
    "Transport": "Transport",
    "Transportation": "Transport",
    "Travel": "Transport",
    "Hotel": "Stay",
    "Stay": "Stay",
    "Accommodation": "Stay",
    "Restaurant": "Eat",
    "Dining": "Eat",
    "Food": "Eat",
    "Eat": "Eat",
    "Activity": "Do",
    "Do": "Do",
    "Tour": "Do",
    "Experience": "Do",
  }
  return mapping[categoryName] || "Other"
}

/**
 * Calculate budget data with proper currency conversion using cached exchange rates
 */
async function calculateBudgetData(itinerary: ViewItinerary): Promise<PDFBudgetData> {
  // Calculate trip duration
  const startDate = new Date(itinerary.startDate)
  const endDate = new Date(itinerary.endDate)
  const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const tripNights = Math.max(0, tripDays - 1)

  // Initialize category map
  const categories = ["Transport", "Stay", "Eat", "Do", "Other"]
  const categoryMap = new Map<string, BudgetCategory>()
  categories.forEach(cat => {
    categoryMap.set(cat, {
      category: cat,
      total: 0,
      count: 0,
      items: [],
    })
  })

  let bookedTotal = 0

  // Process all reservations
  for (const segment of itinerary.segments) {
    for (const res of segment.reservations) {
      const categoryName = res.categoryName || "Other"
      const mappedCategory = mapBudgetCategory(categoryName)
      const cost = res.price || 0
      const currency = res.currency || "USD"

      // Convert to USD using cached exchange rates
      const costUSD = cost > 0 ? await convertToUSD(cost, currency) : 0

      const categoryData = categoryMap.get(mappedCategory) || categoryMap.get("Other")!
      categoryData.total += costUSD
      categoryData.count += 1
      categoryData.items.push({
        id: res.id,
        title: res.title,
        amountUSD: costUSD,
        amountLocal: cost,
        currency: currency,
        status: res.statusName || "Pending",
      })
      bookedTotal += costUSD
    }
  }

  // Filter to only categories with items
  const categoryTotals = Array.from(categoryMap.values()).filter(c => c.count > 0)

  // Calculate daily average
  const dailyAverage = tripDays > 0 ? bookedTotal / tripDays : 0

  return {
    bookedTotal,
    categoryTotals,
    tripDays,
    tripNights,
    dailyAverage,
  }
}

/**
 * Transform packing list from database format to the PackingList interface
 */
function transformPackingList(packingItems: any[]): PackingList {
  const result: PackingList = {
    clothing: [],
    footwear: [],
    gear: [],
    toiletries: [],
    documents: [],
  }
  
  packingItems.forEach(item => {
    const packingItem = {
      name: item.itemName,
      quantity: item.quantity || undefined,
      reason: item.reason || undefined,
    }
    
    switch (item.category?.toLowerCase()) {
      case 'clothing':
        result.clothing.push(packingItem)
        break
      case 'footwear':
        result.footwear.push(packingItem)
        break
      case 'gear':
      case 'gear & accessories':
      case 'accessories':
        result.gear.push(packingItem)
        break
      case 'toiletries':
        result.toiletries.push(packingItem)
        break
      case 'documents':
        result.documents.push(packingItem)
        break
      default:
        // Default to gear if category is unknown
        result.gear.push(packingItem)
    }
  })
  
  return result
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { tripId, templateId = 'full-itinerary' } = body

    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 }
      )
    }

    // Get template
    const template = getTemplate(templateId) || getDefaultTemplate()

    // Fetch trip data with all related information including complete intelligence
    const trip = await prisma.trip.findUnique({
      where: {
        id: tripId,
        userId: session.user.id, // Ensure user owns the trip
      },
      include: {
        segments: {
          orderBy: { order: "asc" },
          include: {
            segmentType: true,
            reservations: {
              include: {
                reservationType: {
                  include: {
                    category: true
                  }
                },
                reservationStatus: true
              },
              orderBy: { startTime: "asc" }
            }
          }
        },
        intelligence: {
          include: {
            currencyAdvice: true,
            emergencyInfo: true,
            culturalEvents: true,
            activitySuggestions: true,
            diningRecommendations: true,
            packingList: true,
            languageGuides: {
              include: {
                scenarios: {
                  include: {
                    phrases: true,
                    verbs: true,
                  }
                }
              }
            }
          }
        },
        weatherCache: true,
      }
    })

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found or access denied" },
        { status: 404 }
      )
    }

    // Transform trip data into ViewItinerary format
    const startDate = trip.startDate.toISOString().split('T')[0]
    const endDate = trip.endDate.toISOString().split('T')[0]
    
    // Transform segments with pre-calculated USD values for each reservation
    const segments = await Promise.all(trip.segments.map(async segment => {
      // Transform reservations with pre-calculated USD values
      const reservations = await Promise.all(segment.reservations.map(async res => {
        const price = res.cost || 0
        const currency = res.currency || 'USD'
        // Pre-calculate USD value using cached exchange rates
        const priceUSD = price > 0 ? await convertToUSD(price, currency) : 0
        
        return {
          id: res.id,
          type: mapCategoryToType(res.reservationType.category.name),
          title: res.name,
          description: res.reservationType.name,
          date: res.startTime?.toISOString().split('T')[0] || segment.startTime?.toISOString().split('T')[0] || startDate,
          time: res.startTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) || "00:00",
          location: res.location || segment.endTitle || "",
          confirmationNumber: res.confirmationNumber || "",
          image: res.imageUrl || "",
          price,
          priceUSD, // Pre-calculated USD value
          currency: res.currency || undefined,
          notes: res.notes || "",
          latitude: res.latitude || undefined,
          longitude: res.longitude || undefined,
          departureLocation: res.departureLocation || undefined,
          arrivalLocation: res.arrivalLocation || undefined,
          categoryName: res.reservationType.category.name,
          startTime: res.startTime?.toISOString(),
          endTime: res.endTime?.toISOString(),
          // Wall time fields for accurate local time display
          wallStartDate: pgDateToString(res.wall_start_date) || undefined,
          wallStartTime: pgTimeToString(res.wall_start_time) || undefined,
          wallEndDate: pgDateToString(res.wall_end_date) || undefined,
          wallEndTime: pgTimeToString(res.wall_end_time) || undefined,
          timeZoneId: res.timeZoneId || undefined,
          status: mapReservationStatus(res.reservationStatus.name),
          statusName: res.reservationStatus.name,
          reservationStatusId: res.reservationStatusId,
        }
      }))
      
      return {
        id: segment.id,
        title: segment.name,
        startDate: segment.startTime?.toISOString().split('T')[0] || startDate,
        endDate: segment.endTime?.toISOString().split('T')[0] || endDate,
        destination: segment.endTitle || segment.startTitle,
        startLat: segment.startLat,
        startLng: segment.startLng,
        endLat: segment.endLat,
        endLng: segment.endLng,
        startTitle: segment.startTitle,
        endTitle: segment.endTitle,
        segmentType: segment.segmentType.name,
        imageUrl: segment.imageUrl || undefined,
        reservations,
      }
    }))
    
    const pendingCount = segments.reduce((count, seg) => 
      count + seg.reservations.filter(r => r.status === 'pending').length, 0
    )
    
    const itinerary: ViewItinerary = {
      id: trip.id,
      title: trip.title,
      description: trip.description,
      startDate,
      endDate,
      coverImage: trip.imageUrl || "",
      segments,
      dayCount: calculateDayCount(startDate, endDate),
      segmentColors: calculateSegmentColors(segments),
      pendingCount,
    }

    // Prepare intelligence data if available (includes all AI-powered sections)
    let intelligenceData = undefined
    if (template.includeIntelligence && trip.intelligence) {
      // Transform packing list from database format to expected format
      const packingList = trip.intelligence.hasPackingList && trip.intelligence.packingList?.length > 0
        ? transformPackingList(trip.intelligence.packingList)
        : undefined
      
      // Transform language guides from database format
      const languageGuides = trip.intelligence.hasLanguageGuides && trip.intelligence.languageGuides?.length > 0
        ? trip.intelligence.languageGuides.map(guide => ({
            targetLanguage: guide.targetLanguage,
            targetLanguageCode: guide.targetLanguageCode,
            userProficiency: guide.userProficiency,
            destinations: guide.destinations,
            scenarios: guide.scenarios.map(scenario => ({
              scenario: scenario.scenario,
              relevanceScore: scenario.relevanceScore,
              reasoning: scenario.reasoning,
              phrases: scenario.phrases.map(phrase => ({
                phrase: phrase.phrase,
                translation: phrase.translation,
                romanization: phrase.romanization,
                reasoning: phrase.reasoning,
              })),
              verbs: scenario.verbs?.map(verb => ({
                verb: verb.verb,
                conjugation: verb.conjugation,
                usage: verb.usage,
              })) || [],
            })),
          }))
        : undefined
      
      intelligenceData = {
        packing: packingList,
        language: languageGuides,
        currency: trip.intelligence.hasCurrencyAdvice ? trip.intelligence.currencyAdvice : undefined,
        emergency: trip.intelligence.hasEmergencyInfo ? trip.intelligence.emergencyInfo : undefined,
        cultural: trip.intelligence.hasCulturalCalendar ? trip.intelligence.culturalEvents : undefined,
        activities: trip.intelligence.hasActivitySuggestions ? trip.intelligence.activitySuggestions : undefined,
        dining: trip.intelligence.hasDiningRecommendations ? trip.intelligence.diningRecommendations : undefined,
      }
    }
    
    // Prepare weather data from cache
    const weatherData = trip.weatherCache?.map(cache => {
      const data = cache.weatherData as any
      return {
        location: data.location || 'Unknown',
        country: data.country || '',
        forecast: data.forecast || [],
        isForecastForTripDates: data.isForecastForTripDates,
        forecastNote: data.forecastNote,
      }
    }) || []

    // Calculate budget data with proper currency conversion
    const budgetData = await calculateBudgetData(itinerary)

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      <FullItineraryPDF
        itinerary={itinerary}
        intelligence={intelligenceData}
        weather={weatherData}
        budget={budgetData}
        template={template}
      />
    )

    // Upload to UploadThing
    const fileName = `trip-${tripId}-${Date.now()}.pdf`
    const file = new File([pdfBuffer], fileName, { type: 'application/pdf' })
    
    const uploadResult = await utapi.uploadFiles(file)
    
    if (!uploadResult.data) {
      throw new Error('Failed to upload PDF to storage')
    }

    // Save PDF metadata to database
    const pdfRecord = await prisma.tripPDF.create({
      data: {
        tripId: trip.id,
        userId: session.user.id,
        templateId: template.id,
        templateName: template.name,
        fileUrl: uploadResult.data.url,
        fileKey: uploadResult.data.key,
      }
    })

    // Return success response
    return NextResponse.json({
      success: true,
      pdfId: pdfRecord.id,
      pdfUrl: pdfRecord.fileUrl,
      templateName: pdfRecord.templateName,
      generatedAt: pdfRecord.generatedAt.toISOString(),
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate PDF" },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve PDF history for a trip
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId')

    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 }
      )
    }

    // Verify trip ownership
    const trip = await prisma.trip.findUnique({
      where: {
        id: tripId,
        userId: session.user.id,
      }
    })

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found or access denied" },
        { status: 404 }
      )
    }

    // Fetch all PDFs for this trip
    const pdfs = await prisma.tripPDF.findMany({
      where: {
        tripId: tripId,
        userId: session.user.id,
      },
      orderBy: {
        generatedAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      pdfs: pdfs.map(pdf => ({
        id: pdf.id,
        templateName: pdf.templateName,
        fileUrl: pdf.fileUrl,
        generatedAt: pdf.generatedAt.toISOString(),
      }))
    })

  } catch (error) {
    console.error('PDF fetch error:', error)
    return NextResponse.json(
      { error: "Failed to fetch PDFs" },
      { status: 500 }
    )
  }
}

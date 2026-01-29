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
import type { ViewItinerary } from "@/lib/itinerary-view-types"

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

    // Fetch trip data with all related information
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
          }
        }
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
    
    const segments = trip.segments.map(segment => ({
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
      reservations: segment.reservations.map(res => ({
        id: res.id,
        type: mapCategoryToType(res.reservationType.category.name),
        title: res.name,
        description: res.reservationType.name,
        date: res.startTime?.toISOString().split('T')[0] || segment.startTime?.toISOString().split('T')[0] || startDate,
        time: res.startTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) || "00:00",
        location: res.location || segment.endTitle || "",
        confirmationNumber: res.confirmationNumber || "",
        image: res.imageUrl || "",
        price: res.cost || 0,
        notes: res.notes || "",
        latitude: res.latitude || undefined,
        longitude: res.longitude || undefined,
        departureLocation: res.departureLocation || undefined,
        arrivalLocation: res.arrivalLocation || undefined,
        categoryName: res.reservationType.category.name,
        startTime: res.startTime?.toISOString(),
        endTime: res.endTime?.toISOString(),
        status: mapReservationStatus(res.reservationStatus.name),
        statusName: res.reservationStatus.name,
        reservationStatusId: res.reservationStatusId,
      }))
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

    // Prepare intelligence data if available
    let intelligenceData = undefined
    if (template.includeIntelligence && trip.intelligence) {
      intelligenceData = {
        currency: trip.intelligence.hasCurrencyAdvice ? trip.intelligence.currencyAdvice : undefined,
        emergency: trip.intelligence.hasEmergencyInfo ? trip.intelligence.emergencyInfo : undefined,
        cultural: trip.intelligence.hasCulturalCalendar ? trip.intelligence.culturalEvents : undefined,
        activities: trip.intelligence.hasActivitySuggestions ? trip.intelligence.activitySuggestions : undefined,
        dining: trip.intelligence.hasDiningRecommendations ? trip.intelligence.diningRecommendations : undefined,
      }
    }

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      <FullItineraryPDF
        itinerary={itinerary}
        intelligence={intelligenceData}
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

/**
 * Full Itinerary PDF Document
 * 
 * Main PDF document component that assembles all sections.
 * Includes per-segment maps, weather forecast, budget summary, and complete AI-powered insights.
 */

import React from 'react'
import { Document, Page, View, Text, Image } from '@react-pdf/renderer'
import { styles } from './styles'

// Logo URL - using absolute URL for PDF rendering
const LOGO_URL = 'https://ntourage.travel/ntourage-logo.png'
import { PDFHeader } from './PDFHeader'
import { PDFQuickReference } from './PDFQuickReference'
import { PDFSegment } from './PDFSegment'
import { PDFIntelligence } from './PDFIntelligence'
import { PDFSegmentMaps } from './PDFSegmentMaps'
import { PDFWeather } from './PDFWeather'
import { PDFBudget } from './PDFBudget'
import type { ViewItinerary, WeatherData } from '@/lib/itinerary-view-types'
import type { PDFTemplate } from '../templates/types'

/**
 * Budget data structure (pre-calculated in API route)
 */
interface BudgetCategoryItem {
  id: string
  title: string
  amountUSD: number
  amountLocal: number
  currency: string
  status: string
}

interface BudgetCategory {
  category: string
  total: number
  count: number
  items: BudgetCategoryItem[]
}

interface PDFBudgetData {
  bookedTotal: number
  categoryTotals: BudgetCategory[]
  tripDays: number
  tripNights: number
  dailyAverage: number
}

interface FullItineraryPDFProps {
  itinerary: ViewItinerary
  intelligence?: any
  weather?: WeatherData[]
  budget?: PDFBudgetData
  template: PDFTemplate
}

export function FullItineraryPDF({
  itinerary,
  intelligence,
  weather,
  budget,
  template,
}: FullItineraryPDFProps) {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  
  return (
    <Document
      title={itinerary.title}
      author="Ntourage Travel"
      subject={`Trip Itinerary: ${itinerary.title}`}
      keywords="travel, itinerary, trip, vacation"
      creator="Ntourage Travel Planner"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <PDFHeader
          title={itinerary.title}
          description={itinerary.description}
          startDate={itinerary.startDate}
          endDate={itinerary.endDate}
          coverImage={itinerary.coverImage}
          dayCount={itinerary.dayCount}
        />
        
        {/* Quick Reference Table */}
        <PDFQuickReference itinerary={itinerary} />
        
        {/* Journey Section - Detailed segments and reservations */}
        {template.sections.journey && (
          <View>
            <Text style={styles.sectionHeader}>Your Journey</Text>
            
            {itinerary.segments.length > 0 ? (
              itinerary.segments.map((segment, index) => (
                <PDFSegment
                  key={segment.id}
                  segment={segment}
                  segmentNumber={index + 1}
                />
              ))
            ) : (
              <Text style={styles.reservationDetail}>
                No segments have been added to this trip yet.
              </Text>
            )}
          </View>
        )}
        
        {/* Weather Forecast Section */}
        {template.sections.weather !== false && weather && weather.length > 0 && (
          <PDFWeather
            weather={weather}
            tripStartDate={itinerary.startDate}
            tripEndDate={itinerary.endDate}
          />
        )}
        
        {/* Intelligence Sections - Complete AI-powered insights */}
        {template.includeIntelligence && intelligence && (
          <PDFIntelligence
            intelligence={intelligence}
            sections={template.sections}
          />
        )}
        
        {/* Maps & Locations Section - Per-segment maps at the end */}
        {itinerary.segments.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Maps & Locations</Text>
            {itinerary.segments.map((segment, index) => (
              <PDFSegmentMaps
                key={segment.id}
                segment={segment}
                segmentNumber={index + 1}
              />
            ))}
          </View>
        )}
        
        {/* Budget Summary Section */}
        {budget && budget.bookedTotal > 0 && (
          <PDFBudget budget={budget} />
        )}
        
        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerContent}>
            <View style={styles.footerLeft}>
              <Image src={LOGO_URL} style={styles.footerLogo} />
              <Text style={styles.footerBrand}>Ntourage.travel</Text>
            </View>
            <Text style={styles.footerCenter}>
              Generated on {generatedDate}
            </Text>
            <Text
              style={styles.footerRight}
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
              }
            />
          </View>
        </View>
      </Page>
    </Document>
  )
}

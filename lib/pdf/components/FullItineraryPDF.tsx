/**
 * Full Itinerary PDF Document
 * 
 * Main PDF document component that assembles all sections
 */

import React from 'react'
import { Document, Page, View, Text } from '@react-pdf/renderer'
import { styles } from './styles'
import { PDFHeader } from './PDFHeader'
import { PDFQuickReference } from './PDFQuickReference'
import { PDFSegment } from './PDFSegment'
import { PDFIntelligence } from './PDFIntelligence'
import type { ViewItinerary } from '@/lib/itinerary-view-types'
import type { PDFTemplate } from '../templates/types'

interface FullItineraryPDFProps {
  itinerary: ViewItinerary
  intelligence?: any
  template: PDFTemplate
}

export function FullItineraryPDF({
  itinerary,
  intelligence,
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
      author="Travel Planner"
      subject={`Trip Itinerary: ${itinerary.title}`}
      keywords="travel, itinerary, trip, vacation"
      creator="Travel Planner v2"
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
        
        {/* Journey Section */}
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
        
        {/* Intelligence Sections */}
        {template.includeIntelligence && intelligence && (
          <PDFIntelligence
            intelligence={intelligence}
            sections={template.sections}
          />
        )}
        
        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            Generated on {generatedDate} • Travel Planner v2
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}

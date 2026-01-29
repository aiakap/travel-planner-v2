/**
 * PDF Template Types
 * 
 * Defines the structure for PDF templates that can be used to generate
 * trip itinerary PDFs with different layouts and content sections.
 */

export interface PDFTemplate {
  id: string
  name: string
  description: string
  includeIntelligence: boolean
  sections: {
    journey: boolean
    weather: boolean
    packing: boolean
    currency: boolean
    emergency: boolean
    cultural: boolean
    activities: boolean
    dining: boolean
    language: boolean
    documents: boolean
  }
}

export interface PDFTemplateRegistry {
  [key: string]: PDFTemplate
}

/**
 * PDF Template Registry
 * 
 * Central registry of all available PDF templates for trip itineraries.
 * Templates can be selected by users when generating PDFs.
 */

import type { PDFTemplate, PDFTemplateRegistry } from './types'
import { fullItineraryTemplate } from './full-itinerary'

export const templates: PDFTemplateRegistry = {
  'full-itinerary': fullItineraryTemplate,
}

export function getTemplate(templateId: string): PDFTemplate | null {
  return templates[templateId] || null
}

export function getDefaultTemplate(): PDFTemplate {
  return fullItineraryTemplate
}

export function getAllTemplates(): PDFTemplate[] {
  return Object.values(templates)
}

export type { PDFTemplate, PDFTemplateRegistry }

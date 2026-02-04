/**
 * PDF Intelligence Component
 * 
 * Displays AI-powered trip intelligence sections (packing, currency, emergency, etc.)
 * Enhanced with luggage strategy and improved language guide support.
 */

import React from 'react'
import { View, Text } from '@react-pdf/renderer'
import { styles } from './styles'
import type { PackingList } from '@/lib/itinerary-view-types'

// Language guide structure from database
interface LanguagePhrase {
  phrase: string
  translation: string
  romanization?: string
  reasoning?: string
}

interface LanguageVerb {
  verb: string
  conjugation: string
  usage?: string
}

interface LanguageScenario {
  scenario: string
  relevanceScore?: number
  reasoning?: string
  phrases: LanguagePhrase[]
  verbs?: LanguageVerb[]
}

interface LanguageGuide {
  targetLanguage: string
  targetLanguageCode?: string
  userProficiency?: string
  destinations?: string
  scenarios: LanguageScenario[]
}

interface IntelligenceData {
  packing?: PackingList
  currency?: any[]
  emergency?: any[]
  cultural?: any[]
  activities?: any[]
  dining?: any[]
  language?: LanguageGuide[] | any
}

interface PDFIntelligenceProps {
  intelligence: IntelligenceData
  sections: {
    packing: boolean
    currency: boolean
    emergency: boolean
    cultural: boolean
    activities: boolean
    dining: boolean
    language: boolean
  }
}

export function PDFIntelligence({ intelligence, sections }: PDFIntelligenceProps) {
  const hasAnyIntelligence = Object.values(intelligence).some(data => 
    data && (Array.isArray(data) ? data.length > 0 : true)
  )
  
  if (!hasAnyIntelligence) {
    return null
  }
  
  return (
    <View>
      <Text style={styles.sectionHeader}>AI-Powered Insights</Text>
      
      {/* Packing List - with luggage strategy and special notes */}
      {sections.packing && intelligence.packing && (
        <View style={styles.intelligenceSection}>
          <Text style={styles.intelligenceTitle}>Packing List</Text>
          
          {/* Luggage Strategy - if available */}
          {intelligence.packing.luggageStrategy && (
            <View style={styles.intelligenceItem}>
              <Text style={styles.intelligenceLabel}>Luggage Strategy</Text>
              {intelligence.packing.luggageStrategy.bags && intelligence.packing.luggageStrategy.bags.length > 0 && (
                <View style={styles.list}>
                  {intelligence.packing.luggageStrategy.bags.map((bag, idx) => (
                    <Text key={idx} style={styles.listItem}>
                      • {bag.type}: {bag.reason}
                    </Text>
                  ))}
                </View>
              )}
              {intelligence.packing.luggageStrategy.organization && (
                <Text style={styles.intelligenceText}>
                  Organization: {intelligence.packing.luggageStrategy.organization}
                </Text>
              )}
              {intelligence.packing.luggageStrategy.tips && intelligence.packing.luggageStrategy.tips.length > 0 && (
                <View style={styles.list}>
                  {intelligence.packing.luggageStrategy.tips.map((tip, idx) => (
                    <Text key={idx} style={styles.listItemTip}>
                      Tip: {tip}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
          
          {intelligence.packing.clothing && intelligence.packing.clothing.length > 0 && (
            <View style={styles.intelligenceItem}>
              <Text style={styles.intelligenceLabel}>Clothing</Text>
              {intelligence.packing.clothingReasons && (
                <Text style={styles.intelligenceTextSmall}>{intelligence.packing.clothingReasons}</Text>
              )}
              <View style={styles.list}>
                {intelligence.packing.clothing.map((item, idx) => (
                  <Text key={idx} style={styles.listItem}>
                    • {item.name} {item.quantity && `(${item.quantity})`}
                    {item.reason && ` - ${item.reason}`}
                  </Text>
                ))}
              </View>
            </View>
          )}
          
          {intelligence.packing.footwear && intelligence.packing.footwear.length > 0 && (
            <View style={styles.intelligenceItem}>
              <Text style={styles.intelligenceLabel}>Footwear</Text>
              {intelligence.packing.footwearReasons && (
                <Text style={styles.intelligenceTextSmall}>{intelligence.packing.footwearReasons}</Text>
              )}
              <View style={styles.list}>
                {intelligence.packing.footwear.map((item, idx) => (
                  <Text key={idx} style={styles.listItem}>
                    • {item.name} {item.quantity && `(${item.quantity})`}
                    {item.reason && ` - ${item.reason}`}
                  </Text>
                ))}
              </View>
            </View>
          )}
          
          {intelligence.packing.gear && intelligence.packing.gear.length > 0 && (
            <View style={styles.intelligenceItem}>
              <Text style={styles.intelligenceLabel}>Gear & Accessories</Text>
              {intelligence.packing.gearReasons && (
                <Text style={styles.intelligenceTextSmall}>{intelligence.packing.gearReasons}</Text>
              )}
              <View style={styles.list}>
                {intelligence.packing.gear.map((item, idx) => (
                  <Text key={idx} style={styles.listItem}>
                    • {item.name} {item.quantity && `(${item.quantity})`}
                    {item.reason && ` - ${item.reason}`}
                  </Text>
                ))}
              </View>
            </View>
          )}
          
          {intelligence.packing.toiletries && intelligence.packing.toiletries.length > 0 && (
            <View style={styles.intelligenceItem}>
              <Text style={styles.intelligenceLabel}>Toiletries</Text>
              {intelligence.packing.toiletriesReasons && (
                <Text style={styles.intelligenceTextSmall}>{intelligence.packing.toiletriesReasons}</Text>
              )}
              <View style={styles.list}>
                {intelligence.packing.toiletries.map((item, idx) => (
                  <Text key={idx} style={styles.listItem}>
                    • {item.name} {item.quantity && `(${item.quantity})`}
                  </Text>
                ))}
              </View>
            </View>
          )}
          
          {intelligence.packing.documents && intelligence.packing.documents.length > 0 && (
            <View style={styles.intelligenceItem}>
              <Text style={styles.intelligenceLabel}>Documents</Text>
              {intelligence.packing.documentsReasons && (
                <Text style={styles.intelligenceTextSmall}>{intelligence.packing.documentsReasons}</Text>
              )}
              <View style={styles.list}>
                {intelligence.packing.documents.map((item, idx) => (
                  <Text key={idx} style={styles.listItem}>
                    • {item.name}
                  </Text>
                ))}
              </View>
            </View>
          )}
          
          {/* Special Notes */}
          {intelligence.packing.specialNotes && intelligence.packing.specialNotes.length > 0 && (
            <View style={styles.intelligenceItem}>
              <Text style={styles.intelligenceLabel}>Special Notes</Text>
              <View style={styles.list}>
                {intelligence.packing.specialNotes.map((note, idx) => (
                  <Text key={idx} style={styles.listItemNote}>
                    {note}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
      
      {/* Currency Advice - individual items can wrap */}
      {sections.currency && intelligence.currency && intelligence.currency.length > 0 && (
        <View style={styles.intelligenceSection}>
          <Text style={styles.intelligenceTitle}>Currency & Money</Text>
          {intelligence.currency.map((advice: any, idx: number) => (
            <View key={idx} style={styles.intelligenceItem} wrap={false}>
              <Text style={styles.intelligenceLabel}>{advice.destination}</Text>
              <Text style={styles.intelligenceText}>
                Currency: {advice.currency} {advice.exchangeRate && `(Rate: ${advice.exchangeRate} ${advice.baseCurrency})`}
              </Text>
              {advice.tippingCustom && <Text style={styles.intelligenceText}>Tipping: {advice.tippingCustom}</Text>}
              {advice.atmLocations && <Text style={styles.intelligenceText}>ATMs: {advice.atmLocations}</Text>}
              {advice.cardAcceptance && <Text style={styles.intelligenceText}>Cards: {advice.cardAcceptance}</Text>}
              {advice.cashRecommendation && <Text style={styles.intelligenceText}>Cash: {advice.cashRecommendation}</Text>}
            </View>
          ))}
        </View>
      )}
      
      {/* Emergency Information - individual items can wrap */}
      {sections.emergency && intelligence.emergency && intelligence.emergency.length > 0 && (
        <View style={styles.intelligenceSection}>
          <Text style={styles.intelligenceTitle}>Emergency Information</Text>
          {intelligence.emergency.map((info: any, idx: number) => (
            <View key={idx} style={styles.intelligenceItem} wrap={false}>
              <Text style={styles.intelligenceLabel}>{info.destination}</Text>
              {info.embassyName && (
                <Text style={styles.intelligenceText}>
                  Embassy: {info.embassyName}
                </Text>
              )}
              {info.embassyAddress && (
                <Text style={styles.intelligenceText}>
                  Address: {info.embassyAddress}
                </Text>
              )}
              {info.embassyPhone && (
                <Text style={styles.intelligenceText}>
                  Phone: {info.embassyPhone}
                </Text>
              )}
              {info.embassyEmail && (
                <Text style={styles.intelligenceText}>
                  Email: {info.embassyEmail}
                </Text>
              )}
              {info.safetyLevel && (
                <Text style={styles.intelligenceText}>
                  Safety Level: {info.safetyLevel}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
      
      {/* Cultural Events - can be large, allow section wrapping */}
      {sections.cultural && intelligence.cultural && intelligence.cultural.length > 0 && (
        <View style={styles.intelligenceSection}>
          <Text style={styles.intelligenceTitle}>Cultural Events & Holidays</Text>
          {intelligence.cultural.map((event: any, idx: number) => (
            <View key={idx} style={styles.intelligenceItem} wrap={false}>
              <Text style={styles.intelligenceLabel}>{event.eventName}</Text>
              <Text style={styles.intelligenceText}>
                {event.destination} {event.eventType && `• ${event.eventType}`}
              </Text>
              {event.description && <Text style={styles.intelligenceText}>{event.description}</Text>}
              {event.impact && <Text style={styles.intelligenceText}>Impact: {event.impact}</Text>}
            </View>
          ))}
        </View>
      )}
      
      {/* Activity Suggestions - can be large, allow section wrapping */}
      {sections.activities && intelligence.activities && intelligence.activities.length > 0 && (
        <View style={styles.intelligenceSection}>
          <Text style={styles.intelligenceTitle}>Activity Suggestions</Text>
          {intelligence.activities.map((activity: any, idx: number) => (
            <View key={idx} style={styles.intelligenceItem} wrap={false}>
              <Text style={styles.intelligenceLabel}>{activity.activityName}</Text>
              <Text style={styles.intelligenceText}>
                {activity.location} {activity.activityType && `• ${activity.activityType}`}
              </Text>
              {activity.description && <Text style={styles.intelligenceText}>{activity.description}</Text>}
              <Text style={styles.intelligenceText}>
                {activity.estimatedDuration && `Duration: ${activity.estimatedDuration} hours`}
                {activity.estimatedDuration && activity.estimatedCost && ' • '}
                {activity.estimatedCost && `Cost: ${activity.estimatedCost}`}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Dining Recommendations - can be large, allow section wrapping */}
      {sections.dining && intelligence.dining && intelligence.dining.length > 0 && (
        <View style={styles.intelligenceSection}>
          <Text style={styles.intelligenceTitle}>Dining Recommendations</Text>
          {intelligence.dining.map((restaurant: any, idx: number) => (
            <View key={idx} style={styles.intelligenceItem} wrap={false}>
              <Text style={styles.intelligenceLabel}>{restaurant.restaurantName}</Text>
              <Text style={styles.intelligenceText}>
                {restaurant.cuisineType} {restaurant.priceRange && `• ${restaurant.priceRange}`}
              </Text>
              <Text style={styles.intelligenceText}>
                {restaurant.location} {restaurant.distance && `• ${restaurant.distance}`}
              </Text>
              {restaurant.description && <Text style={styles.intelligenceText}>{restaurant.description}</Text>}
            </View>
          ))}
        </View>
      )}
      
      {/* Language Guide - Enhanced with scenario-based structure */}
      {sections.language && intelligence.language && (
        <View style={styles.intelligenceSection}>
          <Text style={styles.intelligenceTitle}>Language Guide</Text>
          
          {/* Handle array of language guides (new database structure) */}
          {Array.isArray(intelligence.language) && intelligence.language.length > 0 && (
            <View>
              {(intelligence.language as LanguageGuide[]).map((guide, guideIdx) => (
                <View key={guideIdx} style={styles.languageGuideContainer}>
                  <Text style={styles.languageGuideName}>
                    {guide.targetLanguage}
                    {guide.userProficiency && ` (${guide.userProficiency})`}
                  </Text>
                  
                  {guide.scenarios && guide.scenarios.map((scenario, scenarioIdx) => (
                    <View key={scenarioIdx} style={styles.languageCategory}>
                      <Text style={styles.languageCategoryTitle}>
                        {formatScenarioName(scenario.scenario)}
                      </Text>
                      
                      {/* Phrases */}
                      {scenario.phrases && scenario.phrases.map((phrase, phraseIdx) => (
                        <View key={phraseIdx} style={styles.phraseContainer}>
                          <View style={styles.phraseRow}>
                            <Text style={styles.phraseLocal}>{phrase.phrase}</Text>
                            <Text style={styles.phraseEnglish}>{phrase.translation}</Text>
                          </View>
                          {phrase.romanization && (
                            <Text style={styles.phrasePronunciation}>({phrase.romanization})</Text>
                          )}
                        </View>
                      ))}
                      
                      {/* Key Verbs */}
                      {scenario.verbs && scenario.verbs.length > 0 && (
                        <View style={styles.verbsContainer}>
                          <Text style={styles.verbsTitle}>Key Verbs:</Text>
                          {scenario.verbs.map((verb, verbIdx) => (
                            <Text key={verbIdx} style={styles.verbItem}>
                              • {verb.verb}: {verb.conjugation}
                              {verb.usage && ` - ${verb.usage}`}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
          
          {/* Handle legacy flat phrase structure */}
          {!Array.isArray(intelligence.language) && intelligence.language.phrases && Array.isArray(intelligence.language.phrases) && (
            <View>
              {intelligence.language.phrases.map((phrase: any, idx: number) => (
                <View key={idx} style={styles.phraseRow}>
                  <Text style={styles.phraseLocal}>{phrase.local || phrase.phrase}</Text>
                  <Text style={styles.phraseEnglish}>{phrase.english || phrase.translation}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Handle legacy categorized phrases */}
          {!Array.isArray(intelligence.language) && intelligence.language.categories && Array.isArray(intelligence.language.categories) && (
            <View>
              {intelligence.language.categories.map((category: any, catIdx: number) => (
                <View key={catIdx} style={styles.languageCategory}>
                  <Text style={styles.languageCategoryTitle}>{category.name || category.category}</Text>
                  {category.phrases && category.phrases.map((phrase: any, phraseIdx: number) => (
                    <View key={phraseIdx}>
                      <View style={styles.phraseRow}>
                        <Text style={styles.phraseLocal}>{phrase.local || phrase.phrase}</Text>
                        <Text style={styles.phraseEnglish}>{phrase.english || phrase.translation}</Text>
                      </View>
                      {phrase.pronunciation && (
                        <Text style={styles.phrasePronunciation}>({phrase.pronunciation})</Text>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

/**
 * Format scenario name for display (convert snake_case to Title Case)
 */
function formatScenarioName(scenario: string): string {
  return scenario
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

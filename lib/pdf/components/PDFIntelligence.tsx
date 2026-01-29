/**
 * PDF Intelligence Component
 * 
 * Displays AI-powered trip intelligence sections (packing, currency, emergency, etc.)
 */

import React from 'react'
import { View, Text } from '@react-pdf/renderer'
import { styles } from './styles'
import type { PackingList } from '@/lib/itinerary-view-types'

interface IntelligenceData {
  packing?: PackingList
  currency?: any[]
  emergency?: any[]
  cultural?: any[]
  activities?: any[]
  dining?: any[]
  language?: any
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
      
      {/* Packing List - can be large, allow wrapping */}
      {sections.packing && intelligence.packing && (
        <View style={styles.intelligenceSection}>
          <Text style={styles.intelligenceTitle}>Packing List</Text>
          
          {intelligence.packing.clothing && intelligence.packing.clothing.length > 0 && (
            <View style={styles.intelligenceItem} wrap={false}>
              <Text style={styles.intelligenceLabel}>Clothing</Text>
              <View style={styles.list}>
                {intelligence.packing.clothing.map((item, idx) => (
                  <Text key={idx} style={styles.listItem}>
                    • {item.name} {item.quantity && `(${item.quantity})`}
                  </Text>
                ))}
              </View>
            </View>
          )}
          
          {intelligence.packing.footwear && intelligence.packing.footwear.length > 0 && (
            <View style={styles.intelligenceItem} wrap={false}>
              <Text style={styles.intelligenceLabel}>Footwear</Text>
              <View style={styles.list}>
                {intelligence.packing.footwear.map((item, idx) => (
                  <Text key={idx} style={styles.listItem}>
                    • {item.name} {item.quantity && `(${item.quantity})`}
                  </Text>
                ))}
              </View>
            </View>
          )}
          
          {intelligence.packing.gear && intelligence.packing.gear.length > 0 && (
            <View style={styles.intelligenceItem} wrap={false}>
              <Text style={styles.intelligenceLabel}>Gear & Accessories</Text>
              <View style={styles.list}>
                {intelligence.packing.gear.map((item, idx) => (
                  <Text key={idx} style={styles.listItem}>
                    • {item.name} {item.quantity && `(${item.quantity})`}
                  </Text>
                ))}
              </View>
            </View>
          )}
          
          {intelligence.packing.toiletries && intelligence.packing.toiletries.length > 0 && (
            <View style={styles.intelligenceItem} wrap={false}>
              <Text style={styles.intelligenceLabel}>Toiletries</Text>
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
            <View style={styles.intelligenceItem} wrap={false}>
              <Text style={styles.intelligenceLabel}>Documents</Text>
              <View style={styles.list}>
                {intelligence.packing.documents.map((item, idx) => (
                  <Text key={idx} style={styles.listItem}>
                    • {item.name}
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
      
      {/* Language Guide - NEW */}
      {sections.language && intelligence.language && (
        <View style={styles.intelligenceSection}>
          <Text style={styles.intelligenceTitle}>Language Guide</Text>
          
          {/* Handle different language data structures */}
          {intelligence.language.phrases && Array.isArray(intelligence.language.phrases) && (
            <View>
              {intelligence.language.phrases.map((phrase: any, idx: number) => (
                <View key={idx} style={styles.phraseRow}>
                  <Text style={styles.phraseLocal}>{phrase.local || phrase.phrase}</Text>
                  <Text style={styles.phraseEnglish}>{phrase.english || phrase.translation}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Handle categorized phrases */}
          {intelligence.language.categories && Array.isArray(intelligence.language.categories) && (
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
          
          {/* Handle flat object with phrase categories as keys */}
          {!intelligence.language.phrases && !intelligence.language.categories && (
            <View>
              {Object.entries(intelligence.language).map(([key, value]: [string, any], idx: number) => {
                if (Array.isArray(value) && value.length > 0) {
                  return (
                    <View key={idx} style={styles.languageCategory}>
                      <Text style={styles.languageCategoryTitle}>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                      </Text>
                      {value.map((phrase: any, phraseIdx: number) => (
                        <View key={phraseIdx}>
                          <View style={styles.phraseRow}>
                            <Text style={styles.phraseLocal}>
                              {typeof phrase === 'string' ? phrase : (phrase.local || phrase.phrase || phrase.text)}
                            </Text>
                            <Text style={styles.phraseEnglish}>
                              {typeof phrase === 'string' ? '' : (phrase.english || phrase.translation || phrase.meaning)}
                            </Text>
                          </View>
                          {phrase.pronunciation && (
                            <Text style={styles.phrasePronunciation}>({phrase.pronunciation})</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )
                }
                return null
              })}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

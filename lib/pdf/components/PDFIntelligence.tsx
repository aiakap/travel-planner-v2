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
      
      {/* Packing List */}
      {sections.packing && intelligence.packing && (
        <View style={styles.intelligenceSection} wrap={false}>
          <Text style={styles.intelligenceTitle}>Packing List</Text>
          
          {intelligence.packing.clothing && intelligence.packing.clothing.length > 0 && (
            <View style={styles.intelligenceItem}>
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
            <View style={styles.intelligenceItem}>
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
            <View style={styles.intelligenceItem}>
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
            <View style={styles.intelligenceItem}>
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
            <View style={styles.intelligenceItem}>
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
      
      {/* Currency Advice */}
      {sections.currency && intelligence.currency && intelligence.currency.length > 0 && (
        <View style={styles.intelligenceSection} wrap={false}>
          <Text style={styles.intelligenceTitle}>Currency & Money</Text>
          {intelligence.currency.map((advice: any, idx: number) => (
            <View key={idx} style={styles.intelligenceItem}>
              <Text style={styles.intelligenceLabel}>{advice.destination}</Text>
              <Text style={styles.intelligenceText}>
                Currency: {advice.currency} (Rate: {advice.exchangeRate} {advice.baseCurrency})
              </Text>
              <Text style={styles.intelligenceText}>Tipping: {advice.tippingCustom}</Text>
              <Text style={styles.intelligenceText}>ATMs: {advice.atmLocations}</Text>
              <Text style={styles.intelligenceText}>Cards: {advice.cardAcceptance}</Text>
              <Text style={styles.intelligenceText}>Cash: {advice.cashRecommendation}</Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Emergency Information */}
      {sections.emergency && intelligence.emergency && intelligence.emergency.length > 0 && (
        <View style={styles.intelligenceSection} wrap={false}>
          <Text style={styles.intelligenceTitle}>Emergency Information</Text>
          {intelligence.emergency.map((info: any, idx: number) => (
            <View key={idx} style={styles.intelligenceItem}>
              <Text style={styles.intelligenceLabel}>{info.destination}</Text>
              <Text style={styles.intelligenceText}>
                Embassy: {info.embassyName}
              </Text>
              <Text style={styles.intelligenceText}>
                Address: {info.embassyAddress}
              </Text>
              <Text style={styles.intelligenceText}>
                Phone: {info.embassyPhone}
              </Text>
              {info.embassyEmail && (
                <Text style={styles.intelligenceText}>
                  Email: {info.embassyEmail}
                </Text>
              )}
              <Text style={styles.intelligenceText}>
                Safety Level: {info.safetyLevel}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Cultural Events */}
      {sections.cultural && intelligence.cultural && intelligence.cultural.length > 0 && (
        <View style={styles.intelligenceSection} wrap={false}>
          <Text style={styles.intelligenceTitle}>Cultural Events & Holidays</Text>
          {intelligence.cultural.map((event: any, idx: number) => (
            <View key={idx} style={styles.intelligenceItem}>
              <Text style={styles.intelligenceLabel}>{event.eventName}</Text>
              <Text style={styles.intelligenceText}>
                {event.destination} • {event.eventType}
              </Text>
              <Text style={styles.intelligenceText}>{event.description}</Text>
              <Text style={styles.intelligenceText}>Impact: {event.impact}</Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Activity Suggestions */}
      {sections.activities && intelligence.activities && intelligence.activities.length > 0 && (
        <View style={styles.intelligenceSection} wrap={false}>
          <Text style={styles.intelligenceTitle}>Activity Suggestions</Text>
          {intelligence.activities.map((activity: any, idx: number) => (
            <View key={idx} style={styles.intelligenceItem}>
              <Text style={styles.intelligenceLabel}>{activity.activityName}</Text>
              <Text style={styles.intelligenceText}>
                {activity.location} • {activity.activityType}
              </Text>
              <Text style={styles.intelligenceText}>{activity.description}</Text>
              <Text style={styles.intelligenceText}>
                Duration: {activity.estimatedDuration} hours • Cost: {activity.estimatedCost}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Dining Recommendations */}
      {sections.dining && intelligence.dining && intelligence.dining.length > 0 && (
        <View style={styles.intelligenceSection} wrap={false}>
          <Text style={styles.intelligenceTitle}>Dining Recommendations</Text>
          {intelligence.dining.map((restaurant: any, idx: number) => (
            <View key={idx} style={styles.intelligenceItem}>
              <Text style={styles.intelligenceLabel}>{restaurant.restaurantName}</Text>
              <Text style={styles.intelligenceText}>
                {restaurant.cuisineType} • {restaurant.priceRange}
              </Text>
              <Text style={styles.intelligenceText}>
                {restaurant.location} • {restaurant.distance}
              </Text>
              <Text style={styles.intelligenceText}>{restaurant.description}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

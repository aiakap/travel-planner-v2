import type { ViewItinerary, ViewSegment, ViewReservation } from "@/lib/itinerary-view-types"
import type { LucideIcon } from "lucide-react"
import { 
  Plane, Hotel, Car, UtensilsCrossed, Sparkles, 
  Users, Package, DollarSign, Shield, Calendar 
} from "lucide-react"

/**
 * Categories for todo suggestions
 */
export type SuggestionCategory = 
  | 'essential'      // Missing critical bookings (flights, hotels)
  | 'transportation' // Missing transport between locations
  | 'accommodation'  // Missing hotel nights
  | 'activity'       // Free time that could use activities
  | 'dining'         // Meal opportunities
  | 'collaboration'  // Invite friends, share trip
  | 'planning'       // Packing, currency, emergency info

/**
 * Priority levels for suggestions
 */
export type SuggestionPriority = 'high' | 'medium' | 'low'

/**
 * Action types for suggestion CTAs
 */
export type SuggestionActionType = 
  | 'navigate'  // Navigate to a route (chat, intelligence tab, etc.)
  | 'modal'     // Open a modal (edit segment, add reservation)
  | 'external'  // Open external link (booking sites)

/**
 * Main suggestion interface
 */
export interface TodoSuggestion {
  id: string
  category: SuggestionCategory
  priority: SuggestionPriority
  title: string
  description: string
  icon: LucideIcon
  actionLabel: string
  actionType: SuggestionActionType
  actionData: SuggestionActionData
  relevanceScore?: number
  dateContext?: string // e.g., "May 15" or "3 nights"
  segmentId?: string   // Associated segment if applicable
}

/**
 * Action data for different action types
 */
export type SuggestionActionData = 
  | { type: 'navigate'; route: string; query?: Record<string, string> }
  | { type: 'modal'; modalType: string; data?: any }
  | { type: 'external'; url: string }

/**
 * Grouped suggestions by category
 */
export interface GroupedSuggestions {
  essential: TodoSuggestion[]
  transportation: TodoSuggestion[]
  accommodation: TodoSuggestion[]
  activity: TodoSuggestion[]
  dining: TodoSuggestion[]
  collaboration: TodoSuggestion[]
  planning: TodoSuggestion[]
}

/**
 * Analysis result containing all suggestions
 */
export interface TripAnalysisResult {
  suggestions: GroupedSuggestions
  totalCount: number
  highPriorityCount: number
  hasEssentialGaps: boolean
}

/**
 * Helper to get icon for category
 */
export function getCategoryIcon(category: SuggestionCategory): LucideIcon {
  const icons: Record<SuggestionCategory, LucideIcon> = {
    essential: Plane,
    transportation: Car,
    accommodation: Hotel,
    activity: Sparkles,
    dining: UtensilsCrossed,
    collaboration: Users,
    planning: Package,
  }
  return icons[category]
}

/**
 * Helper to get color for category
 */
export function getCategoryColor(category: SuggestionCategory): string {
  const colors: Record<SuggestionCategory, string> = {
    essential: 'red',
    transportation: 'blue',
    accommodation: 'purple',
    activity: 'amber',
    dining: 'orange',
    collaboration: 'green',
    planning: 'indigo',
  }
  return colors[category]
}

/**
 * Helper to get priority color
 */
export function getPriorityColor(priority: SuggestionPriority): string {
  const colors: Record<SuggestionPriority, string> = {
    high: 'red',
    medium: 'amber',
    low: 'blue',
  }
  return colors[priority]
}

/**
 * Helper to get category label
 */
export function getCategoryLabel(category: SuggestionCategory): string {
  const labels: Record<SuggestionCategory, string> = {
    essential: 'Essential Bookings',
    transportation: 'Transportation',
    accommodation: 'Accommodation',
    activity: 'Activities',
    dining: 'Dining',
    collaboration: 'Collaboration',
    planning: 'Planning',
  }
  return labels[category]
}

/**
 * User profile data for personalization
 */
export interface UserProfileData {
  hobbies?: string[]
  interests?: string[]
  travelStyle?: string
  budgetPreference?: string
  dietaryRestrictions?: string[]
  cuisinePreferences?: string[]
  activityPreferences?: string[]
  hasFamily?: boolean
}

/**
 * Extract profile data from profile values
 */
export function extractProfileData(profileValues: any[]): UserProfileData {
  const data: UserProfileData = {}
  
  if (!profileValues || profileValues.length === 0) {
    return data
  }
  
  // Extract hobbies
  data.hobbies = profileValues
    .filter(pv => pv.value?.category?.slug === 'hobbies')
    .map(pv => pv.value.value)
  
  // Extract interests
  data.interests = profileValues
    .filter(pv => pv.value?.category?.slug?.includes('interest'))
    .map(pv => pv.value.value)
  
  // Extract travel style
  data.travelStyle = profileValues
    .find(pv => pv.value?.category?.slug === 'travel-style')
    ?.value?.value
  
  // Extract budget preference
  data.budgetPreference = profileValues
    .find(pv => pv.value?.category?.slug?.includes('budget'))
    ?.value?.value
  
  // Extract dietary restrictions
  data.dietaryRestrictions = profileValues
    .filter(pv => pv.value?.category?.slug?.includes('dietary'))
    .map(pv => pv.value.value)
  
  // Extract cuisine preferences
  data.cuisinePreferences = profileValues
    .filter(pv => pv.value?.category?.slug?.includes('cuisine'))
    .map(pv => pv.value.value)
  
  // Extract activity preferences
  data.activityPreferences = profileValues
    .filter(pv => pv.value?.category?.slug?.startsWith('activities'))
    .map(pv => pv.value.value)
  
  // Check for family
  data.hasFamily = profileValues.some(pv => 
    pv.value?.value?.toLowerCase().includes('family') ||
    pv.value?.value?.toLowerCase().includes('children')
  )
  
  return data
}

/**
 * Main analysis function - analyzes trip and returns all suggestions
 */
export function analyzeTripForSuggestions(
  itinerary: ViewItinerary, 
  profileValues?: any[]
): TripAnalysisResult {
  const suggestions: GroupedSuggestions = {
    essential: [],
    transportation: [],
    accommodation: [],
    activity: [],
    dining: [],
    collaboration: [],
    planning: [],
  }

  // Extract profile data for personalization
  const profileData = profileValues ? extractProfileData(profileValues) : {}

  // Run all analyzers with profile data
  suggestions.essential = detectMissingEssentials(itinerary, profileData)
  suggestions.transportation = detectTransportationGaps(itinerary, profileData)
  suggestions.accommodation = detectAccommodationGaps(itinerary, profileData)
  suggestions.activity = detectActivityOpportunities(itinerary, profileData)
  suggestions.dining = detectDiningOpportunities(itinerary, profileData)
  suggestions.collaboration = detectCollaborationOpportunities(itinerary, profileData)
  suggestions.planning = detectPlanningTasks(itinerary, profileData)

  // Calculate totals
  const totalCount = Object.values(suggestions).reduce((sum, arr) => sum + arr.length, 0)
  const highPriorityCount = Object.values(suggestions)
    .flat()
    .filter(s => s.priority === 'high').length
  const hasEssentialGaps = suggestions.essential.length > 0

  return {
    suggestions,
    totalCount,
    highPriorityCount,
    hasEssentialGaps,
  }
}

/**
 * Detect missing essential bookings (flights, hotels)
 */
export function detectMissingEssentials(itinerary: ViewItinerary, profileData: UserProfileData = {}): TodoSuggestion[] {
  const suggestions: TodoSuggestion[] = []
  
  // Check for flights
  const hasFlights = itinerary.segments.some(seg =>
    seg.reservations.some(r => r.type === 'flight')
  )
  
  if (!hasFlights && itinerary.segments.length > 0) {
    const firstSegment = itinerary.segments[0]
    suggestions.push({
      id: 'missing-flights',
      category: 'essential',
      priority: 'high',
      title: 'Book flights',
      description: `No flights booked yet for your trip to ${firstSegment.destination}`,
      icon: Plane,
      actionLabel: 'Find flights',
      actionType: 'navigate',
      actionData: { type: 'navigate', route: '/chat', query: { prompt: `Help me find flights for my ${itinerary.title} trip` } },
      relevanceScore: 95,
    })
  }
  
  // Check for hotels
  const hasHotels = itinerary.segments.some(seg =>
    seg.reservations.some(r => r.type === 'hotel')
  )
  
  if (!hasHotels && itinerary.segments.length > 0) {
    const firstSegment = itinerary.segments[0]
    suggestions.push({
      id: 'missing-hotels',
      category: 'essential',
      priority: 'high',
      title: 'Book accommodation',
      description: `No hotels booked for ${firstSegment.destination}`,
      icon: Hotel,
      actionLabel: 'Find hotels',
      actionType: 'navigate',
      actionData: { type: 'navigate', route: '/chat', query: { prompt: `Suggest hotels in ${firstSegment.destination} for my trip` } },
      relevanceScore: 90,
    })
  }
  
  return suggestions
}

/**
 * Detect transportation gaps between segments
 */
export function detectTransportationGaps(itinerary: ViewItinerary, profileData: UserProfileData = {}): TodoSuggestion[] {
  const suggestions: TodoSuggestion[] = []
  
  // Check each consecutive pair of segments
  for (let i = 0; i < itinerary.segments.length - 1; i++) {
    const currentSegment = itinerary.segments[i]
    const nextSegment = itinerary.segments[i + 1]
    
    // Check if locations are different
    if (currentSegment.destination !== nextSegment.destination) {
      // Check if there's transport between them
      const hasTransport = currentSegment.reservations.some(r => 
        r.type === 'transport' || r.type === 'flight'
      ) || nextSegment.reservations.some(r => 
        r.type === 'transport' || r.type === 'flight'
      )
      
      if (!hasTransport) {
        const dateStr = new Date(nextSegment.startDate).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
        
        suggestions.push({
          id: `transport-gap-${i}`,
          category: 'transportation',
          priority: 'high',
          title: `Transportation needed`,
          description: `Add transport from ${currentSegment.destination} to ${nextSegment.destination}`,
          icon: Car,
          actionLabel: 'Add transport',
          actionType: 'navigate',
          actionData: { 
            type: 'navigate', 
            route: '/chat', 
            query: { prompt: `Help me find transportation from ${currentSegment.destination} to ${nextSegment.destination} on ${dateStr}` } 
          },
          dateContext: dateStr,
          segmentId: nextSegment.id,
          relevanceScore: 85,
        })
      }
    }
  }
  
  return suggestions
}

/**
 * Detect accommodation gaps (nights without hotels)
 */
export function detectAccommodationGaps(itinerary: ViewItinerary, profileData: UserProfileData = {}): TodoSuggestion[] {
  const suggestions: TodoSuggestion[] = []
  
  for (const segment of itinerary.segments) {
    const hotels = segment.reservations.filter(r => r.type === 'hotel')
    
    if (hotels.length === 0) {
      // Calculate nights in segment
      const start = new Date(segment.startDate)
      const end = new Date(segment.endDate)
      const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      
      if (nights > 0) {
        const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        
        suggestions.push({
          id: `accommodation-gap-${segment.id}`,
          category: 'accommodation',
          priority: 'high',
          title: `${nights} night${nights > 1 ? 's' : ''} without accommodation`,
          description: `Book a hotel in ${segment.destination}`,
          icon: Hotel,
          actionLabel: 'Find hotels',
          actionType: 'navigate',
          actionData: { 
            type: 'navigate', 
            route: '/chat', 
            query: { prompt: `Suggest hotels in ${segment.destination} for ${nights} nights starting ${dateStr}` } 
          },
          dateContext: `${nights} night${nights > 1 ? 's' : ''}`,
          segmentId: segment.id,
          relevanceScore: 88,
        })
      }
    }
  }
  
  return suggestions
}

/**
 * Detect time gaps in schedule (similar to Trip Intelligence logic)
 */
interface TimeGap {
  segmentId: string
  startTime: Date
  endTime: Date
  duration: number // hours
  location: string
}

function detectTimeGaps(itinerary: ViewItinerary): TimeGap[] {
  const gaps: TimeGap[] = []
  
  for (const segment of itinerary.segments) {
    // Get reservations with times sorted by start time
    const reservations = segment.reservations
      .filter(r => r.startTime && r.endTime)
      .sort((a, b) => {
        const aTime = new Date(a.startTime!).getTime()
        const bTime = new Date(b.startTime!).getTime()
        return aTime - bTime
      })
    
    if (reservations.length === 0) {
      // Entire segment is potentially free
      const segmentStart = new Date(segment.startDate)
      const segmentEnd = new Date(segment.endDate)
      const duration = (segmentEnd.getTime() - segmentStart.getTime()) / (1000 * 60 * 60)
      
      // Only suggest if segment is at least 3 hours
      if (duration >= 3) {
        gaps.push({
          segmentId: segment.id,
          startTime: segmentStart,
          endTime: segmentEnd,
          duration,
          location: segment.destination
        })
      }
    } else {
      // Check gaps between reservations
      for (let i = 0; i < reservations.length - 1; i++) {
        const current = reservations[i]
        const next = reservations[i + 1]
        
        if (current.endTime && next.startTime) {
          const gapStart = new Date(current.endTime)
          const gapEnd = new Date(next.startTime)
          const duration = (gapEnd.getTime() - gapStart.getTime()) / (1000 * 60 * 60)
          
          // Only suggest for gaps of 3+ hours (matches Trip Intelligence logic)
          if (duration >= 3) {
            gaps.push({
              segmentId: segment.id,
              startTime: gapStart,
              endTime: gapEnd,
              duration,
              location: segment.destination
            })
          }
        }
      }
    }
  }
  
  return gaps
}

/**
 * Detect activity opportunities (free time gaps)
 * Integrates with Trip Intelligence gap detection logic
 */
export function detectActivityOpportunities(itinerary: ViewItinerary, profileData: UserProfileData = {}): TodoSuggestion[] {
  const suggestions: TodoSuggestion[] = []
  
  // Detect time gaps using similar logic to Trip Intelligence
  const gaps = detectTimeGaps(itinerary)
  
  if (gaps.length > 0) {
    // Group gaps by segment
    const gapsBySegment = gaps.reduce((acc, gap) => {
      if (!acc[gap.segmentId]) {
        acc[gap.segmentId] = []
      }
      acc[gap.segmentId].push(gap)
      return acc
    }, {} as Record<string, TimeGap[]>)
    
    // Create suggestions for segments with gaps
    Object.entries(gapsBySegment).forEach(([segmentId, segmentGaps]) => {
      const segment = itinerary.segments.find(s => s.id === segmentId)
      if (!segment) return
      
      const totalGapHours = segmentGaps.reduce((sum, gap) => sum + gap.duration, 0)
      const gapCount = segmentGaps.length
      
      const dateStr = new Date(segment.startDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
      
      suggestions.push({
        id: `activity-opportunity-${segmentId}`,
        category: 'activity',
        priority: 'medium',
        title: `${totalGapHours.toFixed(0)} hours of free time`,
        description: `Add activities to fill ${gapCount} time gap${gapCount > 1 ? 's' : ''} in ${segment.destination}`,
        icon: Sparkles,
        actionLabel: 'Browse activities',
        actionType: 'navigate',
        actionData: { 
          type: 'navigate', 
          route: '/view1', 
          query: { tab: 'activities' } 
        },
        dateContext: dateStr,
        segmentId: segment.id,
        relevanceScore: 75,
      })
    })
  } else {
    // Fallback: Check if segment has few activities compared to days
    for (const segment of itinerary.segments) {
      const activities = segment.reservations.filter(r => r.type === 'activity')
      
      // Calculate days in segment
      const start = new Date(segment.startDate)
      const end = new Date(segment.endDate)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      
      // Suggest activities if less than 1 per day and more than 1 day
      if (activities.length < days && days > 1) {
        const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        
        suggestions.push({
          id: `activity-opportunity-${segment.id}`,
          category: 'activity',
          priority: 'low',
          title: `Add activities in ${segment.destination}`,
          description: `You have ${days} day${days > 1 ? 's' : ''} with room for more activities`,
          icon: Sparkles,
          actionLabel: 'Browse activities',
          actionType: 'navigate',
          actionData: { 
            type: 'navigate', 
            route: '/view1', 
            query: { tab: 'activities' } 
          },
          dateContext: dateStr,
          segmentId: segment.id,
          relevanceScore: 65,
        })
      }
    }
  }
  
  return suggestions
}

/**
 * Detect dining opportunities
 */
export function detectDiningOpportunities(itinerary: ViewItinerary, profileData: UserProfileData = {}): TodoSuggestion[] {
  const suggestions: TodoSuggestion[] = []
  
  for (const segment of itinerary.segments) {
    const restaurants = segment.reservations.filter(r => r.type === 'restaurant')
    
    // Calculate days in segment
    const start = new Date(segment.startDate)
    const end = new Date(segment.endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // Suggest dining if less than 1 restaurant per day
    if (restaurants.length < days && days > 0) {
      const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      suggestions.push({
        id: `dining-opportunity-${segment.id}`,
        category: 'dining',
        priority: 'low',
        title: `Find restaurants in ${segment.destination}`,
        description: `Add dining recommendations for your ${days} day${days > 1 ? 's' : ''} here`,
        icon: UtensilsCrossed,
        actionLabel: 'Browse restaurants',
        actionType: 'navigate',
        actionData: { 
          type: 'navigate', 
          route: '/view1', 
          query: { tab: 'dining' } 
        },
        dateContext: dateStr,
        segmentId: segment.id,
        relevanceScore: 60,
      })
    }
  }
  
  return suggestions
}

/**
 * Detect collaboration opportunities
 */
export function detectCollaborationOpportunities(itinerary: ViewItinerary, profileData: UserProfileData = {}): TodoSuggestion[] {
  const suggestions: TodoSuggestion[] = []
  
  // Suggest sharing for multi-segment or longer trips
  if (itinerary.segments.length > 1 || itinerary.dayCount > 3) {
    // Increase relevance if user has family
    const relevanceScore = profileData.hasFamily ? 70 : 50
    const description = profileData.hasFamily 
      ? 'Share this trip with your family to collaborate on planning'
      : 'Invite friends or family to view and collaborate on this trip'
    
    suggestions.push({
      id: 'share-trip',
      category: 'collaboration',
      priority: profileData.hasFamily ? 'medium' : 'low',
      title: 'Share your trip',
      description,
      icon: Users,
      actionLabel: 'Share trip',
      actionType: 'navigate',
      actionData: { type: 'navigate', route: '/view1', query: {} },
      relevanceScore,
    })
  }
  
  return suggestions
}

/**
 * Detect planning tasks (packing, currency, etc.)
 */
export function detectPlanningTasks(itinerary: ViewItinerary, profileData: UserProfileData = {}): TodoSuggestion[] {
  const suggestions: TodoSuggestion[] = []
  
  // Suggest packing list - higher priority for longer trips
  const packingPriority = itinerary.dayCount > 5 ? 'high' : 'medium'
  const packingRelevance = itinerary.dayCount > 5 ? 75 : 65
  
  suggestions.push({
    id: 'generate-packing',
    category: 'planning',
    priority: packingPriority,
    title: 'Create packing list',
    description: 'Generate an AI-powered packing list for your trip',
    icon: Package,
    actionLabel: 'Generate list',
    actionType: 'navigate',
    actionData: { type: 'navigate', route: '/view1', query: { tab: 'packing' } },
    relevanceScore: packingRelevance,
  })
  
  // Suggest currency info for international trips
  const hasInternationalDestinations = itinerary.segments.some(seg => 
    seg.destination && !seg.destination.toLowerCase().includes('united states')
  )
  
  if (hasInternationalDestinations) {
    // Higher relevance for budget-conscious travelers
    const isBudgetConscious = profileData.budgetPreference?.toLowerCase().includes('budget')
    const currencyRelevance = isBudgetConscious ? 85 : 70
    const currencyPriority = isBudgetConscious ? 'high' : 'medium'
    
    suggestions.push({
      id: 'check-currency',
      category: 'planning',
      priority: currencyPriority,
      title: 'Review currency advice',
      description: isBudgetConscious 
        ? 'Get exchange rates and money-saving tips for your destinations'
        : 'Get exchange rates and money tips for your destinations',
      icon: DollarSign,
      actionLabel: 'View advice',
      actionType: 'navigate',
      actionData: { type: 'navigate', route: '/view1', query: { tab: 'currency' } },
      relevanceScore: currencyRelevance,
    })
    
    // Higher relevance for families
    const emergencyRelevance = profileData.hasFamily ? 75 : 55
    const emergencyPriority = profileData.hasFamily ? 'medium' : 'low'
    
    suggestions.push({
      id: 'check-emergency',
      category: 'planning',
      priority: emergencyPriority,
      title: 'Review emergency info',
      description: profileData.hasFamily
        ? 'Get safety information and emergency contacts for traveling with family'
        : 'Get safety information and emergency contacts',
      icon: Shield,
      actionLabel: 'View info',
      actionType: 'navigate',
      actionData: { type: 'navigate', route: '/view1', query: { tab: 'emergency' } },
      relevanceScore: emergencyRelevance,
    })
  }
  
  return suggestions
}

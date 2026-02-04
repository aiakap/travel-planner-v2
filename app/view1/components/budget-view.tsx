"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import type { ViewItinerary, ViewReservation } from "@/lib/itinerary-view-types"
import type { ProfileGraphItem } from "@/lib/types/profile-graph"
import { 
  Wallet, 
  ChevronDown, 
  ChevronRight,
  Plane,
  Hotel,
  UtensilsCrossed,
  Ticket,
  ShoppingBag,
  Car,
  Gift,
  Loader2,
  Info,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import { Card } from "./card"
import { Button } from "@/components/ui/button"
import { convertToUSD, formatAsUSD } from "@/lib/utils/currency-converter"

interface BudgetViewProps {
  itinerary: ViewItinerary
  profileItems: ProfileGraphItem[]
}

// Enhanced item with full currency details
interface CategoryItem {
  id: string
  title: string
  amountUSD: number
  amountLocal: number
  currency: string
  status: string
}

interface CategoryTotal {
  category: string
  total: number
  count: number
  icon: any
  color: string
  bgColor: string
  items: CategoryItem[]
}

interface BudgetRecommendation {
  id: string
  title: string
  subtitle: string
  amount: number
  logic: string
  icon: any
  color: string
  bgColor: string
  // Optional: specific uncovered nights for accommodation
  uncoveredNightsList?: string[]
}

// Budget tier mappings
const MEAL_COST_TIERS: Record<string, number> = {
  '$': 15,
  '$$': 30,
  '$$$': 50,
  '$$$$': 100,
}

const DAILY_BUDGET_TIERS: Record<string, number> = {
  '0-50': 25,
  '50-100': 75,
  '100-200': 150,
  '200+': 300,
}

const LUXURY_MULTIPLIERS: Record<string, number> = {
  'luxury': 2.0,
  'mid-range': 1.0,
  'budget': 0.5,
  'backpacker': 0.3,
}

// Helper function to format dual currency display
function formatDualCurrency(amountLocal: number, currency: string, amountUSD: number): string {
  if (currency === 'USD' || !currency) {
    return formatAsUSD(amountUSD)
  }
  
  // Format local currency with symbol
  try {
    const localFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountLocal)
    
    return `${localFormatted} (${formatAsUSD(amountUSD)})`
  } catch {
    // Fallback if currency code is invalid
    return `${amountLocal} ${currency} (${formatAsUSD(amountUSD)})`
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 120) return '1 minute ago'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 7200) return '1 hour ago'
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

// Helper function to map category names to our standard categories
function mapCategoryName(categoryName: string): string {
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

export function BudgetView({ itinerary, profileItems }: BudgetViewProps) {
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([])
  const [bookedTotal, setBookedTotal] = useState(0)
  const [recommendations, setRecommendations] = useState<BudgetRecommendation[]>([])
  const [expandedRecs, setExpandedRecs] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [lastCalculated, setLastCalculated] = useState<Date | null>(null)
  const [lastFingerprint, setLastFingerprint] = useState<string>('')
  
  // Track if this is the initial load
  const isInitialLoad = useRef(true)

  // Generate fingerprint of reservations for change detection
  const reservationsFingerprint = useMemo(() => {
    return itinerary.segments
      .flatMap(s => s.reservations)
      .map(r => `${r.id}:${r.price}:${r.currency}:${r.title}`)
      .sort()
      .join('|')
  }, [itinerary])

  // Extract profile preferences
  const profilePrefs = useMemo(() => {
    const prefs = {
      dailyBudget: '50-100' as string,
      mealBudget: '$$' as string,
      luxuryLevel: 'mid-range' as string,
      hasPrivateDriver: false,
    }

    for (const item of profileItems) {
      const subcategory = item.metadata?.subcategory?.toLowerCase() || ''
      const value = item.value?.toLowerCase() || ''
      
      // Check for budget preferences
      if (item.category === 'budget' || subcategory.includes('budget')) {
        if (subcategory === 'daily-budget' || value.includes('-') || value.includes('+')) {
          if (value.includes('0-50') || value === '0-50') prefs.dailyBudget = '0-50'
          else if (value.includes('50-100') || value === '50-100') prefs.dailyBudget = '50-100'
          else if (value.includes('100-200') || value === '100-200') prefs.dailyBudget = '100-200'
          else if (value.includes('200') || value === '200+') prefs.dailyBudget = '200+'
        }
      }
      
      // Check for meal budget preferences
      if (item.category === 'dining' || subcategory.includes('meal') || subcategory.includes('dining')) {
        if (value === '$' || value.includes('budget') || value.includes('cheap')) prefs.mealBudget = '$'
        else if (value === '$$' || value.includes('moderate')) prefs.mealBudget = '$$'
        else if (value === '$$$' || value.includes('upscale')) prefs.mealBudget = '$$$'
        else if (value === '$$$$' || value.includes('fine') || value.includes('luxury')) prefs.mealBudget = '$$$$'
      }
      
      // Check for travel style
      if (item.category === 'travel-style' || subcategory.includes('luxury')) {
        if (value.includes('luxury')) prefs.luxuryLevel = 'luxury'
        else if (value.includes('budget') || value.includes('backpack')) prefs.luxuryLevel = 'budget'
        else if (value.includes('mid')) prefs.luxuryLevel = 'mid-range'
      }
      
      // Check for private driver preference
      if (subcategory.includes('transport') || subcategory.includes('ground')) {
        if (value.includes('private driver') || value.includes('chauffeur')) {
          prefs.hasPrivateDriver = true
        }
      }
    }

    return prefs
  }, [profileItems])

  // Calculate trip stats
  const tripStats = useMemo(() => {
    const startDate = new Date(itinerary.startDate)
    const endDate = new Date(itinerary.endDate)
    const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const tripNights = tripDays - 1

    // Collect all reservations
    const allReservations: (ViewReservation & { segmentTitle: string })[] = []
    itinerary.segments.forEach(segment => {
      segment.reservations.forEach(res => {
        allReservations.push({ ...res, segmentTitle: segment.title })
      })
    })

    // Get unique destinations
    const destinations = new Set(itinerary.segments.map(s => s.destination || s.title))

    return {
      tripDays,
      tripNights,
      reservations: allReservations,
      destinationCount: destinations.size,
    }
  }, [itinerary])

  // Calculate budget - extracted as a reusable function
  const calculateBudget = useCallback(async (isRefresh: boolean = false) => {
    if (isRefresh) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const categories = [
        { name: "Transport", icon: Plane, color: "text-sky-700", bgColor: "bg-sky-100" },
        { name: "Stay", icon: Hotel, color: "text-purple-700", bgColor: "bg-purple-100" },
        { name: "Eat", icon: UtensilsCrossed, color: "text-orange-700", bgColor: "bg-orange-100" },
        { name: "Do", icon: Ticket, color: "text-green-700", bgColor: "bg-green-100" },
        { name: "Other", icon: ShoppingBag, color: "text-slate-700", bgColor: "bg-slate-100" },
      ]

      const categoryMap = new Map<string, CategoryTotal>()
      categories.forEach(cat => {
        categoryMap.set(cat.name, {
          category: cat.name,
          total: 0,
          count: 0,
          icon: cat.icon,
          color: cat.color,
          bgColor: cat.bgColor,
          items: [],
        })
      })

      let total = 0
      let avgHotelNightlyRate = 0
      let hotelCount = 0
      let restaurantCount = 0
      let hasPrivateDriverBooking = false
      
      // Track covered nights using a Set of date strings (YYYY-MM-DD format)
      const coveredNights = new Set<string>()

      // Process all reservations
      for (const res of tripStats.reservations) {
        const categoryName = res.categoryName || "Other"
        const mappedCategory = mapCategoryName(categoryName)
        const cost = res.price || 0
        const currency = res.currency || "USD"

        // Convert to USD
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
        total += costUSD

        // Track hotel stats and covered nights
        if (res.type === "hotel" || mappedCategory === "Stay") {
          const nights = res.nights || 1
          if (costUSD > 0 && nights > 0) {
            avgHotelNightlyRate += costUSD / nights
            hotelCount++
          }
          
          // Track which specific nights are covered
          // Use checkInDate if available, otherwise fall back to date
          const checkIn = res.checkInDate || res.date
          if (checkIn) {
            const startDate = new Date(checkIn)
            for (let i = 0; i < nights; i++) {
              const nightDate = new Date(startDate)
              nightDate.setDate(startDate.getDate() + i)
              const nightKey = nightDate.toISOString().split('T')[0]
              coveredNights.add(nightKey)
            }
          }
        }

        // Track restaurant count
        if (res.type === "restaurant" || mappedCategory === "Eat") {
          restaurantCount++
        }

        // Check for private driver
        if (res.title?.toLowerCase().includes('private driver') || 
            res.title?.toLowerCase().includes('chauffeur')) {
          hasPrivateDriverBooking = true
        }
      }

      // Calculate average hotel rate
      if (hotelCount > 0) {
        avgHotelNightlyRate = avgHotelNightlyRate / hotelCount
      } else {
        // Use profile preference or default
        const budgetTier = DAILY_BUDGET_TIERS[profilePrefs.dailyBudget] || 75
        avgHotelNightlyRate = budgetTier * 2 // Hotels typically 2x daily activity budget
      }

      setBookedTotal(total)
      setCategoryTotals(Array.from(categoryMap.values()).filter(c => c.count > 0))

      // Calculate recommendations
      const recs: BudgetRecommendation[] = []
      const luxuryMultiplier = LUXURY_MULTIPLIERS[profilePrefs.luxuryLevel] || 1.0

      // 1. Uncovered nights - calculate which specific nights are not covered
      const tripStart = new Date(itinerary.startDate)
      const tripEnd = new Date(itinerary.endDate)
      const uncoveredNightsList: string[] = []
      
      // Iterate through each night of the trip (excluding last day - you don't sleep there)
      for (let d = new Date(tripStart); d < tripEnd; d.setDate(d.getDate() + 1)) {
        const nightKey = d.toISOString().split('T')[0]
        if (!coveredNights.has(nightKey)) {
          uncoveredNightsList.push(nightKey)
        }
      }
      
      const uncoveredNightsCount = uncoveredNightsList.length
      if (uncoveredNightsCount > 0) {
        const nightlyRate = Math.round(avgHotelNightlyRate * luxuryMultiplier)
        
        // Format the uncovered nights for display
        const formatNightDate = (dateStr: string) => {
          const date = new Date(dateStr)
          return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        }
        
        recs.push({
          id: 'uncovered-nights',
          title: `${uncoveredNightsCount} night${uncoveredNightsCount > 1 ? 's' : ''} not covered`,
          subtitle: 'Accommodation needed',
          amount: uncoveredNightsCount * nightlyRate,
          logic: `${uncoveredNightsCount} nights × ${formatAsUSD(nightlyRate)}/night (based on ${hotelCount > 0 ? 'your average hotel cost' : 'your budget preference'})`,
          icon: Hotel,
          color: 'text-purple-700',
          bgColor: 'bg-purple-50',
          uncoveredNightsList: uncoveredNightsList.map(formatNightDate),
        })
      }

      // 2. Uncovered meals
      const totalMeals = tripStats.tripDays * 3
      const mealsCovered = restaurantCount
      const mealsUncovered = Math.max(0, totalMeals - mealsCovered)
      if (mealsUncovered > 0) {
        const mealCost = MEAL_COST_TIERS[profilePrefs.mealBudget] || 30
        const adjustedMealCost = Math.round(mealCost * luxuryMultiplier)
        recs.push({
          id: 'uncovered-meals',
          title: `~${mealsUncovered} meals not covered`,
          subtitle: 'Food & dining budget',
          amount: mealsUncovered * adjustedMealCost,
          logic: `3 meals/day × ${tripStats.tripDays} days = ${totalMeals} meals, ${mealsCovered} booked. ${mealsUncovered} remaining × ${formatAsUSD(adjustedMealCost)}/meal (${profilePrefs.mealBudget} dining level)`,
          icon: UtensilsCrossed,
          color: 'text-orange-700',
          bgColor: 'bg-orange-50',
        })
      }

      // 3. Activities budget
      const dailyActivityBudget = DAILY_BUDGET_TIERS[profilePrefs.dailyBudget] || 75
      const adjustedActivityBudget = Math.round(dailyActivityBudget * luxuryMultiplier)
      const activitiesAmount = adjustedActivityBudget * tripStats.tripDays
      recs.push({
        id: 'activities',
        title: 'Activities & Experiences',
        subtitle: 'Tours, attractions, entertainment',
        amount: activitiesAmount,
        logic: `${formatAsUSD(adjustedActivityBudget)}/day × ${tripStats.tripDays} days (based on your ${profilePrefs.dailyBudget} daily budget preference${profilePrefs.luxuryLevel !== 'mid-range' ? `, ${profilePrefs.luxuryLevel} travel style` : ''})`,
        icon: Ticket,
        color: 'text-green-700',
        bgColor: 'bg-green-50',
      })

      // 4. Local transportation
      const needsLocalTransport = !hasPrivateDriverBooking && !profilePrefs.hasPrivateDriver
      if (needsLocalTransport) {
        const dailyTransportCost = Math.round(35 * luxuryMultiplier)
        const transportAmount = dailyTransportCost * tripStats.tripDays
        recs.push({
          id: 'local-transport',
          title: 'Local Transportation',
          subtitle: 'Uber, taxi, metro',
          amount: transportAmount,
          logic: `${formatAsUSD(dailyTransportCost)}/day × ${tripStats.tripDays} days for rideshares and local transport`,
          icon: Car,
          color: 'text-sky-700',
          bgColor: 'bg-sky-50',
        })
      }

      // 5. Shopping & Gifts
      const baseShoppingBudget = tripStats.destinationCount * 50 * luxuryMultiplier
      const shoppingAmount = Math.round(baseShoppingBudget + (tripStats.tripDays * 10 * luxuryMultiplier))
      recs.push({
        id: 'shopping',
        title: 'Shopping & Souvenirs',
        subtitle: 'Gifts, mementos, personal items',
        amount: shoppingAmount,
        logic: `${formatAsUSD(Math.round(50 * luxuryMultiplier))} per destination × ${tripStats.destinationCount} destinations + ${formatAsUSD(Math.round(10 * luxuryMultiplier))}/day for incidentals`,
        icon: Gift,
        color: 'text-pink-700',
        bgColor: 'bg-pink-50',
      })

      setRecommendations(recs)
      setLastCalculated(new Date())
      setLastFingerprint(reservationsFingerprint)
    } catch (error) {
      console.error('Error calculating budget:', error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [tripStats, profilePrefs, reservationsFingerprint])

  // Initial load
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      calculateBudget(false)
    }
  }, [calculateBudget])

  // Auto-recalculate when reservations change (after initial load)
  useEffect(() => {
    if (lastFingerprint && reservationsFingerprint !== lastFingerprint) {
      // Reservations changed - auto refresh
      calculateBudget(true)
    }
  }, [reservationsFingerprint, lastFingerprint, calculateBudget])

  // Manual refresh handler
  const handleRefresh = () => {
    calculateBudget(true)
  }

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const toggleRecommendation = (id: string) => {
    setExpandedRecs(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const recommendationsTotal = recommendations.reduce((sum, r) => sum + r.amount, 0)
  const grandTotal = bookedTotal + recommendationsTotal

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Card className="p-12 text-center">
          <div className="mb-6 text-6xl animate-bounce">💰</div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Calculating your budget...</h3>
          <p className="text-slate-600 text-sm">Analyzing reservations and preferences...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Booked Budget Section */}
      <Card hover={false}>
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Booked Budget</h3>
                <p className="text-sm text-slate-600">Confirmed & planned reservations</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Refresh button and last updated */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-8 px-3 text-xs"
                >
                  <RefreshCw size={14} className={`mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Updating...' : 'Refresh'}
                </Button>
                {lastCalculated && (
                  <span className="text-xs text-slate-500">
                    Updated {formatTimeAgo(lastCalculated)}
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">{formatAsUSD(bookedTotal)}</div>
                <p className="text-xs text-slate-500">{tripStats.reservations.length} items</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {categoryTotals.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Wallet className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p>No expenses added yet</p>
            </div>
          ) : (
            categoryTotals.map((category) => {
              const Icon = category.icon
              const percentage = bookedTotal > 0 ? (category.total / bookedTotal) * 100 : 0
              const isExpanded = expandedCategories.has(category.category)

              return (
                <div key={category.category} className="space-y-2">
                  {/* Category header - clickable */}
                  <button
                    onClick={() => toggleCategory(category.category)}
                    className="w-full flex items-center justify-between hover:bg-slate-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${category.bgColor}`}>
                        <Icon className={`h-4 w-4 ${category.color}`} />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-slate-900">{category.category}</div>
                        <div className="text-xs text-slate-500">
                          {category.count} item{category.count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold text-slate-900">{formatAsUSD(category.total)}</div>
                        <div className="text-xs text-slate-500">{percentage.toFixed(1)}%</div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Progress bar */}
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Expanded items list */}
                  {isExpanded && category.items.length > 0 && (
                    <div className="ml-11 mt-2 space-y-1">
                      {category.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 text-sm truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {formatDualCurrency(item.amountLocal, item.currency, item.amountUSD)}
                            </div>
                          </div>
                          <div className="ml-3 flex-shrink-0">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              item.status.toLowerCase().includes('confirm') 
                                ? 'bg-emerald-100 text-emerald-700'
                                : item.status.toLowerCase().includes('plan')
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </Card>

      {/* Recommendations Section */}
      <Card hover={false}>
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Recommended Budget</h3>
                <p className="text-sm text-slate-600">Estimated additional expenses</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">{formatAsUSD(recommendationsTotal)}</div>
              <p className="text-xs text-slate-500">{recommendations.length} categories</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {recommendations.map((rec) => {
            const Icon = rec.icon
            const isExpanded = expandedRecs.has(rec.id)

            return (
              <div key={rec.id} className="p-4">
                <button
                  onClick={() => toggleRecommendation(rec.id)}
                  className="w-full flex items-center justify-between gap-4 hover:bg-slate-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${rec.bgColor}`}>
                      <Icon className={`h-4 w-4 ${rec.color}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-slate-900">{rec.title}</div>
                      <div className="text-xs text-slate-500">{rec.subtitle}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-slate-900">{formatAsUSD(rec.amount)}</div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-3 ml-11 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-600">{rec.logic}</p>
                    </div>
                    
                    {/* Show specific uncovered nights if available */}
                    {rec.uncoveredNightsList && rec.uncoveredNightsList.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs font-medium text-slate-700 mb-2">Nights without accommodation:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.uncoveredNightsList.map((night, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-md"
                            >
                              {night}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Total Estimated Budget */}
      <Card hover={false}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Total Estimated Budget</h3>
                <p className="text-sm text-white/70">Booked + Recommended</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{formatAsUSD(grandTotal)}</div>
              <p className="text-sm text-white/70">
                for {tripStats.tripDays} days
              </p>
            </div>
          </div>

          {/* Visual breakdown bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-white/80 mb-2">
              <span>Booked: {formatAsUSD(bookedTotal)}</span>
              <span>Recommended: {formatAsUSD(recommendationsTotal)}</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${grandTotal > 0 ? (bookedTotal / grandTotal) * 100 : 0}%` }}
              />
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{ width: `${grandTotal > 0 ? (recommendationsTotal / grandTotal) * 100 : 0}%` }}
              />
            </div>
            <div className="flex gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-white/80">Booked ({grandTotal > 0 ? Math.round((bookedTotal / grandTotal) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-white/80">Recommended ({grandTotal > 0 ? Math.round((recommendationsTotal / grandTotal) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily average */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Daily average</span>
            <span className="font-semibold text-slate-900">
              {formatAsUSD(tripStats.tripDays > 0 ? grandTotal / tripStats.tripDays : 0)}/day
            </span>
          </div>
        </div>
      </Card>

      {/* Profile preferences note */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-full text-blue-600 flex-shrink-0">
          <Info size={18} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-blue-900">Personalized Estimates</h4>
          <p className="text-xs text-blue-700 mt-1">
            Recommendations are based on your profile preferences: {profilePrefs.mealBudget} dining, 
            {' '}{profilePrefs.dailyBudget}/day activity budget, {profilePrefs.luxuryLevel} travel style.
            {profilePrefs.hasPrivateDriver && ' Private driver preference detected.'}
          </p>
        </div>
      </div>
    </div>
  )
}

"use client"

import { HomeLocationData } from "@/lib/types/home-location"
import { MapPin, Calendar, TrendingUp, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface RecentTrip {
  id: string
  title: string
  startDate: Date
  endDate: Date
  imageUrl: string | null
}

interface SuggestionsCarouselProps {
  homeLocation: HomeLocationData | null
  recentTrips: RecentTrip[]
}

export function SuggestionsCarousel({ homeLocation, recentTrips }: SuggestionsCarouselProps) {
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' })
  const currentSeason = getCurrentSeason()
  
  // Build suggestion cards
  const suggestions = []

  // Weekend getaway from home
  if (homeLocation) {
    suggestions.push({
      id: "weekend",
      icon: MapPin,
      title: "Weekend Escape",
      description: `Nearby getaway from ${homeLocation.city || homeLocation.name}`,
      gradient: "from-blue-500 to-cyan-500",
      action: () => handleSuggestionClick("weekend"),
    })
  }

  // Return to recent destination
  if (recentTrips.length > 0) {
    const lastTrip = recentTrips[0]
    suggestions.push({
      id: "return",
      icon: Calendar,
      title: "Return Trip",
      description: `Back to ${lastTrip.title}`,
      gradient: "from-purple-500 to-pink-500",
      action: () => handleSuggestionClick("return", lastTrip.id),
    })
  }

  // Seasonal suggestion
  suggestions.push({
    id: "seasonal",
    icon: TrendingUp,
    title: `Perfect for ${currentSeason}`,
    description: `Top destinations for ${currentMonth}`,
    gradient: "from-emerald-500 to-teal-500",
    action: () => handleSuggestionClick("seasonal"),
  })

  // Festival season
  suggestions.push({
    id: "festival",
    icon: Sparkles,
    title: "Festival Season",
    description: "Cities with upcoming events",
    gradient: "from-orange-500 to-amber-500",
    action: () => handleSuggestionClick("festival"),
  })

  const handleSuggestionClick = (type: string, tripId?: string) => {
    // TODO: Implement pre-fill logic or chat context
    toast.info(`${type} suggestions coming soon! This will help you start planning.`)
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-100">
          <Sparkles className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Popular Starting Points</h2>
          <p className="text-sm text-slate-500">Quick ideas to inspire your next trip</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon
          
          return (
            <button
              key={suggestion.id}
              onClick={suggestion.action}
              className="group relative overflow-hidden rounded-xl bg-white border border-slate-200 p-4 text-left transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-slate-300"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${suggestion.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
              
              {/* Content */}
              <div className="relative space-y-3">
                <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${suggestion.gradient}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-slate-950">
                    {suggestion.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {suggestion.description}
                  </p>
                </div>
                
                {/* Hover Arrow */}
                <div className="flex items-center text-slate-500 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore
                  <svg className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function getCurrentSeason(): string {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return "Spring"
  if (month >= 5 && month <= 7) return "Summer"
  if (month >= 8 && month <= 10) return "Fall"
  return "Winter"
}

"use client"

import { Button } from "@/components/ui/button"
import { Calendar, Hotel, Utensils, Plane, MapPin, DollarSign } from "lucide-react"
import type { V0Itinerary } from "@/lib/v0-types"

interface ChatContextWelcomeProps {
  tripData: V0Itinerary
  onSuggestionClick: (prompt: string) => void
}

interface Suggestion {
  icon: React.ReactNode
  label: string
  prompt: string
}

function generateTripSuggestions(trip: V0Itinerary): Suggestion[] {
  const suggestions: Suggestion[] = []
  
  // Check what's missing or could be added
  const hasFlights = trip.segments.some(s => 
    s.reservations?.some(r => r.type.toLowerCase().includes('flight'))
  )
  const hasHotels = trip.segments.some(s => 
    s.reservations?.some(r => r.type.toLowerCase().includes('hotel') || r.type.toLowerCase().includes('accommodation'))
  )
  const hasRestaurants = trip.segments.some(s => 
    s.reservations?.some(r => r.type.toLowerCase().includes('restaurant') || r.type.toLowerCase().includes('dining'))
  )
  const hasActivities = trip.segments.some(s => 
    s.reservations?.some(r => r.type.toLowerCase().includes('activity') || r.type.toLowerCase().includes('tour'))
  )
  
  // Get trip locations
  const locations = trip.segments
    .map(s => s.location)
    .filter((loc, idx, arr) => loc && arr.indexOf(loc) === idx)
  
  const tripName = trip.title
  const mainLocation = locations[0] || "your destination"
  
  // Suggest missing essentials
  if (!hasFlights) {
    suggestions.push({
      icon: <Plane className="h-4 w-4" />,
      label: "Add flights",
      prompt: `Help me find and book flights for my ${tripName} trip`
    })
  }
  
  if (!hasHotels) {
    suggestions.push({
      icon: <Hotel className="h-4 w-4" />,
      label: "Find accommodations",
      prompt: `Suggest hotels or accommodations in ${mainLocation} for my trip`
    })
  }
  
  if (!hasRestaurants) {
    suggestions.push({
      icon: <Utensils className="h-4 w-4" />,
      label: "Add restaurants",
      prompt: `Recommend restaurants in ${mainLocation} that I should try`
    })
  }
  
  if (!hasActivities) {
    suggestions.push({
      icon: <MapPin className="h-4 w-4" />,
      label: "Suggest activities",
      prompt: `What activities and experiences should I add to my ${tripName} itinerary?`
    })
  }
  
  // Always offer these
  suggestions.push({
    icon: <Calendar className="h-4 w-4" />,
    label: "Optimize schedule",
    prompt: `Review my ${tripName} itinerary and suggest improvements to the schedule`
  })
  
  suggestions.push({
    icon: <DollarSign className="h-4 w-4" />,
    label: "Budget analysis",
    prompt: `Analyze the budget for my ${tripName} trip and suggest ways to save money`
  })
  
  // Return max 6 suggestions
  return suggestions.slice(0, 6)
}

export function ChatContextWelcome({ tripData, onSuggestionClick }: ChatContextWelcomeProps) {
  const suggestions = generateTripSuggestions(tripData)
  
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">
          {tripData.title}
        </h2>
        <p className="text-slate-600">
          {tripData.dates}
        </p>
        <p className="text-sm text-slate-500 mt-4">
          What would you like to work on for this trip?
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto p-4 justify-start text-left hover:bg-slate-50 hover:border-slate-400 transition-colors"
            onClick={() => onSuggestionClick(suggestion.prompt)}
          >
            <div className="flex items-start gap-3 w-full">
              <div className="text-slate-600 mt-0.5">
                {suggestion.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 text-sm">
                  {suggestion.label}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-xs text-slate-400">
          Or type your own question below
        </p>
      </div>
    </div>
  )
}

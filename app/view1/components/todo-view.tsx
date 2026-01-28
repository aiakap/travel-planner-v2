"use client"

import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { Home, CheckSquare, Plane, Car, Hotel, Sparkles, UtensilsCrossed, Users, Package } from "lucide-react"
import { Card } from "./card"
import { Badge } from "./badge"
import { SuggestionSection } from "./suggestion-card"
import { analyzeTripForSuggestions, getCategoryIcon, getCategoryLabel } from "@/lib/trip-analysis/todo-suggestions"
import { useMemo } from "react"

interface TodoViewProps {
  itinerary: ViewItinerary
  profileValues?: any[]
}

export function TodoView({ itinerary, profileValues }: TodoViewProps) {
  // Filter pending reservations
  const todoItems = itinerary.segments.flatMap(segment =>
    segment.reservations
      .filter(r => r.status === 'pending')
      .map(r => ({ ...r, segment }))
  )
  
  // Filter completed reservations
  const completedItems = itinerary.segments.flatMap(segment =>
    segment.reservations
      .filter(r => r.status === 'confirmed' || r.status === 'completed')
      .map(r => ({ ...r, segment }))
  ).slice(0, 3) // Show only first 3 completed

  // Analyze trip for smart suggestions
  const analysis = useMemo(() => analyzeTripForSuggestions(itinerary, profileValues), [itinerary, profileValues])
  const { suggestions } = analysis

  // Check if we have any content to show
  const hasAnySuggestions = analysis.totalCount > 0
  const hasAnyContent = todoItems.length > 0 || hasAnySuggestions

  return (
    <div className="animate-fade-in space-y-6">
      {/* Pending Reservations Section */}
      {todoItems.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600">
              <CheckSquare size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Pending Reservations ({todoItems.length})
            </h2>
          </div>
          <div className="space-y-3">
            {todoItems.map(item => (
              <Card key={item.id} className="border-l-4 border-l-amber-500">
                <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                      <Home size={24} />
                    </div>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                    <p className="text-slate-600 text-sm">{item.description} • {item.date}</p>
                    {item.notes && (
                      <p className="text-slate-400 text-xs mt-2">{item.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-colors">
                      View Details
                    </button>
                    <button className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm hover:shadow-md transition-all">
                      Confirm
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Smart Suggestion Sections */}
      {suggestions.essential.length > 0 && (
        <SuggestionSection
          title={getCategoryLabel('essential')}
          icon={<Plane size={20} />}
          suggestions={suggestions.essential}
        />
      )}

      {suggestions.transportation.length > 0 && (
        <SuggestionSection
          title={getCategoryLabel('transportation')}
          icon={<Car size={20} />}
          suggestions={suggestions.transportation}
        />
      )}

      {suggestions.accommodation.length > 0 && (
        <SuggestionSection
          title={getCategoryLabel('accommodation')}
          icon={<Hotel size={20} />}
          suggestions={suggestions.accommodation}
        />
      )}

      {suggestions.activity.length > 0 && (
        <SuggestionSection
          title={getCategoryLabel('activity')}
          icon={<Sparkles size={20} />}
          suggestions={suggestions.activity}
        />
      )}

      {suggestions.dining.length > 0 && (
        <SuggestionSection
          title={getCategoryLabel('dining')}
          icon={<UtensilsCrossed size={20} />}
          suggestions={suggestions.dining}
        />
      )}

      {suggestions.planning.length > 0 && (
        <SuggestionSection
          title={getCategoryLabel('planning')}
          icon={<Package size={20} />}
          suggestions={suggestions.planning}
        />
      )}

      {suggestions.collaboration.length > 0 && (
        <SuggestionSection
          title={getCategoryLabel('collaboration')}
          icon={<Users size={20} />}
          suggestions={suggestions.collaboration}
        />
      )}

      {/* Empty State - Only show if no pending items AND no high-priority suggestions */}
      {!hasAnyContent && (
        <Card className="p-8 text-center">
          <CheckSquare className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">All Caught Up!</h3>
          <p className="text-slate-500 text-sm">No pending action items for this trip.</p>
        </Card>
      )}

      {/* Show celebratory message if no pending items but has suggestions */}
      {todoItems.length === 0 && hasAnySuggestions && (
        <Card className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckSquare size={24} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Great progress!</h3>
              <p className="text-sm text-slate-600">No pending reservations. Check out the suggestions below to enhance your trip.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Completed items */}
      {completedItems.length > 0 && (
        <div className="opacity-60 pt-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Completed</h4>
          {completedItems.map(item => (
            <Card key={item.id} className="bg-slate-50 mb-2">
              <div className="p-4 flex items-center gap-4">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <CheckSquare size={16} />
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-slate-700 text-sm line-through">{item.title}</h4>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

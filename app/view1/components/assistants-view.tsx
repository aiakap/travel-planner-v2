"use client"

import { useState } from "react"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { 
  Cloud, Backpack, CheckSquare, Map, 
  DollarSign, Shield, Calendar, Sparkles, UtensilsCrossed 
} from "lucide-react"
import { WeatherView } from "./weather-view"
import { PackingView } from "./packing-view"
import { TodoView } from "./todo-view"
import { MapView } from "./map-view"
import { CurrencyView } from "./currency-view"
import { EmergencyView } from "./emergency-view"
import { CulturalView } from "./cultural-view"
import { ActivitiesView } from "./activities-view"
import { DiningView } from "./dining-view"
import { Badge } from "./badge"
import { detectRoundTrip } from "../lib/view-utils"

interface AssistantsViewProps {
  itinerary: ViewItinerary
  profileValues: any[]
}

type AssistantTab = 
  | 'weather' 
  | 'packing' 
  | 'todo' 
  | 'map' 
  | 'currency' 
  | 'emergency' 
  | 'cultural' 
  | 'activities' 
  | 'dining'

export function AssistantsView({ itinerary, profileValues }: AssistantsViewProps) {
  const [activeSubtab, setActiveSubtab] = useState<AssistantTab>('weather')

  // Calculate trip summary data (from old Overview)
  const totalBudget = itinerary.segments.reduce((total, seg) => 
    total + seg.reservations.reduce((sum, res) => sum + res.price, 0), 0
  )

  const totalReservations = itinerary.segments.reduce((total, seg) => 
    total + seg.reservations.length, 0
  )

  const roundTripInfo = detectRoundTrip(itinerary)

  const renderContent = () => {
    switch (activeSubtab) {
      case 'weather': return <WeatherView itinerary={itinerary} />
      case 'packing': return <PackingView itinerary={itinerary} profileValues={profileValues} />
      case 'todo': return <TodoView itinerary={itinerary} />
      case 'map': return <MapView itinerary={itinerary} />
      case 'currency': return <CurrencyView itinerary={itinerary} />
      case 'emergency': return <EmergencyView itinerary={itinerary} />
      case 'cultural': return <CulturalView itinerary={itinerary} />
      case 'activities': return <ActivitiesView itinerary={itinerary} />
      case 'dining': return <DiningView itinerary={itinerary} />
      default: return <WeatherView itinerary={itinerary} />
    }
  }

  const subtabs = [
    { id: 'weather' as AssistantTab, label: 'Weather', icon: Cloud },
    { id: 'packing' as AssistantTab, label: 'Packing', icon: Backpack },
    { id: 'todo' as AssistantTab, label: 'Action Items', icon: CheckSquare },
    { id: 'map' as AssistantTab, label: 'Map', icon: Map },
    { id: 'currency' as AssistantTab, label: 'Currency', icon: DollarSign },
    { id: 'emergency' as AssistantTab, label: 'Emergency', icon: Shield },
    { id: 'cultural' as AssistantTab, label: 'Cultural', icon: Calendar },
    { id: 'activities' as AssistantTab, label: 'Activities', icon: Sparkles },
    { id: 'dining' as AssistantTab, label: 'Dining', icon: UtensilsCrossed },
  ]

  return (
    <div className="animate-fade-in">
      {/* Header with trip summary */}
      <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 rounded-2xl p-6 mb-6 border border-purple-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Trip Assistants</h2>
            <p className="text-slate-600 text-sm">AI-powered insights and recommendations</p>
          </div>
        </div>

        {/* Trip summary stats */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-semibold text-slate-700">
              {itinerary.dayCount} day{itinerary.dayCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          {totalBudget > 0 && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-slate-700">
                ${totalBudget.toLocaleString()}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-semibold text-slate-700">
              {totalReservations} moment{totalReservations !== 1 ? 's' : ''}
            </span>
          </div>

          {roundTripInfo.isRoundTrip && (
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              Round Trip
            </Badge>
          )}
        </div>
      </div>

      {/* Subtab navigation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
        <div className="flex overflow-x-auto no-scrollbar">
          {subtabs.map((subtab) => {
            const Icon = subtab.icon
            const isActive = activeSubtab === subtab.id
            
            return (
              <button
                key={subtab.id}
                onClick={() => setActiveSubtab(subtab.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  isActive
                    ? 'border-purple-600 text-purple-700 bg-purple-50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {subtab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content area */}
      <div>
        {renderContent()}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, MapPin, Calendar, Users, DollarSign, Sparkles } from "lucide-react"
import { HomeLocationData } from "@/lib/types/home-location"
import { Button } from "@/components/ui/button"
import { TripBuilderModal } from "@/components/trip-builder-modal"
import { useRouter } from "next/navigation"

interface StructuredJourneyFormProps {
  homeLocation: HomeLocationData | null
  profileValues: any[]
}

export function StructuredJourneyForm({ homeLocation, profileValues }: StructuredJourneyFormProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTripBuilderOpen, setIsTripBuilderOpen] = useState(false)
  const [formData, setFormData] = useState({
    destinations: [] as string[],
    startDate: "",
    endDate: "",
    travelers: "1",
    budget: "moderate",
    tripStyle: [] as string[],
    interests: [] as string[],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Open trip builder modal with pre-filled data
    setIsTripBuilderOpen(true)
  }

  const handleTripBuilderComplete = (tripId: string) => {
    setIsTripBuilderOpen(false)
    router.push(`/view1/${tripId}`)
  }

  const budgetLevels = [
    { value: "budget", label: "Budget", icon: "💰" },
    { value: "moderate", label: "Moderate", icon: "💳" },
    { value: "luxury", label: "Luxury", icon: "✨" },
  ]

  const tripStyles = [
    "Relaxation", "Adventure", "Culture", "Food & Wine", "Nature", 
    "Urban Exploration", "Beach", "Skiing", "Road Trip", "Backpacking"
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100">
            <Sparkles className="h-5 w-5 text-slate-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">Or start with specifics</h3>
            <p className="text-sm text-slate-500">Fill in what you know, leave the rest blank</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {/* Form Content */}
      {isExpanded && (
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            
            {/* Destinations */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <MapPin className="h-4 w-4" />
                Where do you want to go?
              </label>
              <input
                type="text"
                placeholder="Enter destinations (e.g., Paris, Rome, Barcelona)"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
              <p className="mt-1 text-xs text-slate-500">Separate multiple destinations with commas</p>
            </div>

            {/* Dates */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Calendar className="h-4 w-4" />
                When?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="px-3 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="px-3 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Or leave blank for flexible dates</p>
            </div>

            {/* Travelers */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Users className="h-4 w-4" />
                How many travelers?
              </label>
              <select
                value={formData.travelers}
                onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              >
                <option value="1">Just me</option>
                <option value="2">2 travelers</option>
                <option value="3">3 travelers</option>
                <option value="4">4 travelers</option>
                <option value="5+">5+ travelers</option>
              </select>
            </div>

            {/* Budget */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                <DollarSign className="h-4 w-4" />
                Budget level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {budgetLevels.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, budget: level.value })}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.budget === level.value
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="text-2xl mb-1">{level.icon}</div>
                    <div className="text-sm font-medium">{level.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trip Style */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-3 block">
                Trip style (select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {tripStyles.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        tripStyle: formData.tripStyle.includes(style)
                          ? formData.tripStyle.filter(s => s !== style)
                          : [...formData.tripStyle, style]
                      })
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      formData.tripStyle.includes(style)
                        ? "bg-blue-500 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              All fields are optional - fill in what you know
            </p>
            <Button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Build My Journey
            </Button>
          </div>
        </form>
      )}

      {/* Trip Builder Modal */}
      <TripBuilderModal
        isOpen={isTripBuilderOpen}
        onClose={() => setIsTripBuilderOpen(false)}
        onComplete={handleTripBuilderComplete}
      />
    </div>
  )
}

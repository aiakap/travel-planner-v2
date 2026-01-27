"use client"

import { Button } from "@/app/exp/ui/button"
import { ChevronDown, MapPin, Calendar, Layers } from "lucide-react"

interface TimelineCollapsedViewProps {
  tripTitle: string
  cityNames: string[]
  totalDays: number
  segmentCount: number
  stayCount: number
  travelCount: number
  onExpand: () => void
}

export function TimelineCollapsedView({
  tripTitle,
  cityNames,
  totalDays,
  segmentCount,
  stayCount,
  travelCount,
  onExpand,
}: TimelineCollapsedViewProps) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-md w-full">
        <div className="bg-white border-2 border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {tripTitle}
            </h3>
            <p className="text-sm text-slate-600">
              Your itinerary is ready to review
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {cityNames.length}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {cityNames.length === 1 ? 'City' : 'Cities'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {totalDays}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {totalDays === 1 ? 'Day' : 'Days'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {segmentCount}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {segmentCount === 1 ? 'Segment' : 'Segments'}
                </div>
              </div>
            </div>

            {/* Route Preview */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Route:</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 flex-wrap">
                {cityNames.map((city, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {index > 0 && <span className="text-slate-400">→</span>}
                    <span className="font-medium">{city}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Segment Breakdown */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Segments Created:</span>
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Stays</span>
                  <span className="font-medium">{stayCount}</span>
                </div>
                {travelCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Flights</span>
                    <span className="font-medium">{travelCount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Expand Button */}
            <Button
              onClick={onExpand}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 text-base font-medium"
            >
              <ChevronDown className="h-5 w-5 mr-2" />
              View Full Timeline
            </Button>

            <p className="text-xs text-center text-slate-500">
              Click to see your complete itinerary with all details
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

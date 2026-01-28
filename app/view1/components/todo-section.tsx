"use client"

import type { ViewItinerary, ViewReservation } from "@/lib/itinerary-view-types"
import { CheckSquare, Plane, Hotel, Utensils, Compass, Car } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { buildChatUrl } from "../lib/chat-integration"
import { ReservationStatusSelect } from "./reservation-status-select"
import { SectionHeading } from "./section-heading"

interface TodoSectionProps {
  itinerary: ViewItinerary
}

function getReservationIcon(type: ViewReservation['type']) {
  switch (type) {
    case 'flight': return Plane
    case 'hotel': return Hotel
    case 'restaurant': return Utensils
    case 'transport': return Car
    default: return Compass
  }
}

function getReservationColor(type: ViewReservation['type']) {
  switch (type) {
    case 'flight': return { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-l-blue-500' }
    case 'hotel': return { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-l-amber-500' }
    case 'restaurant': return { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-l-emerald-500' }
    case 'transport': return { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-l-purple-500' }
    default: return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-l-slate-500' }
  }
}

export function TodoSection({ itinerary }: TodoSectionProps) {
  // Filter pending reservations
  const todoItems = itinerary.segments.flatMap(segment =>
    segment.reservations
      .filter(r => r.status === 'pending')
      .map(r => ({ ...r, segment }))
  )
  
  if (todoItems.length === 0) {
    return null  // Hide section if no to-dos
  }
  
  return (
    <section id="todo" className="scroll-mt-32 max-w-5xl mx-auto px-4 py-12">
      <SectionHeading 
        icon={CheckSquare} 
        title="Action Items" 
        subtitle={`${todoItems.length} item${todoItems.length !== 1 ? 's' : ''} pending your review`}
      />
      
      <div className="space-y-4">
        {todoItems.map(item => {
          const Icon = getReservationIcon(item.type)
          const colors = getReservationColor(item.type)
          
          return (
            <Card key={item.id} className={`border-l-4 ${colors.border} hover:shadow-lg hover:-translate-y-1 transition-all`}>
              <div className="p-6 flex flex-col md:flex-row md:items-center gap-6">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 ${colors.bg} ${colors.text} rounded-full flex items-center justify-center`}>
                    <Icon size={24} />
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 text-lg">{item.title}</h3>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                  <p className="text-slate-600 text-sm">
                    {item.description}
                    {item.location && ` • ${item.location}`}
                    {` • ${item.date}`}
                  </p>
                  {item.notes && (
                    <p className="text-slate-400 text-xs mt-2">{item.notes}</p>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-3">
                  <ReservationStatusSelect
                    reservationId={item.id}
                    currentStatusId={item.reservationStatusId}
                    currentStatusName={item.statusName}
                  />
                  <button
                    onClick={() => window.location.href = buildChatUrl({
                      tripId: itinerary.id,
                      segmentId: item.segment.id,
                      reservationId: item.id,
                      action: 'chat',
                      source: 'overview'
                    })}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

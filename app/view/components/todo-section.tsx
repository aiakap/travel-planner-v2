"use client"

import type { ViewItinerary, ViewReservation } from "@/lib/itinerary-view-types"
import { CheckSquare, X, Plane, Hotel, Utensils, Compass, Car, MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { buildChatUrl } from "../lib/chat-integration"
import { ReservationStatusSelect } from "./reservation-status-select"

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
  
  // Group by segment
  const groupedTodos = todoItems.reduce((acc, item) => {
    const segmentId = item.segment.id
    if (!acc[segmentId]) {
      acc[segmentId] = []
    }
    acc[segmentId].push(item)
    return acc
  }, {} as Record<string, typeof todoItems>)
  
  return (
    <section id="todo" className="scroll-mt-32 max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-6">
        <CheckSquare className="h-6 w-6 text-amber-500" />
        <h2 className="text-3xl font-bold">Action Items</h2>
        <Badge variant="secondary" className="ml-auto">
          {todoItems.length} pending
        </Badge>
      </div>
      
      <Card className="p-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <p className="text-sm text-muted-foreground mb-6">
          These items are suggestions or pending confirmation. Review and confirm to add them to your final itinerary.
        </p>
        
        <div className="space-y-6">
          {Object.entries(groupedTodos).map(([segmentId, items]) => {
            const segment = itinerary.segments.find(s => s.id === segmentId)
            
            return (
              <div key={segmentId}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  {segment?.title}
                </h3>
                
                <div className="space-y-2">
                  {items.map(item => {
                    const Icon = getReservationIcon(item.type)
                    
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 bg-background rounded-lg border hover:border-amber-400 transition-colors group"
                      >
                        {/* Checkbox (visual only) */}
                        <div className="mt-1 h-5 w-5 rounded border-2 border-muted-foreground/50 group-hover:border-amber-500 transition-colors" />
                        
                        {/* Icon */}
                        <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30">
                          <Icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm">{item.title}</div>
                            <ReservationStatusSelect
                              reservationId={item.id}
                              currentStatusId={item.reservationStatusId}
                              currentStatusName={item.statusName}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {item.date} • {item.time}
                            {item.location && ` • ${item.location}`}
                          </div>
                          {item.notes && (
                            <div className="text-xs text-muted-foreground mt-1 italic">
                              {item.notes}
                            </div>
                          )}
                        </div>
                        
                        {/* Price */}
                        {item.price > 0 && (
                          <div className="text-sm font-semibold text-amber-600">
                            ${item.price.toLocaleString()}
                          </div>
                        )}
                        
                        {/* Chat Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.href = buildChatUrl({
                            tripId: itinerary.id,
                            segmentId: item.segment.id,
                            reservationId: item.id,
                            action: 'chat',
                            source: 'overview'
                          })}
                          className="ml-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </section>
  )
}

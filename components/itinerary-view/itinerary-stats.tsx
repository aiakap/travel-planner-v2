import { Card } from "@/components/ui/card"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { Plane, Building2, Utensils, Compass } from "lucide-react"

interface ItineraryStatsProps {
  itinerary: ViewItinerary
}

export function ItineraryStats({ itinerary }: ItineraryStatsProps) {
  const allReservations = itinerary.segments.flatMap((s) => s.reservations)

  const stats = {
    flights: allReservations.filter((r) => r.type === "flight").length,
    hotels: allReservations.filter((r) => r.type === "hotel").length,
    restaurants: allReservations.filter((r) => r.type === "restaurant").length,
    activities: allReservations.filter((r) => r.type === "activity" || r.type === "transport").length,
    totalCost: allReservations.reduce((sum, r) => sum + r.price, 0),
  }

  const statItems = [
    { label: "Flights", value: stats.flights, icon: Plane, color: "text-blue-500" },
    { label: "Hotels", value: stats.hotels, icon: Building2, color: "text-purple-500" },
    { label: "Dining", value: stats.restaurants, icon: Utensils, color: "text-orange-500" },
    { label: "Activities", value: stats.activities, icon: Compass, color: "text-green-500" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {statItems.map((item) => (
        <Card key={item.label} className="p-3 md:p-4">
          <div className="flex items-center gap-3">
            <div className={`${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </div>
        </Card>
      ))}
      <Card className="p-3 md:p-4 col-span-2 md:col-span-1">
        <div>
          <p className="text-2xl font-bold text-emerald-500">${stats.totalCost.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Cost</p>
        </div>
      </Card>
    </div>
  )
}



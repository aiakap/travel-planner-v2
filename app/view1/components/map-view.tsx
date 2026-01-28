import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { MapPin, Plane, Home, Snowflake } from "lucide-react"
import { Card } from "./card"
import { TripReservationsMap } from "@/components/trip-reservations-map"
import type { GlobeTripData } from "@/lib/globe-types"
import { useMemo } from "react"
import { getIconForType } from "../lib/view-utils"

interface MapViewProps {
  itinerary: ViewItinerary
}

export function MapView({ itinerary }: MapViewProps) {
  // Transform to GlobeTripData for map
  const globeTripData: GlobeTripData = useMemo(() => ({
    id: itinerary.id,
    title: itinerary.title,
    description: itinerary.description,
    imageUrl: itinerary.coverImage,
    startDate: itinerary.startDate,
    endDate: itinerary.endDate,
    totalDistance: 0,
    countries: [],
    color: '#0EA5E9',
    segments: itinerary.segments.map(seg => ({
      id: seg.id,
      name: seg.title,
      startLat: seg.startLat,
      startLng: seg.startLng,
      endLat: seg.endLat,
      endLng: seg.endLng,
      startTitle: seg.startTitle,
      endTitle: seg.endTitle,
      startTime: seg.startDate,
      endTime: seg.endDate,
      notes: null,
      imageUrl: seg.imageUrl || null,
      segmentType: { name: seg.segmentType },
      reservations: seg.reservations.map(res => ({
        id: res.id,
        name: res.title,
        location: res.location,
        departureLocation: res.departureLocation || null,
        arrivalLocation: res.arrivalLocation || null,
        startTime: res.startTime || null,
        endTime: res.endTime || null,
        confirmationNumber: res.confirmationNumber || null,
        notes: res.notes || null,
        cost: res.price || null,
        currency: 'USD',
        imageUrl: res.image || null,
        reservationType: {
          name: res.description,
          category: { name: res.categoryName }
        }
      }))
    }))
  }), [itinerary])

  // Get all unique locations from reservations
  const locations = itinerary.segments.flatMap(seg => 
    seg.reservations.map(res => ({
      title: res.title,
      type: res.description,
      location: res.location,
      icon: getIconForType(res.type),
      reservationType: res.type
    }))
  ).filter((loc, idx, arr) => 
    arr.findIndex(l => l.location === loc.location) === idx
  ).slice(0, 10) // Limit to 10 locations

  const getColorForType = (type: string) => {
    const colors = {
      flight: 'bg-blue-50 text-blue-600',
      hotel: 'bg-rose-50 text-rose-600',
      restaurant: 'bg-emerald-50 text-emerald-600',
      transport: 'bg-purple-50 text-purple-600',
      activity: 'bg-slate-50 text-slate-600'
    }
    return colors[type as keyof typeof colors] || 'bg-slate-50 text-slate-600'
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[600px] animate-fade-in">
      {/* Sidebar List */}
      <div className="w-full md:w-1/3 space-y-4 overflow-y-auto pr-2 no-scrollbar">
         {locations.map((item, i) => (
           <Card key={i} className={`p-4 cursor-pointer transition-all duration-200 ${i === 0 ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'hover:border-blue-300'}`}>
              <div className="flex gap-4">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getColorForType(item.reservationType)}`}>
                    <item.icon size={20} />
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{item.type}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>{item.location}</span>
                    </div>
                 </div>
              </div>
           </Card>
         ))}
      </div>

      {/* Map Area */}
      <div className="flex-grow bg-slate-100 rounded-2xl relative overflow-hidden border border-slate-200 shadow-inner">
        <TripReservationsMap 
          trip={globeTripData}
          height="600px"
        />
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-medium text-slate-500 shadow-sm border border-white/50 pointer-events-none">
            Map data © Google Maps
        </div>
      </div>
    </div>
  )
}

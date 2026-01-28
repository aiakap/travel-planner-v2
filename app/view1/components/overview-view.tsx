import { useState } from "react"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { BookOpen, Plane, Home } from "lucide-react"
import { TripReservationsMap } from "@/components/trip-reservations-map"
import type { GlobeTripData } from "@/lib/globe-types"
import { useMemo } from "react"
import { detectRoundTrip, getTravelSegments } from "../lib/view-utils"
import { Badge } from "./badge"

interface OverviewViewProps {
  itinerary: ViewItinerary
}

export function OverviewView({ itinerary }: OverviewViewProps) {
  const [mapView, setMapView] = useState<'moments' | 'travel'>('moments')
  // Detect round trip
  const roundTripInfo = useMemo(() => detectRoundTrip(itinerary), [itinerary])
  
  // Get travel segments for "All Travel" view
  const travelSegments = useMemo(() => getTravelSegments(itinerary), [itinerary])
  
  // Transform to GlobeTripData for map
  const globeTripData: GlobeTripData = useMemo(() => {
    const segmentsToShow = mapView === 'travel' ? travelSegments : itinerary.segments
    
    return {
      id: itinerary.id,
      title: itinerary.title,
      description: itinerary.description,
      imageUrl: itinerary.coverImage,
      startDate: itinerary.startDate,
      endDate: itinerary.endDate,
      totalDistance: 0,
      countries: [],
      color: '#0EA5E9',
      segments: segmentsToShow.map(seg => ({
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
    }
  }, [itinerary, mapView, travelSegments])

  // Calculate real budget from all reservations
  const totalBudget = itinerary.segments.reduce((total, seg) => 
    total + seg.reservations.reduce((sum, res) => sum + res.price, 0), 0
  )

  // Count total reservations
  const totalReservations = itinerary.segments.reduce((total, seg) => 
    total + seg.reservations.length, 0
  )

  return (
    <div className="animate-fade-in">
      <div className="grid md:grid-cols-3 gap-6">
         <div className="md:col-span-2 relative h-80 bg-slate-200 rounded-2xl overflow-hidden shadow-sm group cursor-pointer border border-slate-200">
            <TripReservationsMap 
              trip={globeTripData}
              height="320px"
              mapTypeId="satellite"
            />
            
            {/* View Toggle with Icons - Bottom Left */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/50 overflow-hidden">
              <div className="flex gap-0">
                <button
                  onClick={() => setMapView('moments')}
                  className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 ${
                    mapView === 'moments'
                      ? 'bg-white text-slate-900'
                      : 'bg-transparent text-slate-600 hover:bg-white/50'
                  }`}
                >
                  <BookOpen size={16} />
                  All Moments
                </button>
                <div className="w-px bg-slate-200"></div>
                <button
                  onClick={() => setMapView('travel')}
                  className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 ${
                    mapView === 'travel'
                      ? 'bg-white text-slate-900'
                      : 'bg-transparent text-slate-600 hover:bg-white/50'
                  }`}
                >
                  <Plane size={16} />
                  All Travel
                  {mapView === 'travel' && roundTripInfo.isRoundTrip && (
                    <Badge variant="info" className="text-[9px] px-1.5 py-0 ml-1">
                      <Home size={10} className="mr-0.5" />
                      Round Trip
                    </Badge>
                  )}
                </button>
              </div>
            </div>
         </div>
         
         <div className="space-y-6">
           <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between h-full">
              <div>
                <h3 className="text-xl font-bold mb-2">Trip Summary</h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  A {itinerary.dayCount}-day journey exploring {itinerary.segments.length} destination{itinerary.segments.length !== 1 ? 's' : ''}.
                </p>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <span className="text-sm font-medium text-blue-100">Total Budget</span>
                  <span className="font-bold">{totalBudget > 0 ? `$${totalBudget.toLocaleString()}` : '+ Add Costs'}</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <span className="text-sm font-medium text-blue-100">Reservations</span>
                  <span className="font-bold">{totalReservations}</span>
                </div>
              </div>
           </div>
         </div>
      </div>
    </div>
  )
}

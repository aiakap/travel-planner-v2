"use client"

import { useState, useMemo, useEffect } from "react"
import { List, Search, Plus } from "lucide-react"
import { TripListRow, TripSummary } from "./trip-list-row"
import { Badge } from "./badge"
import { Button } from "./button"
import { useRouter } from "next/navigation"
import { DeleteTripDialog } from "@/components/delete-trip-dialog"
import { updateTripStatus } from "@/lib/actions/update-trip-status"
import { TripStatus } from "@/app/generated/prisma"

type FilterType = 'Planning' | 'Upcoming' | 'Drafts' | 'Archived'

interface YourJourneysSectionProps {
  trips: TripSummary[]
}

export const YourJourneysSection = ({ trips }: YourJourneysSectionProps) => {
  const router = useRouter()
  const filters: FilterType[] = ['Planning', 'Upcoming', 'Drafts', 'Archived']
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('Planning')
  const [searchTerm, setSearchTerm] = useState('')
  const [localTrips, setLocalTrips] = useState<TripSummary[]>(trips)
  const [tripToDelete, setTripToDelete] = useState<TripSummary | null>(null)

  // Sync local trips with props when trips change from server
  useEffect(() => {
    setLocalTrips(trips)
  }, [trips])

  // Handle delete request - opens confirmation dialog
  const handleDeleteRequest = (trip: TripSummary) => {
    setTripToDelete(trip)
  }

  // Handle after deletion confirmed - optimistic UI update
  const handleDeleted = (tripId: string) => {
    setLocalTrips(prev => prev.filter(t => t.id !== tripId))
  }

  // Handle status change (Archive/Planning)
  const handleStatusChange = async (trip: TripSummary, newStatus: string) => {
    try {
      await updateTripStatus(trip.id, newStatus as TripStatus)
      // Optimistic update
      setLocalTrips(prev => prev.map(t => 
        t.id === trip.id 
          ? { 
              ...t, 
              dbStatus: newStatus, 
              status: newStatus === 'ARCHIVED' ? 'Archived' : 'Planning' as const,
              statusColor: newStatus === 'ARCHIVED' ? 'warning' : 'info' as const
            }
          : t
      ))
      router.refresh()
    } catch (error) {
      console.error("Failed to update trip status:", error)
    }
  }

  // Filter trips based on active filter and search term
  const filteredTrips = useMemo(() => {
    let result = localTrips
    const now = new Date()
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    // Apply status filter
    switch (activeFilter) {
      case 'Planning':
        // Planning: PLANNING or LIVE status, not starting within 2 weeks
        result = result.filter(trip => {
          if (trip.dbStatus === 'DRAFT' || trip.dbStatus === 'ARCHIVED') return false
          const startDate = new Date(trip.startDate)
          return startDate > twoWeeksFromNow
        })
        break
      case 'Upcoming':
        // Upcoming: starts within next 2 weeks, not draft or archived
        result = result.filter(trip => {
          if (trip.dbStatus === 'DRAFT' || trip.dbStatus === 'ARCHIVED') return false
          const startDate = new Date(trip.startDate)
          return startDate >= now && startDate <= twoWeeksFromNow
        })
        break
      case 'Drafts':
        result = result.filter(trip => trip.dbStatus === 'DRAFT')
        break
      case 'Archived':
        result = result.filter(trip => trip.dbStatus === 'ARCHIVED')
        break
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(trip => 
        trip.title.toLowerCase().includes(term) ||
        trip.destinations.toLowerCase().includes(term)
      )
    }

    return result
  }, [localTrips, activeFilter, searchTerm])

  const handleNewJourney = () => {
    router.push('/view1')
  }

  return (
    <section className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg text-white shadow-lg shadow-slate-900/20">
            <List size={20} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Your Journeys</h2>
          <Badge variant="default" className="ml-2">{filteredTrips.length} {activeFilter}</Badge>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
            <Search size={16} className="text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search journeys..." 
              className="text-sm outline-none placeholder:text-slate-400 w-48"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="primary" icon={Plus} onClick={handleNewJourney}>
            New Journey
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {filters.map((filter) => (
          <button 
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm transition-all whitespace-nowrap ${
              activeFilter === filter
                ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Trip List */}
      <div className="space-y-4">
        {filteredTrips.length > 0 ? (
          filteredTrips.map(trip => (
            <TripListRow 
              key={trip.id} 
              trip={trip} 
              onDelete={handleDeleteRequest}
              onStatusChange={handleStatusChange}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">
              {localTrips.length === 0 
                ? "No journeys found. Create your first journey!" 
                : `No ${activeFilter.toLowerCase()} journeys found.`}
            </p>
            {localTrips.length === 0 && (
              <Button variant="primary" icon={Plus} onClick={handleNewJourney} className="mt-4">
                Create Journey
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteTripDialog
        trip={tripToDelete ? { id: tripToDelete.id, name: tripToDelete.title } : null}
        open={!!tripToDelete}
        onOpenChange={(open) => !open && setTripToDelete(null)}
        onDeleted={handleDeleted}
      />
    </section>
  )
}

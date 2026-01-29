"use client"

import { List, Search, Plus } from "lucide-react"
import { TripListRow, TripSummary } from "./trip-list-row"
import { Badge } from "./badge"
import { Button } from "./button"
import { useRouter } from "next/navigation"

interface YourJourneysSectionProps {
  trips: TripSummary[]
}

export const YourJourneysSection = ({ trips }: YourJourneysSectionProps) => {
  const router = useRouter()
  const filters = ['All', 'Upcoming', 'Planning', 'Drafts', 'Archived']

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
          <Badge variant="default" className="ml-2">{trips.length} Total</Badge>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
            <Search size={16} className="text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search journeys..." 
              className="text-sm outline-none placeholder:text-slate-400 w-48" 
            />
          </div>
          <Button variant="primary" icon={Plus} onClick={handleNewJourney}>
            New Journey
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {filters.map((filter, i) => (
          <button 
            key={filter} 
            className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm transition-all whitespace-nowrap ${
              i === 0 
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
        {trips.length > 0 ? (
          trips.map(trip => (
            <TripListRow key={trip.id} trip={trip} />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">No journeys found. Create your first journey!</p>
            <Button variant="primary" icon={Plus} onClick={handleNewJourney} className="mt-4">
              Create Journey
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

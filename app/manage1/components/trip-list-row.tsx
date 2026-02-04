"use client"

import { Calendar, Wallet, Ticket, Share2, MoreHorizontal, ArrowRight, PlayCircle, Trash2 } from "lucide-react"
import { Badge } from "./badge"
import { useRouter } from "next/navigation"

export interface TripSummary {
  id: string
  title: string
  status: "Planning" | "Upcoming" | "Draft" | "Archived"
  statusColor: "info" | "success" | "default" | "warning"
  dates: string
  destinations: string
  duration: string
  cost: string
  reservations: number
  image: string
  dbStatus: string // Original database status (DRAFT, PLANNING, LIVE, ARCHIVED)
}

interface TripListRowProps {
  trip: TripSummary
  onDelete?: (trip: TripSummary) => void
}

export const TripListRow = ({ trip, onDelete }: TripListRowProps) => {
  const router = useRouter()
  const isDraft = trip.dbStatus === 'DRAFT'

  const handleClick = () => {
    if (isDraft) {
      // Continue editing draft trip
      router.push(`/trip/new?tripId=${trip.id}`)
    } else {
      router.push(`/view1/${trip.id}`)
    }
  }

  return (
    <div 
      className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col md:flex-row gap-6 items-center"
      onClick={handleClick}
    >
      {/* Image */}
      <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0 relative">
        <img 
          src={trip.image} 
          alt={trip.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute top-2 left-2">
          <Badge variant={trip.statusColor}>{trip.status}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow w-full md:w-auto">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {trip.title}
            </h3>
            <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
              <Calendar size={14} /> {trip.dates}
            </p>
          </div>
          <div className="hidden md:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                // Share functionality
              }}
            >
              <Share2 size={18} />
            </button>
            <button 
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                // More options
              }}
            >
              <MoreHorizontal size={18} />
            </button>
            <button 
              className="p-2 hover:bg-rose-100 rounded-full text-slate-400 hover:text-rose-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(trip)
              }}
              title="Delete trip"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-slate-100/80 rounded-lg p-2 px-3 border border-slate-200/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Destinations
            </span>
            <span className="text-sm font-semibold text-slate-700">{trip.destinations}</span>
          </div>
          <div className="bg-slate-100/80 rounded-lg p-2 px-3 border border-slate-200/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Duration
            </span>
            <span className="text-sm font-semibold text-slate-700">{trip.duration}</span>
          </div>
          <div className="bg-slate-100/80 rounded-lg p-2 px-3 border border-slate-200/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Est. Cost
            </span>
            <div className="flex items-center gap-1">
              <Wallet size={12} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">{trip.cost}</span>
            </div>
          </div>
          <div className="bg-slate-100/80 rounded-lg p-2 px-3 border border-slate-200/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Reservations
            </span>
            <div className="flex items-center gap-1">
              <Ticket size={12} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">{trip.reservations} Booked</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end mt-3">
          {isDraft ? (
            <span className="text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              <PlayCircle size={14} /> Continue Planning
            </span>
          ) : (
            <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Enter Experience <ArrowRight size={14} />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

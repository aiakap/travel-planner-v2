"use client"

import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { Calendar, MapPin, Clock, MessageCircle, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDateRange } from "../lib/view-utils"
import { buildChatUrl } from "../lib/chat-integration"

interface HeroSectionProps {
  itinerary: ViewItinerary
}

export function HeroSection({ itinerary }: HeroSectionProps) {
  // Get unique destinations
  const destinations = Array.from(new Set(itinerary.segments.map(s => s.endTitle))).slice(0, 3).join(' • ');
  
  // Determine trip status
  const today = new Date();
  const startDate = new Date(itinerary.startDate);
  const endDate = new Date(itinerary.endDate);
  const isUpcoming = startDate > today;
  const isOngoing = startDate <= today && endDate >= today;
  const isPast = endDate < today;
  
  const statusBadge = isUpcoming ? 'Upcoming' : isOngoing ? 'In Progress' : 'Completed';
  const statusVariant = isUpcoming ? 'default' : isOngoing ? 'default' : 'secondary';

  return (
    <section id="hero" className="scroll-mt-32">
      {/* Dramatic Hero Section */}
      <div className="relative h-[65vh] min-h-[500px] flex items-end pb-20 overflow-hidden group">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={itinerary.coverImage}
            alt={itinerary.title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-black/30"></div>
          <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full">
          <div className="max-w-3xl">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-white/20 text-white border-white/20 backdrop-blur-md">
                Trip
              </Badge>
              <Badge className="bg-blue-500/80 text-white border-blue-400/50 backdrop-blur-md">
                {statusBadge}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 drop-shadow-lg">
              {itinerary.title}
            </h1>

            {/* Metadata Card */}
            <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-8 text-white/90 mb-8 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 w-fit">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase font-semibold">Dates</p>
                  <p className="font-medium">{formatDateRange(itinerary.startDate, itinerary.endDate)}</p>
                </div>
              </div>

              <div className="w-[1px] h-10 bg-white/10 hidden md:block"></div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase font-semibold">Destinations</p>
                  <p className="font-medium">{destinations}</p>
                </div>
              </div>

              <div className="w-[1px] h-10 bg-white/10 hidden md:block"></div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase font-semibold">Duration</p>
                  <p className="font-medium">{itinerary.dayCount} Days</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => {
                  const element = document.getElementById('itinerary');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-white text-blue-900 rounded-full font-bold hover:bg-blue-50 transition-colors shadow-lg shadow-black/20 flex items-center gap-2"
              >
                View Full Itinerary <ArrowRight size={18} />
              </button>
              <button
                onClick={() => window.location.href = buildChatUrl({ tripId: itinerary.id, action: 'chat', source: 'overview' })}
                className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-full font-medium hover:bg-white/20 transition-colors backdrop-blur-md flex items-center gap-2"
              >
                <MessageCircle size={18} /> Chat About Trip
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

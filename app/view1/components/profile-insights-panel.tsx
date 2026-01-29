"use client"

import { UserContext } from "@/lib/types/user-context"
import { HomeLocationData } from "@/lib/types/home-location"
import { MapPin, Sparkles, Calendar, Plane, TrendingUp, Settings } from "lucide-react"
import Link from "next/link"

interface RecentTrip {
  id: string
  title: string
  startDate: Date
  endDate: Date
  imageUrl: string | null
}

interface ProfileInsightsPanelProps {
  userContext: UserContext | null
  homeLocation: HomeLocationData | null
  recentTrips: RecentTrip[]
}

export function ProfileInsightsPanel({ userContext, homeLocation, recentTrips }: ProfileInsightsPanelProps) {
  // Extract profile graph items (top 3)
  const graphItems = userContext?.profileGraph?.items?.slice(0, 3) || []
  
  // Extract hobbies (top 3)
  const hobbies = userContext?.profile?.hobbies?.slice(0, 3) || []
  
  // Extract preferred airports from profile
  const preferredAirports = userContext?.profile?.profile?.preferredAirports || []
  const homeAirports = userContext?.profile?.profile?.homeAirports || []
  const airports = [...homeAirports, ...preferredAirports].slice(0, 3)

  return (
    <div className="space-y-4 lg:sticky lg:top-4">
      
      {/* Header Card */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold">We know a few things about you...</h2>
        </div>
        <p className="text-white/80 text-sm">
          Let's use your preferences to create the perfect journey
        </p>
      </div>

      {/* Home Location */}
      {homeLocation && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Home Location</h3>
              <p className="text-slate-700 font-medium text-sm truncate">
                {homeLocation.city || homeLocation.name}
              </p>
              {homeLocation.country && (
                <p className="text-slate-500 text-xs">{homeLocation.country}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Travel Style */}
      {graphItems.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 text-sm">Travel Preferences</h3>
            </div>
          </div>
          <div className="space-y-2 ml-11">
            {graphItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span className="text-sm text-slate-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Interests/Hobbies */}
      {hobbies.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 text-sm">Your Interests</h3>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 ml-11">
            {hobbies.map((hobby, index) => (
              <span
                key={index}
                className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium"
              >
                {hobby.hobby.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Preferred Airports */}
      {airports.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-orange-50">
              <Plane className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 text-sm">Preferred Airports</h3>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 ml-11">
            {airports.map((airport, index) => (
              <span
                key={index}
                className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-mono font-medium"
              >
                {typeof airport === 'string' ? airport : airport.code || airport}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Trips */}
      {recentTrips.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-pink-50">
              <Calendar className="h-5 w-5 text-pink-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 text-sm">Recent Trips</h3>
            </div>
          </div>
          <div className="space-y-2 ml-11">
            {recentTrips.slice(0, 2).map((trip) => (
              <Link
                key={trip.id}
                href={`/view1/${trip.id}`}
                className="block p-2 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                  {trip.title}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Update Preferences CTA */}
      <Link
        href="/profile"
        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm transition-colors group"
      >
        <Settings className="h-4 w-4 group-hover:rotate-45 transition-transform" />
        Update Your Preferences
      </Link>
    </div>
  )
}

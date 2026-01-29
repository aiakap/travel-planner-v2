"use client"

import { UserContext } from "@/lib/types/user-context"
import { HomeLocationData } from "@/lib/types/home-location"
import { MapPin, Sparkles } from "lucide-react"
import { JourneyCreationCards } from "./journey-creation-cards"
import { StructuredJourneyForm } from "./structured-journey-form"
import { ProfileInsightsPanel } from "./profile-insights-panel"
import { SuggestionsCarousel } from "./suggestions-carousel"

interface RecentTrip {
  id: string
  title: string
  startDate: Date
  endDate: Date
  imageUrl: string | null
}

interface NewJourneyExperienceProps {
  userContext: UserContext | null
  homeLocation: HomeLocationData | null
  profileValues: any[]
  recentTrips: RecentTrip[]
}

export function NewJourneyExperience({
  userContext,
  homeLocation,
  profileValues,
  recentTrips,
}: NewJourneyExperienceProps) {
  const userName = userContext?.user?.name?.split(' ')[0] || 'there'
  const homeLocationText = homeLocation 
    ? `${homeLocation.city || homeLocation.name}${homeLocation.country ? `, ${homeLocation.country}` : ''}`
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxNDgsIDE2MywgMTg0LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 mb-6 shadow-sm">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Welcome back, {userName}</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
              Where will your next
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                adventure take you?
              </span>
            </h1>
            
            {homeLocationText && (
              <p className="text-lg text-slate-600 flex items-center justify-center gap-2">
                <MapPin className="h-5 w-5 text-slate-400" />
                Starting from {homeLocationText}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Interaction */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Four Interaction Mode Cards */}
            <JourneyCreationCards />
            
            {/* Structured Form (Collapsible) */}
            <StructuredJourneyForm 
              homeLocation={homeLocation}
              profileValues={profileValues}
            />
            
            {/* Suggestions Carousel */}
            <SuggestionsCarousel 
              homeLocation={homeLocation}
              recentTrips={recentTrips}
            />
          </div>
          
          {/* Right Column - Profile Insights */}
          <div className="lg:col-span-1">
            <ProfileInsightsPanel 
              userContext={userContext}
              homeLocation={homeLocation}
              recentTrips={recentTrips}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

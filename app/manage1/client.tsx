"use client"

import { useState } from "react"
import { YourJourneysSection } from "./components/your-journeys-section"
import { DiscoverSection } from "./components/discover-section"
import type { TripSummary } from "./components/trip-list-row"
import type { RecommendationCardData } from "./components/recommendation-card"

interface Manage1ClientProps {
  trips: TripSummary[]
  recommendations: Record<string, RecommendationCardData[]>
}

export function Manage1Client({ trips, recommendations }: Manage1ClientProps) {
  const [activeCategory, setActiveCategory] = useState('for_you')
  
  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-20">
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-12">
        {/* Section 1: Your Journeys */}
        <YourJourneysSection trips={trips} />
        
        {/* Section 2: Discover Journeys (stubbed) */}
        <DiscoverSection 
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          recommendations={recommendations}
        />
      </main>
    </div>
  )
}

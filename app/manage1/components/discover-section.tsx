"use client"

import { Sparkles, Users, Hash, Star, Search } from "lucide-react"
import { RecommendationCard, RecommendationCardData } from "./recommendation-card"

interface DiscoverSectionProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
  recommendations: Record<string, RecommendationCardData[]>
}

export const DiscoverSection = ({ 
  activeCategory, 
  onCategoryChange, 
  recommendations 
}: DiscoverSectionProps) => {
  const categories = [
    { id: 'for_you', label: 'For You', icon: Sparkles },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'interests', label: 'Interests', icon: Hash },
    { id: 'influencers', label: 'Experts', icon: Star },
  ]

  const currentRecommendations = recommendations[activeCategory] || recommendations.for_you || []

  return (
    <section className="animate-fade-in delay-100">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Discover Journeys
          </h1>
          <p className="text-slate-500 max-w-xl">
            Explore curated adventures based on your style and network.
          </p>
        </div>
        
        {/* Category Tabs */}
        <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          {categories.map(tab => (
            <button
              key={tab.id}
              onClick={() => onCategoryChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeCategory === tab.id 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {currentRecommendations.map((trip) => (
          <RecommendationCard key={trip.id} {...trip} />
        ))}
        
        {/* CTA Card */}
        <div className="group h-64 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center cursor-pointer text-center p-6">
          <div className="w-12 h-12 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors mb-4">
            <Search size={24} />
          </div>
          <h3 className="font-bold text-slate-900">Explore More</h3>
          <p className="text-sm text-slate-500 mt-1">
            Browse 50+ more journeys in {activeCategory.replace('_', ' ')}
          </p>
        </div>
      </div>
    </section>
  )
}

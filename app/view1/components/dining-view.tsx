"use client"

import { useState, useEffect, useRef } from "react"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { UtensilsCrossed, MapPin, DollarSign, Star, ExternalLink, Loader2 } from "lucide-react"
import { IntelligenceQuestionForm, type Question } from "./intelligence-question-form"
import { IntelligenceCard } from "./intelligence-card"
import { RelevanceTooltip, type ProfileReference } from "./relevance-tooltip"
import { Card } from "./card"
import { Badge } from "./badge"
import { useCachedIntelligence } from "../hooks/use-cached-intelligence"
import { IntelligenceLoading } from "./intelligence-loading"

interface DiningViewProps {
  itinerary: ViewItinerary
}

interface DiningRecommendation {
  id: string
  dayNumber: number
  mealType: string
  restaurantName: string
  cuisineType: string
  priceRange: string
  location: string
  distance: string
  yelpUrl: string | null
  yelpRating: number | null
  yelpReviewCount: number | null
  description: string
  specialties: string[]
  dietaryMatch: string[]
  reasoning: string
  relevanceScore: number
  profileReferences: ProfileReference[]
}

type ViewState = 'questions' | 'generating' | 'loaded'

// Simple sessionStorage key
const getGeneratingKey = (tripId: string) => `dining_generating_${tripId}`

export function DiningView({ itinerary }: DiningViewProps) {
  const { data, initialCheckComplete, updateCache } = useCachedIntelligence<{ recommendations: DiningRecommendation[] }>(
    'dining',
    itinerary.id,
    '/api/trip-intelligence/dining'
  )

  const [viewState, setViewState] = useState<ViewState>('questions')
  const [recommendations, setRecommendations] = useState<DiningRecommendation[]>([])

  // Polling refs
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const pollCountRef = useRef(0)

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  // Poll the GET endpoint to check if data exists
  const pollForData = async () => {
    try {
      const res = await fetch(`/api/trip-intelligence/dining?tripId=${itinerary.id}`)
      const apiData = await res.json()
      
      if (apiData.recommendations && apiData.recommendations.length > 0) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        
        try {
          sessionStorage.removeItem(getGeneratingKey(itinerary.id))
        } catch (e) {}
        
        setRecommendations(apiData.recommendations)
        updateCache({ recommendations: apiData.recommendations })
        setViewState('loaded')
        return
      }
      
      pollCountRef.current++
      if (pollCountRef.current > 100) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        try {
          sessionStorage.removeItem(getGeneratingKey(itinerary.id))
        } catch (e) {}
        setViewState('questions')
        alert('Generation timed out. Please try again.')
      }
    } catch (error) {
      console.error('Poll error:', error)
    }
  }

  const startPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }
    pollCountRef.current = 0
    pollForData()
    pollingRef.current = setInterval(pollForData, 3000)
  }

  // Check initial state on mount
  useEffect(() => {
    if (data?.recommendations && data.recommendations.length > 0) {
      setRecommendations(data.recommendations)
      setViewState('loaded')
      try {
        sessionStorage.removeItem(getGeneratingKey(itinerary.id))
      } catch (e) {}
      return
    }
    
    try {
      if (sessionStorage.getItem(getGeneratingKey(itinerary.id))) {
        setViewState('generating')
        startPolling()
        return
      }
    } catch (e) {}
    
    if (initialCheckComplete) {
      setViewState('questions')
    }
  }, [data, initialCheckComplete, itinerary.id])

  const questions: Question[] = [
    {
      id: 'adventurousness',
      label: 'How adventurous are you with food?',
      type: 'radio',
      options: [
        { value: 'safe', label: 'Play it safe - Familiar cuisines only' },
        { value: 'somewhat', label: 'Somewhat adventurous - Open to trying new things' },
        { value: 'very', label: 'Very adventurous - The more exotic, the better!' }
      ]
    },
    {
      id: 'mealBudget',
      label: 'Preferred dining budget per meal?',
      type: 'radio',
      options: [
        { value: '$', label: '$ - Budget-friendly ($10-20)' },
        { value: '$$', label: '$$ - Moderate ($20-40)' },
        { value: '$$$', label: '$$$ - Upscale ($40-80)' },
        { value: '$$$$', label: '$$$$ - Fine dining ($80+)' }
      ]
    }
  ]

  // Fire-and-forget generate function
  const generateRecommendations = async (answers: Record<string, string>) => {
    setViewState('generating')
    
    try {
      sessionStorage.setItem(getGeneratingKey(itinerary.id), 'true')
    } catch (e) {}

    fetch('/api/trip-intelligence/dining', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: itinerary.id,
        adventurousness: answers.adventurousness || 'somewhat',
        mealBudget: answers.mealBudget || '$$'
      })
    }).catch(err => {
      console.error('POST error:', err)
    })

    startPolling()
  }

  const handleRegenerate = async () => {
    try {
      await fetch(`/api/trip-intelligence/dining?tripId=${itinerary.id}`, {
        method: 'DELETE'
      })
    } catch (e) {
      console.error('Failed to clear dining recommendations:', e)
    }
    
    setRecommendations([])
    setViewState('questions')
  }

  // Show loading while checking cache
  if (!initialCheckComplete) {
    return <IntelligenceLoading feature="dining" mode="checking" />
  }

  const getMealTypeIcon = (type: string) => {
    if (type === 'breakfast') return '🌅'
    if (type === 'lunch') return '☀️'
    if (type === 'dinner') return '🌙'
    return '🍽️'
  }

  const getMealTypeColor = (type: string) => {
    if (type === 'breakfast') return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (type === 'lunch') return 'bg-orange-100 text-orange-800 border-orange-200'
    if (type === 'dinner') return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    return 'bg-slate-100 text-slate-800 border-slate-200'
  }

  // Group by day
  const recommendationsByDay = recommendations.reduce((acc, rec) => {
    if (!acc[rec.dayNumber]) acc[rec.dayNumber] = []
    acc[rec.dayNumber].push(rec)
    return acc
  }, {} as Record<number, DiningRecommendation[]>)

  if (viewState === 'questions') {
    return (
      <IntelligenceQuestionForm
        title="Dining Recommendations"
        description="Get personalized restaurant recommendations based on your taste and budget."
        questions={questions}
        onSubmit={generateRecommendations}
        loading={false}
      />
    )
  }

  if (viewState === 'generating') {
    return (
      <div className="animate-fade-in">
        <Card className="p-8 text-center bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-amber-100 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-amber-600 animate-spin" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Finding Perfect Restaurants...
          </h3>
          
          <p className="text-slate-600 text-sm mb-4">
            Searching for restaurants that match your preferences and dietary needs
          </p>
          
          <div className="bg-white/60 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-amber-700 font-medium mb-1">
              Feel free to explore other tabs!
            </p>
            <p className="text-xs text-slate-500">
              Your dining recommendations will be ready when you return.
            </p>
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
            <span>Generation in progress</span>
          </div>
        </Card>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="animate-fade-in">
        <Card className="p-12 text-center">
          <UtensilsCrossed className="h-16 w-16 mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">All Meals Covered</h3>
          <p className="text-slate-600 text-sm mb-6">
            You already have dining reservations for all meals!
          </p>
          <button
            onClick={handleRegenerate}
            className="px-4 py-2 text-sm font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors"
          >
            Update Preferences
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dining Recommendations</h2>
          <p className="text-slate-600 text-sm mt-1">
            {recommendations.length} restaurant{recommendations.length !== 1 ? 's' : ''} matched to your preferences
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          className="px-4 py-2 text-sm font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors"
        >
          Update Preferences
        </button>
      </div>

      {/* Meal planner by day */}
      <div className="space-y-8">
        {Object.entries(recommendationsByDay).map(([day, dayRecs]) => (
          <div key={day} className="relative">
            {/* Day header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-purple-100 rounded-lg px-4 py-2 border border-purple-200">
                <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                  Day {day}
                </div>
              </div>
              <div className="flex-1 h-px bg-purple-200"></div>
            </div>

            {/* Meals for this day */}
            <div className="space-y-4">
              {dayRecs.map((rec) => (
                <IntelligenceCard
                  key={rec.id}
                  title={rec.restaurantName}
                  icon={<UtensilsCrossed className="h-5 w-5" />}
                  expandable={false}
                >
                  <div className="space-y-4">
                    {/* Header with badges */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getMealTypeColor(rec.mealType)}>
                          {getMealTypeIcon(rec.mealType)} {rec.mealType}
                        </Badge>
                        <Badge className="bg-slate-100 text-slate-800 border-slate-200">
                          {rec.cuisineType}
                        </Badge>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {rec.priceRange}
                        </Badge>
                        {rec.yelpRating && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            ⭐ {rec.yelpRating}
                          </Badge>
                        )}
                      </div>
                      <RelevanceTooltip
                        score={rec.relevanceScore}
                        reasoning={rec.reasoning}
                        profileReferences={rec.profileReferences}
                      />
                    </div>

                    {/* Location and distance */}
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{rec.location}</span>
                      </div>
                      <span className="text-slate-400">•</span>
                      <span>{rec.distance}</span>
                    </div>

                    {/* Description */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <p className="text-sm text-slate-900 leading-relaxed">
                        {rec.description}
                      </p>
                    </div>

                    {/* Specialties */}
                    {rec.specialties.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Signature Dishes
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {rec.specialties.map((specialty, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-orange-50 text-orange-900 text-xs font-medium rounded-full border border-orange-200"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dietary matches */}
                    {rec.dietaryMatch.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Dietary Accommodations
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {rec.dietaryMatch.map((diet, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-green-50 text-green-900 text-xs font-medium rounded-full border border-green-200"
                            >
                              ✓ {diet}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Yelp link */}
                    {rec.yelpUrl && (
                      <div className="flex items-center justify-between bg-red-50 rounded-lg p-3 border border-red-200">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-red-900">View on Yelp</span>
                          {rec.yelpReviewCount && (
                            <span className="text-xs text-red-700">
                              {rec.yelpReviewCount} reviews
                            </span>
                          )}
                        </div>
                        <a
                          href={rec.yelpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Open <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </IntelligenceCard>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Dining tips */}
      <Card className="bg-amber-50 border-amber-200">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3 text-amber-700">
            <UtensilsCrossed size={20} />
            <h4 className="font-bold">Dining Tips</h4>
          </div>
          <ul className="space-y-2 text-sm text-amber-900">
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0"></span>
              <span>Make reservations at popular restaurants 1-2 weeks in advance</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0"></span>
              <span>Check restaurant hours - some close between lunch and dinner</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0"></span>
              <span>Learn key dietary phrases in the local language</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0"></span>
              <span>Ask locals for recommendations - they know the best spots</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

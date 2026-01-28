"use client"

import { useState, useEffect } from "react"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { UtensilsCrossed, MapPin, DollarSign, Star, ExternalLink } from "lucide-react"
import { IntelligenceQuestionForm, type Question } from "./intelligence-question-form"
import { IntelligenceCard } from "./intelligence-card"
import { RelevanceTooltip, type ProfileReference } from "./relevance-tooltip"
import { Card } from "./card"
import { Badge } from "./badge"

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

type ViewState = 'questions' | 'loading' | 'loaded'

export function DiningView({ itinerary }: DiningViewProps) {
  const [viewState, setViewState] = useState<ViewState>('questions')
  const [recommendations, setRecommendations] = useState<DiningRecommendation[]>([])

  useEffect(() => {
    checkExistingData()
  }, [itinerary.id])

  const checkExistingData = async () => {
    try {
      // Check for existing recommendations in database
      const recsResponse = await fetch(`/api/trip-intelligence/dining?tripId=${itinerary.id}`)
      const recsData = await recsResponse.json()

      if (recsData.recommendations && recsData.recommendations.length > 0) {
        setRecommendations(recsData.recommendations)
        setViewState('loaded')
        return
      }

      // No DB data = show questions (don't auto-generate)
      setViewState('questions')
    } catch (error) {
      console.error('Error checking existing data:', error)
      setViewState('questions')
    }
  }

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

  const generateRecommendations = async (answers: Record<string, string>) => {
    setViewState('loading')

    try {
      const response = await fetch('/api/trip-intelligence/dining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: itinerary.id,
          adventurousness: answers.adventurousness || 'somewhat',
          mealBudget: answers.mealBudget || '$$'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations)
        setViewState('loaded')
      } else {
        setViewState('questions')
        alert('Failed to generate dining recommendations. Please try again.')
      }
    } catch (error) {
      console.error('Error generating recommendations:', error)
      setViewState('questions')
      alert('An error occurred. Please try again.')
    }
  }

  const handleRegenerate = () => {
    setViewState('questions')
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

  if (viewState === 'loading') {
    return (
      <div className="animate-fade-in">
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Finding Perfect Restaurants...</h3>
          <p className="text-slate-600 text-sm">
            Searching for restaurants that match your preferences and dietary needs
          </p>
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

"use client"

import { useState, useEffect } from "react"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { Clock, MapPin, DollarSign, TrendingUp, Sparkles } from "lucide-react"
import { IntelligenceQuestionForm, type Question } from "./intelligence-question-form"
import { IntelligenceCard } from "./intelligence-card"
import { RelevanceTooltip, type ProfileReference } from "./relevance-tooltip"
import { Card } from "./card"
import { Badge } from "./badge"

interface ActivitiesViewProps {
  itinerary: ViewItinerary
}

interface ActivitySuggestion {
  id: string
  dayNumber: number
  timeSlot: string
  gapStartTime: string
  gapEndTime: string
  gapDuration: number
  activityName: string
  activityType: string
  location: string
  estimatedDuration: number
  estimatedCost: string
  viatorUrl: string | null
  viatorRating: number | null
  description: string
  whyRelevant: string
  reasoning: string
  relevanceScore: number
  profileReferences: ProfileReference[]
}

type ViewState = 'questions' | 'loading' | 'loaded'

export function ActivitiesView({ itinerary }: ActivitiesViewProps) {
  const [viewState, setViewState] = useState<ViewState>('questions')
  const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>([])
  const [gapsDetected, setGapsDetected] = useState(0)

  useEffect(() => {
    checkExistingData()
  }, [itinerary.id])

  const checkExistingData = async () => {
    try {
      // Check for existing suggestions in database
      const suggestionsResponse = await fetch(`/api/trip-intelligence/activities?tripId=${itinerary.id}`)
      const suggestionsData = await suggestionsResponse.json()

      if (suggestionsData.suggestions && suggestionsData.suggestions.length > 0) {
        setSuggestions(suggestionsData.suggestions)
        setGapsDetected(suggestionsData.gapsDetected || 0)
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
      id: 'activityPace',
      label: "What's your preferred activity pace?",
      type: 'radio',
      options: [
        { value: 'relaxed', label: 'Relaxed - I like to take it slow' },
        { value: 'moderate', label: 'Moderate - A good balance' },
        { value: 'packed', label: 'Packed - I want to see and do everything!' }
      ]
    },
    {
      id: 'dailyBudget',
      label: 'Budget for activities per day?',
      type: 'radio',
      options: [
        { value: '0-50', label: '$0-50 - Budget-friendly' },
        { value: '50-100', label: '$50-100 - Moderate' },
        { value: '100-200', label: '$100-200 - Premium' },
        { value: '200+', label: '$200+ - Luxury experiences' }
      ]
    }
  ]

  const generateSuggestions = async (answers: Record<string, string>) => {
    setViewState('loading')

    try {
      const response = await fetch('/api/trip-intelligence/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: itinerary.id,
          activityPace: answers.activityPace || 'moderate',
          dailyBudget: answers.dailyBudget || '50-100'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions)
        setGapsDetected(data.gapsDetected || 0)
        setViewState('loaded')
      } else {
        setViewState('questions')
        alert('Failed to generate activity suggestions. Please try again.')
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
      setViewState('questions')
      alert('An error occurred. Please try again.')
    }
  }

  const handleRegenerate = () => {
    setViewState('questions')
  }

  const getTimeSlotColor = (slot: string) => {
    if (slot === 'morning') return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (slot === 'afternoon') return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-indigo-100 text-indigo-800 border-indigo-200'
  }

  const getTimeSlotIcon = (slot: string) => {
    if (slot === 'morning') return '🌅'
    if (slot === 'afternoon') return '☀️'
    return '🌙'
  }

  // Group by day
  const suggestionsByDay = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.dayNumber]) acc[suggestion.dayNumber] = []
    acc[suggestion.dayNumber].push(suggestion)
    return acc
  }, {} as Record<number, ActivitySuggestion[]>)

  if (viewState === 'questions') {
    return (
      <IntelligenceQuestionForm
        title="Activity Suggestions"
        description="Get personalized activity recommendations for your free time."
        questions={questions}
        onSubmit={generateSuggestions}
        loading={false}
      />
    )
  }

  if (viewState === 'loading') {
    return (
      <div className="animate-fade-in">
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Finding Perfect Activities...</h3>
          <p className="text-slate-600 text-sm">
            Detecting free time gaps and matching activities to your interests
          </p>
        </Card>
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className="animate-fade-in">
        <Card className="p-12 text-center">
          <Sparkles className="h-16 w-16 mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Free Time Gaps Found</h3>
          <p className="text-slate-600 text-sm mb-6">
            Your itinerary is fully packed! We look for gaps of 3+ hours to suggest activities.
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
          <h2 className="text-2xl font-bold text-slate-900">Activity Suggestions</h2>
          <p className="text-slate-600 text-sm mt-1">
            {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} for {gapsDetected} free time gap{gapsDetected !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          className="px-4 py-2 text-sm font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors"
        >
          Update Preferences
        </button>
      </div>

      {/* Gap visualization info */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-4">
          <div className="flex items-center gap-2 text-blue-700 mb-2">
            <Clock size={18} />
            <h4 className="font-bold text-sm">Free Time Detected</h4>
          </div>
          <p className="text-sm text-blue-900">
            We found {gapsDetected} time gap{gapsDetected !== 1 ? 's' : ''} of 3+ hours in your itinerary and matched activities to your interests.
          </p>
        </div>
      </Card>

      {/* Suggestions by day */}
      <div className="space-y-8">
        {Object.entries(suggestionsByDay).map(([day, daySuggestions]) => (
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

            {/* Activities for this day */}
            <div className="space-y-4">
              {daySuggestions.map((suggestion) => (
                <IntelligenceCard
                  key={suggestion.id}
                  title={suggestion.activityName}
                  icon={<Sparkles className="h-5 w-5" />}
                  expandable={false}
                >
                  <div className="space-y-4">
                    {/* Header with badges */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getTimeSlotColor(suggestion.timeSlot)}>
                          {getTimeSlotIcon(suggestion.timeSlot)} {suggestion.timeSlot}
                        </Badge>
                        <Badge className="bg-slate-100 text-slate-800 border-slate-200">
                          {suggestion.activityType}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(suggestion.gapStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(suggestion.gapEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          ({suggestion.gapDuration.toFixed(1)}h available)
                        </span>
                      </div>
                      <RelevanceTooltip
                        score={suggestion.relevanceScore}
                        reasoning={suggestion.reasoning}
                        profileReferences={suggestion.profileReferences}
                      />
                    </div>

                    {/* Key details */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <div>
                          <div className="text-xs text-slate-500">Duration</div>
                          <div className="text-sm font-semibold text-slate-900">
                            {suggestion.estimatedDuration}h
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-slate-500" />
                        <div>
                          <div className="text-xs text-slate-500">Cost</div>
                          <div className="text-sm font-semibold text-slate-900">
                            {suggestion.estimatedCost}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <div>
                          <div className="text-xs text-slate-500">Location</div>
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {suggestion.location}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <p className="text-sm text-slate-900 leading-relaxed">
                        {suggestion.description}
                      </p>
                    </div>

                    {/* Why relevant */}
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-green-700 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-green-900 uppercase tracking-wide mb-1">
                            Why This Is Perfect For You
                          </div>
                          <div className="text-sm text-green-900">{suggestion.whyRelevant}</div>
                        </div>
                      </div>
                    </div>

                    {/* Viator link if available */}
                    {suggestion.viatorUrl && (
                      <div className="flex items-center justify-between bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-purple-900">Book on Viator</span>
                          {suggestion.viatorRating && (
                            <span className="text-xs text-purple-700">
                              ⭐ {suggestion.viatorRating}
                            </span>
                          )}
                        </div>
                        <a
                          href={suggestion.viatorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          View Details →
                        </a>
                      </div>
                    )}

                    {/* Profile references */}
                    {suggestion.profileReferences.length > 0 && (
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <div className="text-xs font-semibold text-purple-900 uppercase tracking-wide mb-2">
                          Matched to Your Interests
                        </div>
                        <div className="space-y-1">
                          {suggestion.profileReferences.map((ref, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm text-purple-900">
                              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-600 flex-shrink-0"></span>
                              <span>
                                <strong>{ref.value}:</strong> {ref.relevance}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </IntelligenceCard>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

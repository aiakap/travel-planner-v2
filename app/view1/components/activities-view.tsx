"use client"

import { useState, useEffect, useRef } from "react"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { Clock, MapPin, DollarSign, TrendingUp, Sparkles, Loader2 } from "lucide-react"
import { IntelligenceQuestionForm, type Question } from "./intelligence-question-form"
import { IntelligenceCard } from "./intelligence-card"
import { RelevanceTooltip, type ProfileReference } from "./relevance-tooltip"
import { Card } from "./card"
import { Badge } from "./badge"
import { useCachedIntelligence } from "../hooks/use-cached-intelligence"
import { IntelligenceLoading } from "./intelligence-loading"

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

type ViewState = 'questions' | 'generating' | 'loaded'

// Simple sessionStorage key
const getGeneratingKey = (tripId: string) => `activities_generating_${tripId}`

export function ActivitiesView({ itinerary }: ActivitiesViewProps) {
  const { data, initialCheckComplete, updateCache } = useCachedIntelligence<{ suggestions: ActivitySuggestion[], gapsDetected?: number }>(
    'activities',
    itinerary.id,
    '/api/trip-intelligence/activities'
  )

  const [viewState, setViewState] = useState<ViewState>('questions')
  const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>([])
  const [gapsDetected, setGapsDetected] = useState(0)

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
      const res = await fetch(`/api/trip-intelligence/activities?tripId=${itinerary.id}`)
      const apiData = await res.json()
      
      if (apiData.suggestions && apiData.suggestions.length > 0) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        
        try {
          sessionStorage.removeItem(getGeneratingKey(itinerary.id))
        } catch (e) {}
        
        setSuggestions(apiData.suggestions)
        setGapsDetected(apiData.gapsDetected || 0)
        updateCache({ suggestions: apiData.suggestions, gapsDetected: apiData.gapsDetected || 0 })
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
    if (data?.suggestions && data.suggestions.length > 0) {
      setSuggestions(data.suggestions)
      setGapsDetected(data.gapsDetected || 0)
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

  // Fire-and-forget generate function
  const generateSuggestions = async (answers: Record<string, string>) => {
    setViewState('generating')
    
    try {
      sessionStorage.setItem(getGeneratingKey(itinerary.id), 'true')
    } catch (e) {}

    fetch('/api/trip-intelligence/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: itinerary.id,
        activityPace: answers.activityPace || 'moderate',
        dailyBudget: answers.dailyBudget || '50-100'
      })
    }).catch(err => {
      console.error('POST error:', err)
    })

    startPolling()
  }

  const handleRegenerate = async () => {
    try {
      await fetch(`/api/trip-intelligence/activities?tripId=${itinerary.id}`, {
        method: 'DELETE'
      })
    } catch (e) {
      console.error('Failed to clear activity suggestions:', e)
    }
    
    setSuggestions([])
    setGapsDetected(0)
    setViewState('questions')
  }

  // Show loading while checking cache
  if (!initialCheckComplete) {
    return <IntelligenceLoading feature="activities" mode="checking" />
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

  if (viewState === 'generating') {
    return (
      <div className="animate-fade-in">
        <Card className="p-8 text-center bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-orange-100 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-orange-600 animate-spin" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Finding Perfect Activities...
          </h3>
          
          <p className="text-slate-600 text-sm mb-4">
            Detecting free time gaps and matching activities to your interests
          </p>
          
          <div className="bg-white/60 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-orange-700 font-medium mb-1">
              Feel free to explore other tabs!
            </p>
            <p className="text-xs text-slate-500">
              Your activity suggestions will be ready when you return.
            </p>
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
            <span>Generation in progress</span>
          </div>
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

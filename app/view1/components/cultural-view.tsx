"use client"

import { useState, useEffect, useRef } from "react"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { Calendar, Sparkles, Users, AlertCircle, Camera, Loader2 } from "lucide-react"
import { IntelligenceQuestionForm, type Question } from "./intelligence-question-form"
import { IntelligenceCard } from "./intelligence-card"
import { RelevanceTooltip, type ProfileReference } from "./relevance-tooltip"
import { Card } from "./card"
import { Badge } from "./badge"
import { useCachedIntelligence } from "../hooks/use-cached-intelligence"
import { IntelligenceLoading } from "./intelligence-loading"

interface CulturalViewProps {
  itinerary: ViewItinerary
}

interface CulturalEvent {
  id: string
  destination: string
  eventName: string
  eventType: string
  date: string
  description: string
  impact: string
  recommendation: string
  reasoning: string
  relevanceScore: number
  profileReferences: ProfileReference[]
}

type ViewState = 'questions' | 'generating' | 'loaded'

// Simple sessionStorage key
const getGeneratingKey = (tripId: string) => `cultural_generating_${tripId}`

export function CulturalView({ itinerary }: CulturalViewProps) {
  const { data, initialCheckComplete, updateCache } = useCachedIntelligence<{ events: CulturalEvent[] }>(
    'cultural',
    itinerary.id,
    '/api/trip-intelligence/cultural'
  )

  const [viewState, setViewState] = useState<ViewState>('questions')
  const [events, setEvents] = useState<CulturalEvent[]>([])

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
      const res = await fetch(`/api/trip-intelligence/cultural?tripId=${itinerary.id}`)
      const apiData = await res.json()
      
      if (apiData.events && apiData.events.length > 0) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        
        try {
          sessionStorage.removeItem(getGeneratingKey(itinerary.id))
        } catch (e) {}
        
        setEvents(apiData.events)
        updateCache({ events: apiData.events })
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
    if (data?.events && data.events.length > 0) {
      setEvents(data.events)
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
      id: 'interestedInEvents',
      label: 'Are you interested in attending local festivals and events?',
      type: 'radio',
      options: [
        { value: 'true', label: 'Yes, I love experiencing local culture' },
        { value: 'false', label: 'No, I prefer quieter experiences' }
      ]
    },
    {
      id: 'crowdPreference',
      label: 'How do you feel about crowds?',
      type: 'radio',
      options: [
        { value: 'avoid', label: 'Avoid crowds - I prefer quiet places' },
        { value: 'flexible', label: 'Flexible - depends on the experience' },
        { value: 'embrace', label: 'Embrace crowds - the energy is exciting!' }
      ]
    }
  ]

  // Fire-and-forget generate function
  const generateEvents = async (answers: Record<string, string>) => {
    setViewState('generating')
    
    try {
      sessionStorage.setItem(getGeneratingKey(itinerary.id), 'true')
    } catch (e) {}

    fetch('/api/trip-intelligence/cultural', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: itinerary.id,
        interestedInEvents: answers.interestedInEvents === 'true',
        crowdPreference: answers.crowdPreference || 'flexible'
      })
    }).catch(err => {
      console.error('POST error:', err)
    })

    startPolling()
  }

  const handleRegenerate = async () => {
    try {
      await fetch(`/api/trip-intelligence/cultural?tripId=${itinerary.id}`, {
        method: 'DELETE'
      })
    } catch (e) {
      console.error('Failed to clear cultural events:', e)
    }
    
    setEvents([])
    setViewState('questions')
  }

  // Show loading while checking cache
  if (!initialCheckComplete) {
    return <IntelligenceLoading feature="cultural" mode="checking" />
  }

  const getEventTypeColor = (type: string) => {
    if (type.includes('Holiday')) return 'bg-red-100 text-red-800 border-red-200'
    if (type.includes('Festival')) return 'bg-purple-100 text-purple-800 border-purple-200'
    if (type.includes('Religious')) return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }

  const getEventTypeIcon = (type: string) => {
    if (type.includes('Holiday')) return '🎉'
    if (type.includes('Festival')) return '🎊'
    if (type.includes('Religious')) return '🕌'
    return '🎭'
  }

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const date = new Date(event.date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {} as Record<string, CulturalEvent[]>)

  if (viewState === 'questions') {
    return (
      <IntelligenceQuestionForm
        title="Cultural Calendar"
        description="Discover holidays, festivals, and cultural events during your trip."
        questions={questions}
        onSubmit={generateEvents}
        loading={false}
      />
    )
  }

  if (viewState === 'generating') {
    return (
      <div className="animate-fade-in">
        <Card className="p-8 text-center bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-purple-100 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Finding Cultural Events...
          </h3>
          
          <p className="text-slate-600 text-sm mb-4">
            Searching for holidays, festivals, and special events during your trip
          </p>
          
          <div className="bg-white/60 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-purple-700 font-medium mb-1">
              Feel free to explore other tabs!
            </p>
            <p className="text-xs text-slate-500">
              Your cultural calendar will be ready when you return.
            </p>
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
            <span>Generation in progress</span>
          </div>
        </Card>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="animate-fade-in">
        <Card className="p-12 text-center">
          <Calendar className="h-16 w-16 mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Major Events Found</h3>
          <p className="text-slate-600 text-sm mb-6">
            There are no major holidays or festivals during your travel dates.
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
          <h2 className="text-2xl font-bold text-slate-900">Cultural Calendar</h2>
          <p className="text-slate-600 text-sm mt-1">
            {events.length} event{events.length !== 1 ? 's' : ''} during your trip
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          className="px-4 py-2 text-sm font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors"
        >
          Update Preferences
        </button>
      </div>

      {/* Timeline view */}
      <div className="space-y-8">
        {Object.entries(eventsByDate).map(([date, dateEvents]) => (
          <div key={date} className="relative">
            {/* Date header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-purple-100 rounded-lg px-4 py-2 border border-purple-200">
                <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                  {date}
                </div>
              </div>
              <div className="flex-1 h-px bg-purple-200"></div>
            </div>

            {/* Events for this date */}
            <div className="space-y-4">
              {dateEvents.map((event) => (
                <IntelligenceCard
                  key={event.id}
                  title={event.eventName}
                  icon={<span className="text-xl">{getEventTypeIcon(event.eventType)}</span>}
                  expandable={false}
                >
                  <div className="space-y-4">
                    {/* Header with badges */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getEventTypeColor(event.eventType)}>
                          {event.eventType}
                        </Badge>
                        <span className="text-sm text-slate-600">{event.destination}</span>
                      </div>
                      <RelevanceTooltip
                        score={event.relevanceScore}
                        reasoning={event.reasoning}
                        profileReferences={event.profileReferences}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <div className="text-sm text-slate-900 leading-relaxed">
                        {event.description}
                      </div>
                    </div>

                    {/* Impact */}
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-700 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-yellow-900 uppercase tracking-wide mb-1">
                            Impact on Your Trip
                          </div>
                          <div className="text-sm text-yellow-900">{event.impact}</div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-green-700 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-green-900 uppercase tracking-wide mb-1">
                            Our Recommendation
                          </div>
                          <div className="text-sm text-green-900">{event.recommendation}</div>
                        </div>
                      </div>
                    </div>

                    {/* Profile references */}
                    {event.profileReferences.length > 0 && (
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <div className="text-xs font-semibold text-purple-900 uppercase tracking-wide mb-2">
                          Why This Matters to You
                        </div>
                        <div className="space-y-1">
                          {event.profileReferences.map((ref, idx) => (
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

      {/* Tips */}
      <Card className="bg-indigo-50 border-indigo-200">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3 text-indigo-700">
            <Camera size={20} />
            <h4 className="font-bold">Cultural Event Tips</h4>
          </div>
          <ul className="space-y-2 text-sm text-indigo-900">
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0"></span>
              <span>Book accommodations and restaurants well in advance during major events</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0"></span>
              <span>Arrive early to popular events to secure good viewing spots</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0"></span>
              <span>Research dress codes and cultural etiquette for religious events</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0"></span>
              <span>Keep valuables secure in crowded festival areas</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

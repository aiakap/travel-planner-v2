"use client"

import { useState, useEffect } from "react"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { Calendar, Sparkles, Users, AlertCircle, Camera } from "lucide-react"
import { IntelligenceQuestionForm, type Question } from "./intelligence-question-form"
import { IntelligenceCard } from "./intelligence-card"
import { RelevanceTooltip, type ProfileReference } from "./relevance-tooltip"
import { Card } from "./card"
import { Badge } from "./badge"

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

type ViewState = 'questions' | 'loading' | 'loaded'

export function CulturalView({ itinerary }: CulturalViewProps) {
  const [viewState, setViewState] = useState<ViewState>('questions')
  const [events, setEvents] = useState<CulturalEvent[]>([])

  useEffect(() => {
    checkExistingData()
  }, [itinerary.id])

  const checkExistingData = async () => {
    try {
      // Check for existing events in database
      const eventsResponse = await fetch(`/api/trip-intelligence/cultural?tripId=${itinerary.id}`)
      const eventsData = await eventsResponse.json()

      if (eventsData.events && eventsData.events.length > 0) {
        setEvents(eventsData.events)
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

  const generateEvents = async (answers: Record<string, string>) => {
    setViewState('loading')

    try {
      const response = await fetch('/api/trip-intelligence/cultural', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: itinerary.id,
          interestedInEvents: answers.interestedInEvents === 'true',
          crowdPreference: answers.crowdPreference || 'flexible'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
        setViewState('loaded')
      } else {
        setViewState('questions')
        alert('Failed to generate cultural calendar. Please try again.')
      }
    } catch (error) {
      console.error('Error generating events:', error)
      setViewState('questions')
      alert('An error occurred. Please try again.')
    }
  }

  const handleRegenerate = () => {
    setViewState('questions')
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

  if (viewState === 'loading') {
    return (
      <div className="animate-fade-in">
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Finding Cultural Events...</h3>
          <p className="text-slate-600 text-sm">
            Searching for holidays, festivals, and special events during your trip
          </p>
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

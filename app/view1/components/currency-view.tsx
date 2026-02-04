"use client"

import { useState, useEffect, useRef } from "react"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { DollarSign, CreditCard, MapPin, TrendingUp, AlertCircle, Loader2 } from "lucide-react"
import { IntelligenceQuestionForm, type Question } from "./intelligence-question-form"
import { IntelligenceCard, IntelligenceCardItem } from "./intelligence-card"
import { RelevanceTooltip, type ProfileReference } from "./relevance-tooltip"
import { Card } from "./card"
import { useCachedIntelligence } from "../hooks/use-cached-intelligence"
import { IntelligenceLoading } from "./intelligence-loading"

interface CurrencyViewProps {
  itinerary: ViewItinerary
}

interface CurrencyAdvice {
  id: string
  destination: string
  currency: string
  exchangeRate: number
  baseCurrency: string
  tippingCustom: string
  atmLocations: string
  cardAcceptance: string
  cashRecommendation: string
  reasoning: string
  relevanceScore: number
  profileReferences: ProfileReference[]
}

type ViewState = 'questions' | 'generating' | 'loaded'

// Simple sessionStorage key
const getGeneratingKey = (tripId: string) => `currency_generating_${tripId}`

export function CurrencyView({ itinerary }: CurrencyViewProps) {
  const { data, initialCheckComplete, updateCache } = useCachedIntelligence<{ advice: CurrencyAdvice[] }>(
    'currency',
    itinerary.id,
    '/api/trip-intelligence/currency'
  )

  const [viewState, setViewState] = useState<ViewState>('questions')
  const [advice, setAdvice] = useState<CurrencyAdvice[]>([])

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
      const res = await fetch(`/api/trip-intelligence/currency?tripId=${itinerary.id}`)
      const apiData = await res.json()
      
      if (apiData.advice && apiData.advice.length > 0) {
        // Stop polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        
        // Clear generating flag
        try {
          sessionStorage.removeItem(getGeneratingKey(itinerary.id))
        } catch (e) {}
        
        // Display data
        setAdvice(apiData.advice)
        updateCache({ advice: apiData.advice })
        setViewState('loaded')
        return
      }
      
      // Safety: stop after 5 minutes
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

  // Start polling
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
    if (data?.advice && data.advice.length > 0) {
      setAdvice(data.advice)
      setViewState('loaded')
      try {
        sessionStorage.removeItem(getGeneratingKey(itinerary.id))
      } catch (e) {}
      return
    }
    
    // Check if we were generating
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
      id: 'citizenship',
      label: 'What is your citizenship/passport country?',
      type: 'select',
      options: [
        { value: 'USA', label: 'United States' },
        { value: 'Canada', label: 'Canada' },
        { value: 'UK', label: 'United Kingdom' },
        { value: 'Australia', label: 'Australia' },
        { value: 'Germany', label: 'Germany' },
        { value: 'France', label: 'France' },
        { value: 'Japan', label: 'Japan' },
        { value: 'China', label: 'China' },
        { value: 'India', label: 'India' },
        { value: 'Other', label: 'Other' }
      ]
    },
    {
      id: 'residence',
      label: 'What is your country of residence?',
      type: 'select',
      options: [
        { value: 'USA', label: 'United States' },
        { value: 'Canada', label: 'Canada' },
        { value: 'UK', label: 'United Kingdom' },
        { value: 'Australia', label: 'Australia' },
        { value: 'Germany', label: 'Germany' },
        { value: 'France', label: 'France' },
        { value: 'Japan', label: 'Japan' },
        { value: 'China', label: 'China' },
        { value: 'India', label: 'India' },
        { value: 'Other', label: 'Other' }
      ]
    }
  ]

  // Fire-and-forget generate function
  const generateAdvice = async (answers: Record<string, string>) => {
    setViewState('generating')
    
    try {
      sessionStorage.setItem(getGeneratingKey(itinerary.id), 'true')
    } catch (e) {}

    // Fire and forget - don't await
    fetch('/api/trip-intelligence/currency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: itinerary.id,
        citizenship: answers.citizenship,
        residence: answers.residence
      })
    }).catch(err => {
      console.error('POST error:', err)
    })

    startPolling()
  }

  const handleRegenerate = async () => {
    // Clear data from database first
    try {
      await fetch(`/api/trip-intelligence/currency?tripId=${itinerary.id}`, {
        method: 'DELETE'
      })
    } catch (e) {
      console.error('Failed to clear currency advice:', e)
    }
    
    setAdvice([])
    setViewState('questions')
  }
  
  // Show loading while checking cache
  if (!initialCheckComplete) {
    return <IntelligenceLoading feature="currency" mode="checking" />
  }

  if (viewState === 'questions') {
    return (
      <IntelligenceQuestionForm
        title="Currency & Money Advice"
        description="Help us provide personalized currency and payment recommendations for your trip."
        questions={questions}
        onSubmit={generateAdvice}
        loading={false}
      />
    )
  }

  if (viewState === 'generating') {
    return (
      <div className="animate-fade-in">
        <Card className="p-8 text-center bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-green-100 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-green-600 animate-spin" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Analyzing Currency Needs...
          </h3>
          
          <p className="text-slate-600 text-sm mb-4">
            Fetching exchange rates and generating personalized money advice
          </p>
          
          <div className="bg-white/60 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-green-700 font-medium mb-1">
              Feel free to explore other tabs!
            </p>
            <p className="text-xs text-slate-500">
              Your currency advice will be ready when you return.
            </p>
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span>Generation in progress</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header with regenerate */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Currency & Money Advice</h2>
          <p className="text-slate-600 text-sm mt-1">Personalized financial guidance for your destinations</p>
        </div>
        <button
          onClick={handleRegenerate}
          className="px-4 py-2 text-sm font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors"
        >
          Update Preferences
        </button>
      </div>

      {/* Advice cards per destination */}
      <div className="space-y-6">
        {advice.map((item) => (
          <IntelligenceCard
            key={item.id}
            title={`${item.destination} - ${item.currency}`}
            icon={<DollarSign className="h-5 w-5" />}
            expandable={false}
          >
            <div className="space-y-6">
              {/* Exchange Rate */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                      Current Exchange Rate
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      1 {item.baseCurrency} = {item.exchangeRate.toFixed(2)} {item.currency}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RelevanceTooltip
                      score={item.relevanceScore}
                      reasoning={item.reasoning}
                      profileReferences={item.profileReferences}
                    />
                  </div>
                </div>
              </div>

              {/* Advice sections */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <IntelligenceCardItem
                    label="💳 Credit Card Acceptance"
                    value={item.cardAcceptance}
                    expandable={true}
                  />
                  
                  <IntelligenceCardItem
                    label="🏧 ATM Locations & Fees"
                    value={item.atmLocations}
                    expandable={true}
                  />
                </div>

                <div className="space-y-3">
                  <IntelligenceCardItem
                    label="💵 Cash Recommendation"
                    value={item.cashRecommendation}
                    expandable={true}
                  />
                  
                  <IntelligenceCardItem
                    label="🎁 Tipping Customs"
                    value={item.tippingCustom}
                    expandable={true}
                  />
                </div>
              </div>

              {/* Profile references */}
              {item.profileReferences.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <div className="text-xs font-semibold text-purple-900 uppercase tracking-wide">
                      Based On Your Profile
                    </div>
                  </div>
                  <div className="space-y-2">
                    {item.profileReferences.map((ref, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-600 flex-shrink-0"></div>
                        <div>
                          <span className="font-semibold text-purple-900">{ref.category}: {ref.value}</span>
                          <span className="text-purple-700"> - {ref.relevance}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </IntelligenceCard>
        ))}
      </div>

      {/* General tips */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3 text-blue-700">
            <AlertCircle size={20} />
            <h4 className="font-bold">General Money Tips</h4>
          </div>
          <ul className="space-y-2 text-sm text-blue-900">
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0"></span>
              <span>Notify your bank and credit card companies of your travel dates to avoid card blocks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0"></span>
              <span>Take photos of your cards (front and back) and store securely in case of loss</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0"></span>
              <span>Use ATMs inside banks during business hours for better security</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0"></span>
              <span>Keep emergency cash in a separate location from your main wallet</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

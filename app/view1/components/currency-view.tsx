"use client"

import { useState, useEffect } from "react"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { DollarSign, CreditCard, MapPin, TrendingUp, AlertCircle } from "lucide-react"
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

type ViewState = 'questions' | 'loading' | 'loaded'

export function CurrencyView({ itinerary }: CurrencyViewProps) {
  const { data, initialCheckComplete, invalidateCache, updateCache } = useCachedIntelligence<{ advice: CurrencyAdvice[] }>(
    'currency',
    itinerary.id,
    '/api/trip-intelligence/currency'
  )

  const [viewState, setViewState] = useState<ViewState>('questions')
  const [advice, setAdvice] = useState<CurrencyAdvice[]>([])

  // Sync with cached data
  useEffect(() => {
    if (data?.advice && data.advice.length > 0) {
      setAdvice(data.advice)
      setViewState('loaded')
    } else if (initialCheckComplete) {
      setViewState('questions')
    }
  }, [data, initialCheckComplete])

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

  const generateAdvice = async (answers: Record<string, string>) => {
    setViewState('loading')

    try {
      const response = await fetch('/api/trip-intelligence/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: itinerary.id,
          citizenship: answers.citizenship,
          residence: answers.residence
        })
      })

      if (response.ok) {
        const responseData = await response.json()
        setAdvice(responseData.advice)
        updateCache({ advice: responseData.advice }) // Update the cache
        setViewState('loaded')
      } else {
        setViewState('questions')
        alert('Failed to generate currency advice. Please try again.')
      }
    } catch (error) {
      console.error('Error generating advice:', error)
      setViewState('questions')
      alert('An error occurred. Please try again.')
    }
  }

  const handleRegenerate = () => {
    invalidateCache() // Clear cache when regenerating
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

  if (viewState === 'loading') {
    return (
      <div className="animate-fade-in">
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Analyzing Currency Needs...</h3>
          <p className="text-slate-600 text-sm">
            Fetching exchange rates and generating personalized money advice
          </p>
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

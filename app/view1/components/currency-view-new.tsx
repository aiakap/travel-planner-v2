"use client"

import { useState, useEffect } from "react"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { DollarSign, CreditCard, Landmark, TrendingUp, AlertCircle, ExternalLink } from "lucide-react"
import { IntelligenceQuestionForm, type Question } from "./intelligence-question-form"
import { IntelligenceSection, IntelligenceSectionGroup, type IntelligenceItem, type Source } from "./intelligence-section"
import { Card } from "./card"

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
  profileReferences: any[]
  sources?: Source[]
}

type ViewState = 'questions' | 'loading' | 'loaded'

export function CurrencyView({ itinerary }: CurrencyViewProps) {
  const [viewState, setViewState] = useState<ViewState>('questions')
  const [advice, setAdvice] = useState<CurrencyAdvice[]>([])
  const [savedPreferences, setSavedPreferences] = useState<Record<string, string> | null>(null)
  const [globalSources, setGlobalSources] = useState<Source[]>([])

  useEffect(() => {
    checkExistingData()
  }, [itinerary.id])

  const checkExistingData = async () => {
    try {
      // Check for existing advice in database
      const adviceResponse = await fetch(`/api/trip-intelligence/currency?tripId=${itinerary.id}`)
      const adviceData = await adviceResponse.json()

      if (adviceData.advice && adviceData.advice.length > 0) {
        setAdvice(adviceData.advice)
        setViewState('loaded')
        return
      }

      // Load saved preferences to pre-fill questions
      try {
        const prefsResponse = await fetch('/api/profile/intelligence-preferences')
        const prefsData = await prefsResponse.json()
        if (prefsData.preferences?.currency) {
          setSavedPreferences(prefsData.preferences.currency)
        }
      } catch (prefError) {
        console.error('Error loading preferences:', prefError)
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
        const data = await response.json()
        setAdvice(data.advice)
        if (data.sources) {
          setGlobalSources(data.sources)
        }
        setViewState('loaded')
      } else {
        const errorData = await response.json()
        setViewState('questions')
        alert(`Failed to generate currency advice: ${errorData.error || 'Please try again.'}`)
      }
    } catch (error) {
      console.error('Error generating advice:', error)
      setViewState('questions')
      alert('An error occurred while generating currency advice. Please check your internet connection and try again.')
    }
  }

  const handleRegenerate = () => {
    setViewState('questions')
  }

  if (viewState === 'questions') {
    return (
      <IntelligenceQuestionForm
        title="Currency & Money Advice"
        description="We'll provide real-time exchange rates from ExchangeRate-API, ATM locations, tipping customs, and payment recommendations for each destination. All data is sourced from official APIs and government resources."
        questions={questions}
        onSubmit={generateAdvice}
        loading={false}
        defaultValues={savedPreferences || undefined}
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
            Fetching real-time exchange rates and generating personalized money advice
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

      {/* Advice per destination */}
      {advice.map((item) => {
        // Exchange Rate Section
        const exchangeRateItems: IntelligenceItem[] = [
          {
            label: "Current Exchange Rate",
            value: `1 ${item.baseCurrency} = ${item.exchangeRate.toFixed(2)} ${item.currency}`,
            reasoning: `Real-time rate from ExchangeRate-API. Updated ${new Date().toLocaleDateString()}`,
            source: "https://exchangerate-api.com",
            expandable: true
          }
        ]

        // Payment Methods Section
        const paymentMethodsItems: IntelligenceItem[] = [
          {
            label: "Credit Card Acceptance",
            value: item.cardAcceptance.split('.')[0] || item.cardAcceptance,
            reasoning: item.cardAcceptance,
            expandable: true
          },
          {
            label: "ATM Locations & Fees",
            value: item.atmLocations.split('.')[0] || item.atmLocations,
            reasoning: item.atmLocations,
            expandable: true
          },
          {
            label: "Daily Cash Recommendation",
            value: item.cashRecommendation.split('.')[0] || item.cashRecommendation,
            reasoning: item.cashRecommendation,
            expandable: true
          }
        ]

        // Local Customs Section
        const localCustomsItems: IntelligenceItem[] = [
          {
            label: "Tipping Guidelines",
            value: item.tippingCustom.split('.')[0] || item.tippingCustom,
            reasoning: item.tippingCustom,
            expandable: true
          }
        ]

        const destinationSources: Source[] = item.sources || []

        return (
          <div key={item.id} className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              {item.destination}
            </h3>

            <IntelligenceSectionGroup>
              <IntelligenceSection
                title="Exchange Rate"
                icon={<TrendingUp size={20} />}
                items={exchangeRateItems}
                sources={destinationSources.length > 0 ? destinationSources : globalSources}
              />

              <IntelligenceSection
                title="Payment Methods"
                icon={<CreditCard size={20} />}
                items={paymentMethodsItems}
              />

              <IntelligenceSection
                title="Local Customs"
                icon={<Landmark size={20} />}
                items={localCustomsItems}
              />
            </IntelligenceSectionGroup>
          </div>
        )
      })}

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

      {/* Global Sources */}
      {globalSources.length > 0 && (
        <Card className="bg-slate-50">
          <div className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Data Sources
            </div>
            <div className="flex flex-wrap gap-2">
              {globalSources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 transition-colors"
                  title={source.timestamp ? `Updated: ${new Date(source.timestamp).toLocaleString()}` : undefined}
                >
                  <span>{source.name}</span>
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

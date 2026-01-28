"use client"

import { useState, useEffect } from "react"
import type { ViewItinerary, PackingList } from "@/lib/itinerary-view-types"
import { Backpack, Shirt, Footprints, ShieldCheck, Heart, FileText, RefreshCw, Sparkles, Luggage, Lightbulb, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Card } from "./card"
import { Badge } from "./badge"
import { IntelligenceQuestionForm, type Question } from "./intelligence-question-form"

interface PackingViewProps {
  itinerary: ViewItinerary
  profileValues: any[]
}

type ViewState = 'questions' | 'loading' | 'loaded'

export function PackingView({ itinerary, profileValues }: PackingViewProps) {
  const [packingList, setPackingList] = useState<PackingList | null>(null)
  const [viewState, setViewState] = useState<ViewState>('questions')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Packing list is generated on-demand, no DB persistence yet
    // Always start with questions state
    setViewState('questions')
  }, [])

  const questions: Question[] = [
    {
      id: 'packingStyle',
      label: 'Do you prefer to pack light or bring everything?',
      type: 'radio',
      options: [
        { value: 'light', label: 'Light packer - Minimalist approach' },
        { value: 'moderate', label: 'Moderate - Balanced packing' },
        { value: 'everything', label: 'Bring everything - Better safe than sorry!' }
      ]
    },
    {
      id: 'hasGear',
      label: 'Do you own travel-specific gear?',
      type: 'radio',
      options: [
        { value: 'lots', label: 'Yes, lots of gear (packing cubes, travel bags, etc.)' },
        { value: 'some', label: 'Some basics (backpack, toiletry bag)' },
        { value: 'none', label: 'No, I use regular items' }
      ]
    }
  ]
  
  const toggleItemExpansion = (itemKey: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemKey)) {
        next.delete(itemKey)
      } else {
        next.add(itemKey)
      }
      return next
    })
  }
  
  const generatePackingList = async (answers: Record<string, string>) => {
    setViewState('loading')
    
    try {
      // Fetch weather data first
      const weatherPromises = itinerary.segments.map(seg =>
        fetch('/api/weather/forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            lat: seg.endLat, 
            lng: seg.endLng,
            dates: { start: seg.startDate, end: seg.endDate }
          })
        }).then(r => r.json()).catch(() => null)
      )
      
      const weatherData = await Promise.all(weatherPromises)
      
      // Generate packing list with preferences
      const response = await fetch('/api/packing/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip: itinerary,
          profile: profileValues,
          weather: weatherData.filter(Boolean),
          packingStyle: answers.packingStyle || preferences?.packingStyle,
          hasGear: answers.hasGear || preferences?.hasGear
        })
      })
      
      if (response.ok) {
        const list = await response.json()
        setPackingList(list)
        setViewState('loaded')
      } else {
        setViewState('questions')
        alert('Failed to generate packing list. Please try again.')
      }
    } catch (error) {
      console.error('Failed to generate packing list:', error)
      setViewState('questions')
      alert('An error occurred. Please try again.')
    }
  }

  const handleRegenerate = () => {
    setViewState('questions')
  }
  
  // Questions state
  if (viewState === 'questions') {
    return (
      <IntelligenceQuestionForm
        title="Packing List"
        description="Tell us about your packing style so we can provide personalized recommendations."
        questions={questions}
        onSubmit={generatePackingList}
        loading={false}
      />
    )
  }
  
  // Loading state
  if (viewState === 'loading') {
    return (
      <div className="animate-fade-in">
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Generating Packing List...</h3>
          <p className="text-slate-600 text-sm">
            Analyzing your trip, activities, and weather forecast
          </p>
        </Card>
      </div>
    )
  }
  
  // Loaded state - show results
  if (!packingList) {
    return null
  }
  
  const categories = [
    { title: "Clothing", icon: Shirt, items: packingList.clothing || [] },
    { title: "Footwear", icon: Footprints, items: packingList.footwear || [] },
    { title: "Gear", icon: ShieldCheck, items: packingList.gear || [] },
    { title: "Toiletries", icon: Heart, items: packingList.toiletries || [] },
    { title: "Essentials", icon: FileText, items: packingList.documents || [] },
  ].filter(cat => cat.items.length > 0)
  
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Packing List</h2>
          <p className="text-slate-600 text-sm mt-1">Personalized packing recommendations</p>
        </div>
        <button
          onClick={handleRegenerate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Update Preferences
        </button>
      </div>
      
      {/* Special Notes Section */}
      {packingList.specialNotes && packingList.specialNotes.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3 text-blue-700">
              <AlertCircle size={20} />
              <h4 className="font-bold">Special Notes for Your Trip</h4>
            </div>
            <ul className="space-y-2">
              {packingList.specialNotes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-blue-900">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0"></span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
      
      {/* Packing Items Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.title} className="h-full">
            <div className="p-5 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4 text-blue-600">
                <category.icon size={20} />
                <h4 className="font-bold text-slate-900">{category.title}</h4>
              </div>
              <ul className="space-y-3 flex-grow">
                {category.items.map((item, idx) => {
                  const itemKey = `${category.title}-${idx}`
                  const isExpanded = expandedItems.has(itemKey)
                  const hasReason = item.reason && item.reason.length > 0
                  
                  return (
                    <li key={idx} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div 
                        className={`flex items-start gap-3 group ${hasReason ? 'cursor-pointer' : ''}`}
                        onClick={() => hasReason && toggleItemExpansion(itemKey)}
                      >
                        <div className="mt-0.5 w-4 h-4 rounded border border-slate-300 group-hover:border-blue-500 transition-colors flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-sm bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium text-slate-900">
                              {item.name}
                              {item.quantity && <span className="text-slate-500 font-normal"> ({item.quantity})</span>}
                            </span>
                            {hasReason && (
                              <button className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            )}
                          </div>
                          {hasReason && isExpanded && (
                            <p className="mt-2 text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded">
                              {item.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      {/* Luggage Strategy Section - MOVED TO BOTTOM */}
      {packingList.luggageStrategy && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4 text-purple-700">
              <Luggage size={20} />
              <h4 className="font-bold">Luggage Strategy</h4>
            </div>
            
            {/* Recommended Bags */}
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-slate-700 mb-2">Recommended Bags:</h5>
              <div className="space-y-2">
                {packingList.luggageStrategy.bags.map((bag, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <Badge className="bg-purple-600 text-white flex-shrink-0">{bag.type}</Badge>
                    <span className="text-slate-700">{bag.reason}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Organization Strategy */}
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-slate-700 mb-2">Organization Strategy:</h5>
              <p className="text-sm text-slate-700 leading-relaxed">{packingList.luggageStrategy.organization}</p>
            </div>
            
            {/* Packing Tips */}
            {packingList.luggageStrategy.tips && packingList.luggageStrategy.tips.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={16} className="text-yellow-600" />
                  <h5 className="text-sm font-semibold text-slate-700">Expert Packing Tips:</h5>
                </div>
                <ul className="space-y-1.5">
                  {packingList.luggageStrategy.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-yellow-600 flex-shrink-0"></span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

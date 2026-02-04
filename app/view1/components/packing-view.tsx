"use client"

import { useState, useEffect, useRef } from "react"
import type { ViewItinerary, PackingList } from "@/lib/itinerary-view-types"
import { Shirt, Footprints, ShieldCheck, Heart, FileText, RefreshCw, Luggage, Lightbulb, AlertCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { Card } from "./card"
import { Badge } from "./badge"
import { IntelligenceQuestionForm, type Question } from "./intelligence-question-form"
import { useCachedIntelligence } from "../hooks/use-cached-intelligence"
import { IntelligenceLoading } from "./intelligence-loading"

interface PackingViewProps {
  itinerary: ViewItinerary
  profileValues: any[]
}

type ViewState = 'questions' | 'generating' | 'loaded'

// Simple sessionStorage key - just tracks if we're generating
const getGeneratingKey = (tripId: string) => `packing_generating_${tripId}`

// Helper to transform API response to packing list format
function transformApiResponse(apiData: any): PackingList | null {
  if (!apiData?.packingList) {
    return null
  }
  
  const categorizedList: any = {
    clothing: [],
    footwear: [],
    gear: [],
    toiletries: [],
    documents: [],
    specialNotes: [],
    luggageStrategy: null
  }
  
  // API returns { packingList: { Clothing: [...], Toiletries: [...], ... } }
  const categoryMap: Record<string, string> = {
    'Clothing': 'clothing',
    'Footwear': 'footwear',
    'Activity Gear': 'gear',
    'Electronics': 'gear',
    'Toiletries': 'toiletries',
    'Documents': 'documents',
    'Health & Safety': 'gear',
    'Miscellaneous': 'gear'
  }
  
  Object.entries(apiData.packingList).forEach(([category, items]: [string, any]) => {
    const mappedCategory = categoryMap[category] || 'gear'
    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        categorizedList[mappedCategory].push({
          name: item.itemName,
          quantity: item.quantity,
          reason: item.reason,
          priority: item.priority
        })
      })
    }
  })
  
  return categorizedList
}

export function PackingView({ itinerary, profileValues }: PackingViewProps) {
  const { data, initialCheckComplete, invalidateCache, updateCache } = useCachedIntelligence<{ items: any[] }>(
    'packing',
    itinerary.id,
    '/api/trip-intelligence/packing'
  )

  const [packingList, setPackingList] = useState<PackingList | null>(null)
  const [viewState, setViewState] = useState<ViewState>('questions')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  
  // Polling ref
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
      const res = await fetch(`/api/trip-intelligence/packing?tripId=${itinerary.id}`)
      const apiData = await res.json()
      
      // Check if we got actual data
      if (apiData.packingList && Object.keys(apiData.packingList).length > 0) {
        // Stop polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        
        // Clear generating flag
        try {
          sessionStorage.removeItem(getGeneratingKey(itinerary.id))
        } catch (e) {}
        
        // Transform and display
        const transformed = transformApiResponse(apiData)
        if (transformed) {
          setPackingList(transformed)
          setViewState('loaded')
          
          // Update cache for future use
          const flatItems = Object.entries(apiData.packingList).flatMap(([category, items]: [string, any]) =>
            Array.isArray(items) ? items.map((item: any) => ({ ...item, category })) : []
          )
          updateCache({ items: flatItems })
        }
        
        console.log('🔵 [PACKING] Data loaded successfully')
        return
      }
      
      // Safety: stop after 5 minutes (100 polls at 3s)
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
      console.error('🔴 [PACKING] Poll error:', error)
      // Don't stop on network errors - might be temporary
    }
  }

  // Start polling
  const startPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }
    pollCountRef.current = 0
    
    // Poll immediately, then every 3 seconds
    pollForData()
    pollingRef.current = setInterval(pollForData, 3000)
  }

  // Check initial state on mount
  useEffect(() => {
    // First check if we have cached data
    if (data?.items && data.items.length > 0) {
      // Transform cached data
      const categorizedList: any = {
        clothing: [],
        footwear: [],
        gear: [],
        toiletries: [],
        documents: [],
        specialNotes: [],
        luggageStrategy: null
      }
      
      const categoryMap: Record<string, string> = {
        'Clothing': 'clothing',
        'Footwear': 'footwear',
        'Activity Gear': 'gear',
        'Electronics': 'gear',
        'Toiletries': 'toiletries',
        'Documents': 'documents',
        'Health & Safety': 'gear',
        'Miscellaneous': 'gear'
      }
      
      data.items.forEach((item: any) => {
        const mappedCategory = categoryMap[item.category] || 'gear'
        categorizedList[mappedCategory].push({
          name: item.itemName,
          quantity: item.quantity,
          reason: item.reason,
          priority: item.priority
        })
      })
      
      setPackingList(categorizedList)
      setViewState('loaded')
      
      // Clear any stale generating flag
      try {
        sessionStorage.removeItem(getGeneratingKey(itinerary.id))
      } catch (e) {}
      return
    }
    
    // Check if we were generating (user navigated away and came back)
    try {
      if (sessionStorage.getItem(getGeneratingKey(itinerary.id))) {
        console.log('🔵 [PACKING] Found generating flag, resuming poll')
        setViewState('generating')
        startPolling()
        return
      }
    } catch (e) {}
    
    // No data and not generating - show questions
    if (initialCheckComplete) {
      setViewState('questions')
    }
  }, [data, initialCheckComplete, itinerary.id])

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
  
  // Simple fire-and-forget generate function
  const generatePackingList = async (answers: Record<string, string>) => {
    // Instantly show generating state
    setViewState('generating')
    
    // Set generating flag in sessionStorage
    try {
      sessionStorage.setItem(getGeneratingKey(itinerary.id), 'true')
    } catch (e) {}
    
    console.log('🔵 [PACKING] Starting generation...')
    
    // Fire and forget - don't await the response
    fetch('/api/trip-intelligence/packing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: itinerary.id,
        packingStyle: answers.packingStyle,
        hasGear: answers.hasGear
      })
    }).catch(err => {
      console.error('🔴 [PACKING] POST error:', err)
    })
    
    // Start polling for the result
    startPolling()
  }

  const handleRegenerate = async () => {
    // Clear data from database first
    try {
      await fetch(`/api/trip-intelligence/packing?tripId=${itinerary.id}`, {
        method: 'DELETE'
      })
    } catch (e) {
      console.error('Failed to clear packing list:', e)
    }
    
    // Don't call invalidateCache() - it triggers the loading spinner
    // The DELETE clears DB, and local state changes are sufficient
    setPackingList(null)
    setViewState('questions')
  }

  // Show loading while checking cache
  if (!initialCheckComplete) {
    return <IntelligenceLoading feature="packing" mode="checking" />
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
  
  // Generating state - non-blocking
  if (viewState === 'generating') {
    return (
      <div className="animate-fade-in">
        <Card className="p-8 text-center bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-purple-100 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Generating Your Packing List...
          </h3>
          
          <p className="text-slate-600 text-sm mb-4">
            Analyzing your trip, activities, and weather forecast
          </p>
          
          <div className="bg-white/60 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-purple-700 font-medium mb-1">
              Feel free to explore other tabs!
            </p>
            <p className="text-xs text-slate-500">
              Your packing list will be ready when you return.
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

      {/* Luggage Strategy Section */}
      {packingList.luggageStrategy && (() => {
        const strategy = packingList.luggageStrategy as any
        
        const bags = strategy.bags && Array.isArray(strategy.bags) 
          ? strategy.bags 
          : strategy.recommendedBag 
            ? [{ type: 'Recommended', reason: strategy.recommendedBag }]
            : []
        
        const organization = strategy.organization || strategy.recommendedBag || ''
        const tips = strategy.tips && Array.isArray(strategy.tips) 
          ? strategy.tips 
          : strategy.packingTips && Array.isArray(strategy.packingTips)
            ? strategy.packingTips
            : []
        
        if (bags.length === 0 && !organization && tips.length === 0) {
          return null
        }
        
        return (
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4 text-purple-700">
                <Luggage size={20} />
                <h4 className="font-bold">Luggage Strategy</h4>
              </div>
              
              {bags.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-semibold text-slate-700 mb-2">Recommended Bags:</h5>
                  <div className="space-y-2">
                    {bags.map((bag: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <Badge className="bg-purple-600 text-white flex-shrink-0">{bag.type}</Badge>
                        <span className="text-slate-700">{bag.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {organization && (
                <div className="mb-4">
                  <h5 className="text-sm font-semibold text-slate-700 mb-2">Organization Strategy:</h5>
                  <p className="text-sm text-slate-700 leading-relaxed">{organization}</p>
                </div>
              )}
              
              {tips.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={16} className="text-yellow-600" />
                    <h5 className="text-sm font-semibold text-slate-700">Expert Packing Tips:</h5>
                  </div>
                  <ul className="space-y-1.5">
                    {tips.map((tip: string, idx: number) => (
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
        )
      })()}
    </div>
  )
}

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
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    // Check if packing list already exists
    const fetchExistingList = async () => {
      try {
        const response = await fetch(`/api/trip-intelligence/packing?tripId=${itinerary.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.packingList && Object.keys(data.packingList).length > 0) {
            // Transform database response to match UI expectations
            const categorizedList: any = {
              clothing: [],
              footwear: [],
              gear: [],
              toiletries: [],
              documents: [],
              specialNotes: [],
              luggageStrategy: null
            }
            
            // Group items by category
            Object.entries(data.packingList).forEach(([category, items]: [string, any]) => {
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
              
              const mappedCategory = categoryMap[category] || 'gear'
              items.forEach((item: any) => {
                categorizedList[mappedCategory].push({
                  name: item.itemName,
                  quantity: item.quantity,
                  reason: item.reason,
                  priority: item.priority
                })
              })
            })
            
            setPackingList(categorizedList)
            setViewState('loaded')
          } else {
            setViewState('questions')
          }
        } else {
          setViewState('questions')
        }
      } catch (error) {
        console.error('Error fetching packing list:', error)
        setViewState('questions')
      }
    }
    
    fetchExistingList()
  }, [itinerary.id])

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
    setDebugInfo(null)
    
    const requestBody = {
      tripId: itinerary.id,
      packingStyle: answers.packingStyle,
      hasGear: answers.hasGear
    }
    
    console.log('🔵 [PACKING DEBUG] Step 1: Request being sent')
    console.log('🔵 [PACKING DEBUG] Request body:', JSON.stringify(requestBody, null, 2))
    console.log('🔵 [PACKING DEBUG] Trip ID:', itinerary.id)
    console.log('🔵 [PACKING DEBUG] Packing style:', answers.packingStyle)
    console.log('🔵 [PACKING DEBUG] Has gear:', answers.hasGear)
    
    try {
      // Generate packing list using intelligence API
      console.log('🔵 [PACKING DEBUG] Step 2: Calling API...')
      const response = await fetch('/api/trip-intelligence/packing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      console.log('🔵 [PACKING DEBUG] Step 3: API response received')
      console.log('🔵 [PACKING DEBUG] Response status:', response.status)
      console.log('🔵 [PACKING DEBUG] Response statusText:', response.statusText)
      console.log('🔵 [PACKING DEBUG] Response ok:', response.ok)
      console.log('🔵 [PACKING DEBUG] Response headers:', Object.fromEntries(response.headers.entries()))
      
      const responseText = await response.text()
      console.log('🔵 [PACKING DEBUG] Step 4: Raw response text length:', responseText.length)
      console.log('🔵 [PACKING DEBUG] Raw response text:', responseText)
      
      let data
      try {
        data = JSON.parse(responseText)
        console.log('🔵 [PACKING DEBUG] Step 5: Parsed response data:', JSON.stringify(data, null, 2))
      } catch (parseError) {
        console.error('🔴 [PACKING DEBUG] Failed to parse JSON:', parseError)
        console.error('🔴 [PACKING DEBUG] Response text was:', responseText)
        setDebugInfo({
          step: 'parse_error',
          error: 'Failed to parse JSON response',
          rawResponse: responseText,
          status: response.status
        })
        setViewState('questions')
        alert(`Failed to parse response: ${parseError}`)
        return
      }
      
      if (response.ok) {
        console.log('🔵 [PACKING DEBUG] Step 6: Response OK, processing data...')
        console.log('🔵 [PACKING DEBUG] luggageStrategy:', JSON.stringify(data.luggageStrategy, null, 2))
        console.log('🔵 [PACKING DEBUG] packingList items count:', data.packingList?.length || 0)
        
        // Transform database response to match UI expectations
        const categorizedList: any = {
          clothing: [],
          footwear: [],
          gear: [],
          toiletries: [],
          documents: [],
          specialNotes: [],
          luggageStrategy: data.luggageStrategy
        }
        
        console.log('🔵 [PACKING DEBUG] Step 7: Transforming items by category...')
        // Group items by category
        if (data.packingList) {
          data.packingList.forEach((item: any, index: number) => {
            console.log(`🔵 [PACKING DEBUG] Processing item ${index + 1}:`, item.itemName, 'Category:', item.category)
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
            
            const mappedCategory = categoryMap[item.category] || 'gear'
            categorizedList[mappedCategory].push({
              name: item.itemName,
              quantity: item.quantity,
              reason: item.reason,
              priority: item.priority
            })
          })
        }
        
        console.log('🔵 [PACKING DEBUG] Step 8: Final categorized list:', JSON.stringify(categorizedList, null, 2))
        console.log('🔵 [PACKING DEBUG] luggageStrategy.bags:', categorizedList.luggageStrategy?.bags)
        
        setDebugInfo({
          step: 'success',
          request: requestBody,
          rawResponse: data,
          categorizedList: categorizedList,
          luggageStrategy: categorizedList.luggageStrategy
        })
        
        setPackingList(categorizedList)
        setViewState('loaded')
        console.log('🔵 [PACKING DEBUG] Step 9: ✅ Successfully loaded packing list')
      } else {
        console.error('🔴 [PACKING DEBUG] Response not OK')
        console.error('🔴 [PACKING DEBUG] Status code:', response.status)
        console.error('🔴 [PACKING DEBUG] Status text:', response.statusText)
        console.error('🔴 [PACKING DEBUG] Error data:', data)
        console.error('🔴 [PACKING DEBUG] Full error object:', JSON.stringify(data, null, 2))
        setDebugInfo({
          step: 'api_error',
          request: requestBody,
          status: response.status,
          statusText: response.statusText,
          error: data,
          rawResponse: responseText
        })
        setViewState('questions')
        const errorMessage = data?.error || data?.details || data?.message || `HTTP ${response.status}: ${response.statusText}`
        alert(`Failed to generate packing list: ${errorMessage}`)
      }
    } catch (error: any) {
      console.error('🔴 [PACKING DEBUG] Exception caught:', error)
      console.error('🔴 [PACKING DEBUG] Error message:', error?.message)
      console.error('🔴 [PACKING DEBUG] Error stack:', error?.stack)
      setDebugInfo({
        step: 'exception',
        error: error?.message || 'Unknown error',
        stack: error?.stack
      })
      setViewState('questions')
      alert(`An error occurred: ${error?.message || 'Unknown error'}`)
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

      {/* Debug Panel */}
      {debugInfo && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3 text-yellow-700">
              <AlertCircle size={20} />
              <h4 className="font-bold">Debug Information</h4>
              <button
                onClick={() => setDebugInfo(null)}
                className="ml-auto text-xs text-yellow-600 hover:text-yellow-800"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-yellow-800">Step:</strong> <span className="text-yellow-900">{debugInfo.step}</span>
              </div>
              {debugInfo.request && (
                <div>
                  <strong className="text-yellow-800">Request:</strong>
                  <pre className="mt-1 p-2 bg-yellow-100 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(debugInfo.request, null, 2)}
                  </pre>
                </div>
              )}
              {debugInfo.rawResponse && (
                <div>
                  <strong className="text-yellow-800">Raw API Response:</strong>
                  <pre className="mt-1 p-2 bg-yellow-100 rounded text-xs overflow-auto max-h-64">
                    {JSON.stringify(debugInfo.rawResponse, null, 2)}
                  </pre>
                </div>
              )}
              {debugInfo.luggageStrategy && (
                <div>
                  <strong className="text-yellow-800">Luggage Strategy:</strong>
                  <pre className="mt-1 p-2 bg-yellow-100 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(debugInfo.luggageStrategy, null, 2)}
                  </pre>
                </div>
              )}
              {debugInfo.error && (
                <div>
                  <strong className="text-red-800">Error:</strong>
                  <pre className="mt-1 p-2 bg-red-100 rounded text-xs overflow-auto max-h-32">
                    {typeof debugInfo.error === 'string' ? debugInfo.error : JSON.stringify(debugInfo.error, null, 2)}
                  </pre>
                </div>
              )}
              {debugInfo.status && (
                <div>
                  <strong className="text-yellow-800">Status Code:</strong> <span className="text-yellow-900">{debugInfo.status}</span>
                  {debugInfo.statusText && (
                    <span className="text-yellow-700 ml-2">({debugInfo.statusText})</span>
                  )}
                </div>
              )}
              {debugInfo.rawResponse && debugInfo.step === 'api_error' && (
                <div>
                  <strong className="text-yellow-800">Raw Response:</strong>
                  <pre className="mt-1 p-2 bg-yellow-100 rounded text-xs overflow-auto max-h-32">
                    {debugInfo.rawResponse}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
      
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
      {packingList.luggageStrategy && (() => {
        // Handle both API response formats:
        // 1. New format: { bags: LuggageBag[], organization: string, tips: string[] }
        // 2. Old format: { recommendedBag: string, packingTips: string[] }
        const strategy = packingList.luggageStrategy as any
        
        // Normalize the data structure
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
        
        // Only render if we have at least some data
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
              
              {/* Recommended Bags */}
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
              
              {/* Organization Strategy */}
              {organization && (
                <div className="mb-4">
                  <h5 className="text-sm font-semibold text-slate-700 mb-2">Organization Strategy:</h5>
                  <p className="text-sm text-slate-700 leading-relaxed">{organization}</p>
                </div>
              )}
              
              {/* Packing Tips */}
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

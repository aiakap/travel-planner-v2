"use client"

import { useState, useEffect, useRef } from "react"
import type { ViewItinerary, VisaRequirement } from "@/lib/itinerary-view-types"
import { FileText, AlertTriangle, Loader2, Check, ChevronsUpDown, ShieldCheck, Home, AlertCircle, RefreshCw } from "lucide-react"
import { Card } from "./card"
import { Badge } from "./badge"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { COUNTRIES } from "@/lib/countries"
import { cn } from "@/lib/utils"
import { useCachedIntelligence } from "../hooks/use-cached-intelligence"
import { IntelligenceLoading } from "./intelligence-loading"

interface DocumentsViewProps {
  itinerary: ViewItinerary
}

type ViewState = 'questions' | 'generating' | 'loaded'

// Simple sessionStorage key
const getGeneratingKey = (tripId: string) => `documents_generating_${tripId}`

export function DocumentsView({ itinerary }: DocumentsViewProps) {
  const { data, initialCheckComplete, updateCache } = useCachedIntelligence<{ results: VisaRequirement[] }>(
    'documents',
    itinerary.id,
    '/api/visa/check'
  )

  const [viewState, setViewState] = useState<ViewState>('questions')
  const [citizenship, setCitizenship] = useState("United States")
  const [residence, setResidence] = useState("")
  const [citizenshipOpen, setCitizenshipOpen] = useState(false)
  const [residenceOpen, setResidenceOpen] = useState(false)
  const [visaInfo, setVisaInfo] = useState<VisaRequirement[]>([])
  const [error, setError] = useState("")

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
      const res = await fetch(`/api/visa/check?tripId=${itinerary.id}`)
      const apiData = await res.json()
      
      if (apiData.results && apiData.results.length > 0) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        
        try {
          sessionStorage.removeItem(getGeneratingKey(itinerary.id))
        } catch (e) {}
        
        setVisaInfo(apiData.results)
        updateCache({ results: apiData.results })
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
        setError('Generation timed out. Please try again.')
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
    if (data?.results && data.results.length > 0) {
      setVisaInfo(data.results)
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
  
  // Fire-and-forget generate function
  const handleCheckRequirements = async () => {
    if (!citizenship.trim()) {
      setError("Please enter your country of citizenship")
      return
    }
    
    setViewState('generating')
    setError("")
    
    try {
      sessionStorage.setItem(getGeneratingKey(itinerary.id), 'true')
    } catch (e) {}

    // Get unique destinations from segments
    const destinations = Array.from(
      new Set(itinerary.segments.map(s => s.endTitle || s.destination))
    ).filter(Boolean)
    
    // Fire and forget - don't await
    fetch('/api/visa/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: itinerary.id,
        destinations,
        citizenship: citizenship.trim(),
        residence: residence.trim() || citizenship.trim(),
      })
    }).catch(err => {
      console.error('POST error:', err)
    })

    startPolling()
  }
  
  const handleRecheck = async () => {
    try {
      await fetch(`/api/visa/check?tripId=${itinerary.id}`, {
        method: 'DELETE'
      })
    } catch (e) {
      console.error('Failed to clear visa requirements:', e)
    }
    
    setVisaInfo([])
    setViewState('questions')
  }

  // Show loading while checking cache
  if (!initialCheckComplete) {
    return <IntelligenceLoading feature="documents" mode="checking" />
  }

  if (viewState === 'generating') {
    return (
      <div className="animate-fade-in">
        <Card className="p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-blue-100 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Checking Visa Requirements...
          </h3>
          
          <p className="text-slate-600 text-sm mb-4">
            Analyzing entry requirements for your destinations
          </p>
          
          <div className="bg-white/60 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-blue-700 font-medium mb-1">
              Feel free to explore other tabs!
            </p>
            <p className="text-xs text-slate-500">
              Your visa information will be ready when you return.
            </p>
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <span>Generation in progress</span>
          </div>
        </Card>
      </div>
    )
  }
  
  if (viewState === 'questions') {
    return (
      <div className="animate-fade-in">
        <Card className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <FileText className="h-16 w-16 mx-auto text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-slate-900">Check Visa Requirements</h3>
              <p className="text-slate-600 text-sm">
                Get visa information for your trip destinations based on your citizenship
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Country of Citizenship *</Label>
                <Popover open={citizenshipOpen} onOpenChange={setCitizenshipOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="w-full justify-between mt-1 flex items-center px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <span className="text-sm">{citizenship || "Select country..."}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search country..." />
                      <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                          {COUNTRIES.map((country) => (
                            <CommandItem
                              key={country}
                              value={country}
                              onSelect={() => {
                                setCitizenship(country)
                                setCitizenshipOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  citizenship === country ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {country}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label>Country of Residence (optional)</Label>
                <Popover open={residenceOpen} onOpenChange={setResidenceOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="w-full justify-between mt-1 flex items-center px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <span className="text-sm">{residence || "Same as citizenship"}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search country..." />
                      <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              setResidence("")
                              setResidenceOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                residence === "" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Same as citizenship
                          </CommandItem>
                          {COUNTRIES.map((country) => (
                            <CommandItem
                              key={country}
                              value={country}
                              onSelect={() => {
                                setResidence(country)
                                setResidenceOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  residence === country ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {country}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-slate-500 mt-1">
                  Leave blank if same as citizenship
                </p>
              </div>
              
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <button
                onClick={handleCheckRequirements}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg transition-colors flex items-center justify-center gap-2"
              >
                Check Visa Requirements
              </button>
              
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong> Visa requirements change frequently. Always verify with official government sources before booking travel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Loaded state - show results
  return (
    <div className="animate-fade-in">
      <div className="space-y-4">
        {/* Header with reset button */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-slate-500">
            Showing requirements for <strong>{citizenship}</strong> citizens
          </p>
          <button
            onClick={handleRecheck}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Check Different Country
          </button>
        </div>
        
        {/* Results cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {visaInfo.map((visa, index) => (
            <Card 
              key={index} 
              className={`${
                visa.visaRequired 
                  ? 'bg-slate-50 border-slate-100' 
                  : 'bg-emerald-50 border-emerald-100'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-full ${
                    visa.visaRequired 
                      ? 'bg-slate-200 text-slate-600' 
                      : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {visa.visaRequired ? <Home size={24} /> : <ShieldCheck size={24} />}
                  </div>
                  <div>
                    <h3 className={`font-bold ${visa.visaRequired ? 'text-slate-900' : 'text-emerald-900'}`}>
                      {visa.destination}
                    </h3>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${
                      visa.visaRequired 
                        ? 'text-slate-500' 
                        : 'text-emerald-600'
                    }`}>
                      {visa.visaType || (visa.visaRequired ? 'Visa Required' : 'Visa Waiver Program')}
                    </p>
                  </div>
                </div>
                
                <div className={`space-y-2 text-sm ${visa.visaRequired ? 'text-slate-800' : 'text-emerald-800'}`}>
                  <p className={`flex justify-between border-b pb-2 ${
                    visa.visaRequired ? 'border-slate-200' : 'border-emerald-200'
                  }`}>
                    <span>Status</span> 
                    <span className="font-bold">
                      {visa.visaRequired ? 'Visa Required' : 'No Visa Required'}
                    </span>
                  </p>
                  {visa.duration && (
                    <p className={`flex justify-between border-b pb-2 ${
                      visa.visaRequired ? 'border-slate-200' : 'border-emerald-200'
                    }`}>
                      <span>Duration</span> 
                      <span className="font-bold">{visa.duration}</span>
                    </p>
                  )}
                  {visa.advanceRegistration && (
                    <p className={`flex justify-between pt-1`}>
                      <span>Requirement</span> 
                      <span className="font-bold">{visa.advanceRegistration}</span>
                    </p>
                  )}
                </div>
                
                {(visa.processingTime || visa.cost || visa.requirements.length > 0) && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    {visa.processingTime && (
                      <p className="text-xs text-slate-600 mb-1">
                        <strong>Processing:</strong> {visa.processingTime}
                      </p>
                    )}
                    {visa.cost && (
                      <p className="text-xs text-slate-600 mb-1">
                        <strong>Cost:</strong> {visa.cost}
                      </p>
                    )}
                    {visa.requirements.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-slate-700 mb-1">Requirements:</p>
                        <ul className="text-xs text-slate-600 space-y-0.5 ml-4 list-disc">
                          {visa.requirements.slice(0, 3).map((req, i) => (
                            <li key={i}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {visa.importantNotes && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-3 text-sm text-amber-800">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p>{visa.importantNotes}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
        
        {/* Warning footer */}
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 mb-1">
                Always Verify Before Travel
              </p>
              <p className="text-sm text-amber-700">
                Visa requirements can change without notice. Always check official embassy websites and government sources before booking travel.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

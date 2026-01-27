"use client"

import { useState, useMemo } from "react"
import type { ViewItinerary, VisaRequirement } from "@/lib/itinerary-view-types"
import { FileText, AlertTriangle, ExternalLink, Loader2, CheckCircle, XCircle, Check, ChevronsUpDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { COUNTRIES } from "@/lib/countries"
import { cn } from "@/lib/utils"

interface VisaSectionProps {
  itinerary: ViewItinerary
}

export function VisaSection({ itinerary }: VisaSectionProps) {
  const [citizenship, setCitizenship] = useState("United States")
  const [residence, setResidence] = useState("")
  const [citizenshipOpen, setCitizenshipOpen] = useState(false)
  const [residenceOpen, setResidenceOpen] = useState(false)
  const [visaInfo, setVisaInfo] = useState<VisaRequirement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const handleCheckRequirements = async () => {
    if (!citizenship.trim()) {
      setError("Please enter your country of citizenship")
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      // Get unique destinations from segments
      const destinations = Array.from(
        new Set(itinerary.segments.map(s => s.endTitle || s.destination))
      ).filter(Boolean)
      
      const response = await fetch('/api/visa/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinations,
          citizenship: citizenship.trim(),
          residence: residence.trim() || citizenship.trim(),
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to check visa requirements')
      }
      
      const data = await response.json()
      setVisaInfo(data.results || [])
    } catch (err) {
      console.error('Visa check error:', err)
      setError('Failed to check visa requirements. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <section id="visa" className="scroll-mt-32 max-w-5xl mx-auto px-4 py-12 mb-12">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-6 w-6 text-indigo-500" />
        <h2 className="text-3xl font-bold">Travel Documents & Visas</h2>
      </div>
      
      {visaInfo.length === 0 ? (
        // Empty state - show form
        <Card className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <FileText className="h-16 w-16 mx-auto text-indigo-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Check Visa Requirements</h3>
              <p className="text-muted-foreground">
                Get visa information for your trip destinations based on your citizenship
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Country of Citizenship *</Label>
                <Popover open={citizenshipOpen} onOpenChange={setCitizenshipOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={citizenshipOpen}
                      className="w-full justify-between mt-1"
                    >
                      {citizenship || "Select country..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
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
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={residenceOpen}
                      className="w-full justify-between mt-1"
                    >
                      {residence || "Same as citizenship"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank if same as citizenship
                </p>
              </div>
              
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
              
              <Button
                onClick={handleCheckRequirements}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking Requirements...
                  </>
                ) : (
                  'Check Visa Requirements'
                )}
              </Button>
              
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Important:</strong> Visa requirements change frequently. Always verify with official government sources before booking travel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        // Results state
        <div className="space-y-4">
          {/* Header with reset button */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">
              Showing requirements for <strong>{citizenship}</strong> citizens
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setVisaInfo([])
                setCitizenship("United States")
                setResidence("")
              }}
            >
              Check Different Country
            </Button>
          </div>
          
          {/* Results cards */}
          {visaInfo.map((visa, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {visa.visaRequired ? (
                    <XCircle className="h-8 w-8 text-red-500" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{visa.destination}</h3>
                  
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                    visa.visaRequired 
                      ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                      : 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                  }`}>
                    {visa.visaRequired ? 'Visa Required' : 'No Visa Required'}
                  </div>
                  
                  {visa.visaType && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Type:</strong> {visa.visaType}
                    </p>
                  )}
                  
                  {visa.duration && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Duration:</strong> {visa.duration}
                    </p>
                  )}
                  
                  {visa.advanceRegistration && (
                    <div className="mb-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        📝 Pre-Arrival Registration Required
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {visa.advanceRegistration}
                      </p>
                    </div>
                  )}
                  
                  {visa.processingTime && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Processing Time:</strong> {visa.processingTime}
                    </p>
                  )}
                  
                  {visa.cost && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Cost:</strong> {visa.cost}
                    </p>
                  )}
                  
                  {visa.requirements.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-2">Requirements:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {visa.requirements.map((req, i) => (
                          <li key={i} className="text-sm text-muted-foreground">{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {visa.importantNotes && (
                    <div className="mb-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                        ⚠️ Important
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        {visa.importantNotes}
                      </p>
                    </div>
                  )}
                  
                  {visa.sources.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Official Sources:</p>
                      <div className="space-y-2">
                        {visa.sources.map((source, i) => (
                          <a
                            key={i}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>{source.title}</span>
                            <span className="text-xs text-muted-foreground">({source.domain})</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
          
          {/* Warning footer */}
          <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Always Verify Before Travel
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Visa requirements can change without notice. Always check official embassy websites and government sources before booking travel.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </section>
  )
}

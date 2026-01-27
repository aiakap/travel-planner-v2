"use client"

import { useState } from "react"
import type { ViewItinerary, VisaRequirement } from "@/lib/itinerary-view-types"
import { FileText, AlertTriangle, ExternalLink, Loader2, CheckCircle, XCircle, Check, ChevronsUpDown, ShieldCheck, Home, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { COUNTRIES } from "@/lib/countries"
import { cn } from "@/lib/utils"
import { SectionHeading } from "./section-heading"

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
      <SectionHeading 
        icon={FileText} 
        title="Documents" 
        subtitle="Travel requirements"
      />
      
      {visaInfo.length === 0 ? (
        // Empty state - show form
        <Card className="p-8 hover:shadow-lg transition-shadow">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg"
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
          <div className="grid md:grid-cols-2 gap-6">
            {visaInfo.map((visa, index) => (
              <Card 
                key={index} 
                className={`hover:shadow-lg hover:-translate-y-1 transition-all ${
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

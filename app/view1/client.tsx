"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { 
  MapPin, 
  Calendar as CalendarIcon, FileText, Sparkles,
  Share2, Download, CalendarPlus, Cloud, CheckSquare, Map,
  DollarSign, Shield, Calendar, UtensilsCrossed, Plus, Settings, ArrowLeft, Languages,
  Luggage, Mountain
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { NavButton } from "./components/nav-button"
import { ToolbarButton } from "./components/toolbar-button"
import { ActionIcon } from "./components/action-icon"
import { JourneyView } from "./components/journey-view"
import { WeatherView } from "./components/weather-view"
import { TodoView } from "./components/todo-view"
import { MapView } from "./components/map-view"
import { PackingView } from "./components/packing-view"
import { CurrencyView } from "./components/currency-view"
import { EmergencyView } from "./components/emergency-view"
import { CulturalView } from "./components/cultural-view"
import { ActivitiesView } from "./components/activities-view"
import { DiningView } from "./components/dining-view"
import { DocumentsView } from "./components/documents-view"
import { LanguageView } from "./components/language-view"
import { SectionHeading } from "./components/section-heading"
import { QuickAddModal } from "@/components/quick-add-modal"
import { StyleSelector } from "./components/style-selector"
import { toast } from "sonner"

interface View1ClientProps {
  itinerary: ViewItinerary
  profileValues: any[]
  currentStyleId?: string | null
  currentStyleName?: string | null
}

export function View1Client({ itinerary, profileValues, currentStyleId, currentStyleName }: View1ClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Read active tab from URL or default to 'journey'
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'journey')
  const [scrolled, setScrolled] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isExportingCalendar, setIsExportingCalendar] = useState(false)
  
  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
    const params = new URLSearchParams(searchParams)
    params.set('tab', newTab)
    router.replace(`/view1/${itinerary.id}?${params.toString()}`, { scroll: false })
  }

  // PDF download handler
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    const toastId = toast.loading("Generating PDF... This may take a moment.")
    
    try {
      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: itinerary.id }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate PDF')
      }

      toast.success("PDF generated successfully!", { id: toastId })
      window.open(data.pdfUrl, '_blank')
    } catch (error) {
      console.error('PDF generation error:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate PDF"
      toast.error(errorMessage, { id: toastId })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Calendar export handler
  const handleExportCalendar = async () => {
    setIsExportingCalendar(true)
    const toastId = toast.loading("Exporting to calendar...")
    
    try {
      const response = await fetch(`/api/calendar/export?tripId=${itinerary.id}`)

      if (!response.ok) {
        throw new Error('Failed to export calendar')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${itinerary.title.replace(/[^a-z0-9]/gi, '_')}.ics`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("Calendar file downloaded!", { id: toastId })
    } catch (error) {
      console.error('Calendar export error:', error)
      toast.error("Failed to export calendar", { id: toastId })
    } finally {
      setIsExportingCalendar(false)
    }
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const renderContent = () => {
    switch (activeTab) {
      case 'journey': return <JourneyView itinerary={itinerary} />
      case 'weather': return <WeatherView itinerary={itinerary} />
      case 'todo': return <TodoView itinerary={itinerary} profileValues={profileValues} />
      case 'map': return <MapView itinerary={itinerary} />
      case 'packing': return <PackingView itinerary={itinerary} profileValues={profileValues} />
      case 'currency': return <CurrencyView itinerary={itinerary} />
      case 'emergency': return <EmergencyView itinerary={itinerary} />
      case 'cultural': return <CulturalView itinerary={itinerary} />
      case 'activities': return <ActivitiesView itinerary={itinerary} />
      case 'dining': return <DiningView itinerary={itinerary} />
      case 'documents': return <DocumentsView itinerary={itinerary} />
      case 'language': return <LanguageView itinerary={itinerary} />
      default: return <JourneyView itinerary={itinerary} />
    }
  }

  const getSectionHeading = () => {
    const headings = {
      journey: { icon: CalendarIcon, title: "Timelines", subtitle: "Full itinerary timeline" },
      weather: { icon: Cloud, title: "Weather Forecast", subtitle: "Conditions for your trip" },
      todo: { icon: CheckSquare, title: "Action Items", subtitle: "Tasks pending your review" },
      map: { icon: Map, title: "Trip Map", subtitle: "Explore destinations & pins" },
      packing: { icon: Sparkles, title: "Packing List", subtitle: "AI-powered recommendations" },
      currency: { icon: DollarSign, title: "Currency Advice", subtitle: "Money & exchange rates" },
      emergency: { icon: Shield, title: "Emergency Info", subtitle: "Safety & contacts" },
      cultural: { icon: Calendar, title: "Cultural Calendar", subtitle: "Events & holidays" },
      activities: { icon: Sparkles, title: "Activity Suggestions", subtitle: "Things to do" },
      dining: { icon: UtensilsCrossed, title: "Dining Recommendations", subtitle: "Restaurant suggestions" },
      documents: { icon: FileText, title: "Travel Documents", subtitle: "Passports & Visas" },
      language: { icon: Languages, title: "Language Guide", subtitle: "Essential phrases & verbs" },
    }
    return headings[activeTab as keyof typeof headings] || headings.journey
  }

  const heading = getSectionHeading()

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 pb-20">

      {/* Hero Section Wrapper */}
      <div className="relative">
        {/* Style Selector - Outside overflow-hidden, aligned with content */}
        <div className="absolute top-20 left-0 right-0 z-[60] max-w-7xl mx-auto px-4 md:px-8">
          <StyleSelector
            tripId={itinerary.id}
            currentStyleId={currentStyleId}
            currentStyleName={currentStyleName}
          />
        </div>

        {/* Hero Section */}
        <div className="relative h-[400px] flex items-end pb-8 overflow-hidden group">
          <div className="absolute inset-0 z-0">
            <img 
              src={itinerary.coverImage}
              alt={itinerary.title}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-black/30"></div>
            <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full">
            <div className="max-w-3xl animate-fade-in-up">
               <div className="flex items-center gap-2 mb-2">
                <span className="text-white/60 text-sm font-medium">
                  {itinerary.formattedDateRange}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2 drop-shadow-lg">
                {itinerary.title}
              </h1>
              {itinerary.description && (
                <p className="text-white/80 text-lg max-w-xl">
                  {itinerary.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Tab Bar & Toolbar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
          <div className="flex items-center justify-between gap-6">
            
            {/* Unified Navigation */}
            <TooltipProvider>
              <div className="flex items-center gap-2 flex-1 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => router.push('/manage1')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                  title="Back to Trips"
                >
                  <ArrowLeft size={14} />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <div className="h-6 w-px bg-slate-200 mx-1 flex-shrink-0"></div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm gap-1">
                    <NavButton 
                      active={activeTab === 'journey'} 
                      onClick={() => handleTabChange('journey')} 
                      label="Timelines" 
                    />
                    <NavButton 
                      active={activeTab === 'todo'} 
                      onClick={() => handleTabChange('todo')} 
                      label="Dashboard" 
                    />
                  </div>
                  
                  {/* Weather & Map Buttons */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleTabChange('weather')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                            activeTab === 'weather'
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <Cloud size={16} />
                          <span className="hidden sm:inline">Weather</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Weather Forecast</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleTabChange('map')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                            activeTab === 'map'
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <Map size={16} />
                          <span className="hidden sm:inline">Map</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Trip Map</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Intelligence Icon Buttons */}
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleTabChange('packing')}
                          className={`p-2 rounded-lg transition-colors ${
                            activeTab === 'packing'
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <Luggage size={18} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Packing</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleTabChange('currency')}
                          className={`p-2 rounded-lg transition-colors ${
                            activeTab === 'currency'
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <DollarSign size={18} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Currency</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleTabChange('emergency')}
                          className={`p-2 rounded-lg transition-colors ${
                            activeTab === 'emergency'
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <Shield size={18} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Emergency</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleTabChange('cultural')}
                          className={`p-2 rounded-lg transition-colors ${
                            activeTab === 'cultural'
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <Calendar size={18} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cultural</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleTabChange('activities')}
                          className={`p-2 rounded-lg transition-colors ${
                            activeTab === 'activities'
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <Mountain size={18} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Activities</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleTabChange('dining')}
                          className={`p-2 rounded-lg transition-colors ${
                            activeTab === 'dining'
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <UtensilsCrossed size={18} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Dining</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleTabChange('documents')}
                          className={`p-2 rounded-lg transition-colors ${
                            activeTab === 'documents'
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <FileText size={18} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Documents</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleTabChange('language')}
                          className={`p-2 rounded-lg transition-colors ${
                            activeTab === 'language'
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <Languages size={18} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Language</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </TooltipProvider>

            {/* Right: Action Toolbar */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <ToolbarButton icon={Plus} label="Quick Add" onClick={() => router.push(`/quick-add/${itinerary.id}`)} />
              <ToolbarButton icon={Share2} label="Share" primary />
              <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
                <ActionIcon 
                  icon={Download} 
                  label={isGeneratingPDF ? "Generating PDF..." : "Download PDF"}
                  onClick={handleDownloadPDF}
                  loading={isGeneratingPDF}
                />
                <ActionIcon 
                  icon={CalendarPlus} 
                  label={isExportingCalendar ? "Exporting..." : "Sync Calendar"}
                  onClick={handleExportCalendar}
                  loading={isExportingCalendar}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 min-h-[500px]">
        {/* Section Header (shown for main tabs only, not AI assistants) */}
        {!['weather', 'packing', 'currency', 'emergency', 'cultural', 'activities', 'dining', 'documents', 'language'].includes(activeTab) && (
          <div className="mb-6">
            <SectionHeading 
              icon={heading.icon} 
              title={heading.title} 
              subtitle={heading.subtitle}
              actions={activeTab === 'journey' ? (
                <button
                  onClick={() => router.push(`/journey/${itinerary.id}/edit?returnTo=${encodeURIComponent(`/view1/${itinerary.id}?tab=journey`)}`)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-sm"
                >
                  <Settings size={16} />
                  <span>Journey Manager</span>
                </button>
              ) : undefined}
            />
          </div>
        )}

        {renderContent()}
      </main>
    </div>
  )
}

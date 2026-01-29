"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { 
  MapPin, 
  Calendar as CalendarIcon, FileText, Sparkles,
  Share2, Download, CalendarPlus, Cloud, CheckSquare, Map,
  DollarSign, Shield, Calendar, UtensilsCrossed, Plus
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { SectionHeading } from "./components/section-heading"
import { QuickAddModal } from "@/components/quick-add-modal"
import { toast } from "sonner"

interface View1ClientProps {
  itinerary: ViewItinerary
  profileValues: any[]
}

export function View1Client({ itinerary, profileValues }: View1ClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Read active tab from URL or default to 'journey'
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'journey')
  const [scrolled, setScrolled] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isExportingCalendar, setIsExportingCalendar] = useState(false)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  
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
    const toastId = toast.loading("Generating PDF...")
    
    try {
      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: itinerary.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const { pdfUrl } = await response.json()
      toast.success("PDF generated successfully!", { id: toastId })
      window.open(pdfUrl, '_blank')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error("Failed to generate PDF", { id: toastId })
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
      default: return <JourneyView itinerary={itinerary} />
    }
  }

  const getSectionHeading = () => {
    const headings = {
      journey: { icon: CalendarIcon, title: "Your Journey", subtitle: "Full itinerary timeline" },
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
    }
    return headings[activeTab as keyof typeof headings] || headings.journey
  }

  const heading = getSectionHeading()

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 pb-20">

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
                {new Date(itinerary.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(itinerary.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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

      {/* Sticky Tab Bar & Toolbar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
          <div className="flex items-center justify-between gap-6">
            
            {/* Left: Main Navigation Tabs */}
            <div className="flex items-center gap-2">
              <NavButton 
                active={activeTab === 'journey'} 
                onClick={() => handleTabChange('journey')} 
                label="Journey" 
              />
              <NavButton 
                active={activeTab === 'weather'} 
                onClick={() => handleTabChange('weather')} 
                label="Weather" 
              />
              <NavButton 
                active={activeTab === 'todo'} 
                onClick={() => handleTabChange('todo')} 
                label="To-Dos" 
              />
              <NavButton 
                active={activeTab === 'map'} 
                onClick={() => handleTabChange('map')} 
                label="Map" 
              />
            </div>

            {/* Center: AI Assistant Chips */}
            <div className="flex items-center gap-2 flex-1 justify-center overflow-x-auto no-scrollbar">
              {/* Divider */}
              <div className="h-8 w-px bg-slate-200 mx-2"></div>
              
              {/* AI Chips */}
              <button
                onClick={() => handleTabChange('packing')}
                className={`relative overflow-hidden px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'packing'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]"></div>
                <span className="relative">Packing</span>
              </button>

              <button
                onClick={() => handleTabChange('currency')}
                className={`relative overflow-hidden px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'currency'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]"></div>
                <span className="relative">Currency</span>
              </button>

              <button
                onClick={() => handleTabChange('emergency')}
                className={`relative overflow-hidden px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'emergency'
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]"></div>
                <span className="relative">Emergency</span>
              </button>

              <button
                onClick={() => handleTabChange('cultural')}
                className={`relative overflow-hidden px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'cultural'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]"></div>
                <span className="relative">Cultural</span>
              </button>

              <button
                onClick={() => handleTabChange('activities')}
                className={`relative overflow-hidden px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'activities'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]"></div>
                <span className="relative">Activities</span>
              </button>

              <button
                onClick={() => handleTabChange('dining')}
                className={`relative overflow-hidden px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'dining'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]"></div>
                <span className="relative">Dining</span>
              </button>

              <button
                onClick={() => handleTabChange('documents')}
                className={`relative overflow-hidden px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'documents'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]"></div>
                <span className="relative">Documents</span>
              </button>
            </div>

            {/* Right: Action Toolbar */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <ToolbarButton icon={Plus} label="Quick Add" onClick={() => setShowQuickAddModal(true)} />
              <ToolbarButton icon={Share2} label="Share" primary />
              <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
                <ActionIcon 
                  icon={Download} 
                  label="Download PDF" 
                  onClick={handleDownloadPDF}
                />
                <ActionIcon 
                  icon={CalendarPlus} 
                  label="Sync Calendar" 
                  onClick={handleExportCalendar}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 min-h-[500px]">
        {/* Section Header (shown for main tabs only, not AI assistants) */}
        {!['packing', 'currency', 'emergency', 'cultural', 'activities', 'dining', 'documents'].includes(activeTab) && (
          <div className="mb-6">
            <SectionHeading 
              icon={heading.icon} 
              title={heading.title} 
              subtitle={heading.subtitle}
            />
          </div>
        )}

        {renderContent()}
      </main>

      {/* Quick Add Modal */}
      <QuickAddModal 
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        tripId={itinerary.id}
      />
    </div>
  )
}

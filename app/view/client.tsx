"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { MapPin, Plane } from "lucide-react"
import Link from "next/link"
import { FloatingNav } from "./components/floating-nav"
import { HeroSection } from "./components/hero-section"
import { TodoSection } from "./components/todo-section"
import { ItinerarySection } from "./components/itinerary-section"
import { WeatherSection } from "./components/weather-section"
import { PackingSection } from "./components/packing-section"
import { VisaSection } from "./components/visa-section"

interface ItineraryViewClientProps {
  itineraries: ViewItinerary[]
  profileValues: any[]
}

export function ItineraryViewClient({ itineraries, profileValues }: ItineraryViewClientProps) {
  const [selectedTripId, setSelectedTripId] = useState<string>(itineraries[0]?.id || "")
  const [activeSection, setActiveSection] = useState<string>("hero")
  
  const selectedItinerary = itineraries.find(i => i.id === selectedTripId)

  // Intersection observer for active section detection
  useEffect(() => {
    if (!selectedItinerary) return

    const sections = ['hero', 'todo', 'itinerary', 'weather', 'packing', 'visa']
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { 
        threshold: 0.3,
        rootMargin: '-20% 0px -20% 0px'
      }
    )
    
    // Observe all sections
    sections.forEach(id => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })
    
    return () => observer.disconnect()
  }, [selectedItinerary])

  if (itineraries.length === 0) {
    return (
      <main className="min-h-screen pb-8">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
          <div className="text-center py-16 bg-card rounded-xl border border-dashed">
            <Plane className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Trips Yet</h2>
            <p className="text-muted-foreground mb-6">Create your first trip to see it in this beautiful view</p>
            <Link 
              href="/trip/new"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <MapPin className="h-4 w-4" />
              Create Your First Trip
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (!selectedItinerary) {
    return null
  }

  return (
    <main className="min-h-screen pb-8">
      {/* Trip Selector - Fixed below main nav */}
      <div className="sticky top-20 z-30 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Plane className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">Trip Dossier</span>
            </div>
            <Select value={selectedTripId} onValueChange={setSelectedTripId}>
              <SelectTrigger className="w-[280px] text-sm">
                <SelectValue placeholder="Select a trip" />
              </SelectTrigger>
              <SelectContent>
                {itineraries.map((itinerary) => (
                  <SelectItem key={itinerary.id} value={itinerary.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{itinerary.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Floating Navigation - Sticky, follows scroll */}
      <FloatingNav activeSection={activeSection} />

      {/* Scrolling Sections */}
      <div className="scroll-smooth">
        <HeroSection itinerary={selectedItinerary} />
        <TodoSection itinerary={selectedItinerary} />
        <ItinerarySection itinerary={selectedItinerary} />
        <WeatherSection itinerary={selectedItinerary} />
        <PackingSection 
          itinerary={selectedItinerary}
          profileValues={profileValues}
        />
        <VisaSection itinerary={selectedItinerary} />
      </div>
    </main>
  )
}



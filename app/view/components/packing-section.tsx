"use client"

import { useState } from "react"
import type { ViewItinerary, PackingList } from "@/lib/itinerary-view-types"
import { Backpack, Shirt, Footprints, Wrench, Heart, FileText, RefreshCw, Sparkles, MessageCircle, ShieldCheck, User } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { buildChatUrl } from "../lib/chat-integration"
import { SectionHeading } from "./section-heading"

interface PackingSectionProps {
  itinerary: ViewItinerary
  profileValues: any[]
}

export function PackingSection({ itinerary, profileValues }: PackingSectionProps) {
  const [packingList, setPackingList] = useState<PackingList | null>(null)
  const [status, setStatus] = useState<'notStarted' | 'loading' | 'loaded'>('notStarted')
  
  const generatePackingList = async () => {
    setStatus('loading')
    
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
      
      // Generate packing list
      const response = await fetch('/api/packing/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip: itinerary,
          profile: profileValues,
          weather: weatherData.filter(Boolean)
        })
      })
      
      if (response.ok) {
        const list = await response.json()
        setPackingList(list)
        setStatus('loaded')
      } else {
        setStatus('notStarted')
      }
    } catch (error) {
      console.error('Failed to generate packing list:', error)
      setStatus('notStarted')
    }
  }
  
  // Empty state - not yet generated
  if (status === 'notStarted') {
    return (
      <section id="packing" className="scroll-mt-32 max-w-5xl mx-auto px-4 py-12 mb-12">
        <SectionHeading 
          icon={Backpack} 
          title="Packing" 
          subtitle="Based on weather and activities"
        />
        <Card className="p-12 text-center hover:shadow-lg transition-shadow">
          <Backpack className="h-16 w-16 mx-auto text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-slate-900">Generate Your Packing List</h3>
          <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
            AI will analyze your trip, activities, and weather forecast to suggest personalized items you should pack.
          </p>
          <Button 
            onClick={generatePackingList}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 font-bold shadow-lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Packing List
          </Button>
        </Card>
      </section>
    )
  }
  
  // Loading state
  if (status === 'loading') {
    return (
      <section id="packing" className="scroll-mt-32 max-w-5xl mx-auto px-4 py-12 mb-12">
        <SectionHeading 
          icon={Backpack} 
          title="Packing" 
          subtitle="Based on weather and activities"
        />
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Generating personalized packing suggestions...</p>
        </Card>
      </section>
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
  ].filter(cat => cat.items.length > 0);
  
  return (
    <section id="packing" className="scroll-mt-32 max-w-5xl mx-auto px-4 py-12 mb-12">
      <div className="flex items-center justify-between mb-8">
        <SectionHeading 
          icon={Backpack} 
          title="Packing" 
          subtitle="Based on weather and activities"
        />
        <Button
          onClick={generatePackingList}
          variant="outline"
          size="sm"
          disabled={status === 'loading'}
          className="rounded-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${status === 'loading' ? 'animate-spin' : ''}`} />
          Regenerate
        </Button>
      </div>
      
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.title} className="h-full hover:shadow-lg hover:-translate-y-1 transition-all">
            <div className="p-5 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4 text-blue-600">
                <category.icon size={20} />
                <h4 className="font-bold text-slate-900">{category.title}</h4>
              </div>
              <ul className="space-y-3 flex-grow">
                {category.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 group cursor-pointer">
                    <div className="mt-0.5 w-4 h-4 rounded border border-slate-300 group-hover:border-blue-500 transition-colors flex items-center justify-center">
                      <div className="w-2 h-2 rounded-sm bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                      {item.name}
                      {item.quantity && ` (${item.quantity})`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}

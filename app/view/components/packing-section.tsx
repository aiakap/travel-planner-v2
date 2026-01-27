"use client"

import { useState, useEffect } from "react"
import type { ViewItinerary, PackingList } from "@/lib/itinerary-view-types"
import { Backpack, Shirt, Footprints, Wrench, Heart, FileText } from "lucide-react"
import { Card } from "@/components/ui/card"

interface PackingSectionProps {
  itinerary: ViewItinerary
  profileValues: any[]
}

export function PackingSection({ itinerary, profileValues }: PackingSectionProps) {
  const [packingList, setPackingList] = useState<PackingList | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function generatePackingList() {
      setLoading(true)
      
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
      }).catch(() => null)
      
      if (response) {
        const list = await response.json()
        setPackingList(list)
      }
      
      setLoading(false)
    }
    
    generatePackingList()
  }, [itinerary, profileValues])
  
  if (loading) {
    return (
      <section id="packing" className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-6">
          <Backpack className="h-6 w-6 text-purple-500" />
          <h2 className="text-3xl font-bold">Packing Suggestions</h2>
        </div>
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating personalized packing suggestions...</p>
        </Card>
      </section>
    )
  }
  
  if (!packingList) {
    return null
  }
  
  return (
    <section id="packing" className="max-w-5xl mx-auto px-4 py-12 mb-12">
      <div className="flex items-center gap-3 mb-6">
        <Backpack className="h-6 w-6 text-purple-500" />
        <h2 className="text-3xl font-bold">Packing Suggestions</h2>
      </div>
      
      <Card className="p-6">
        <p className="text-sm text-muted-foreground mb-6">
          Personalized suggestions based on your profile, planned activities, and weather forecast.
        </p>
        
        <div className="space-y-6">
          {/* Clothing */}
          {packingList.clothing && packingList.clothing.length > 0 && (
            <PackingCategory
              title="Clothing"
              icon={Shirt}
              items={packingList.clothing}
            />
          )}
          
          {/* Footwear */}
          {packingList.footwear && packingList.footwear.length > 0 && (
            <PackingCategory
              title="Footwear"
              icon={Footprints}
              items={packingList.footwear}
            />
          )}
          
          {/* Gear & Equipment */}
          {packingList.gear && packingList.gear.length > 0 && (
            <PackingCategory
              title="Gear & Equipment"
              icon={Wrench}
              items={packingList.gear}
            />
          )}
          
          {/* Toiletries & Personal */}
          {packingList.toiletries && packingList.toiletries.length > 0 && (
            <PackingCategory
              title="Toiletries & Personal"
              icon={Heart}
              items={packingList.toiletries}
            />
          )}
          
          {/* Documents & Tech */}
          {packingList.documents && packingList.documents.length > 0 && (
            <PackingCategory
              title="Documents & Tech"
              icon={FileText}
              items={packingList.documents}
            />
          )}
        </div>
      </Card>
    </section>
  )
}

interface PackingCategoryProps {
  title: string
  icon: any
  items: Array<{ name: string; quantity?: string; reason?: string }>
}

function PackingCategory({ title, icon: Icon, items }: PackingCategoryProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      
      <div className="grid gap-2">
        {items.map((item, index) => (
          <div 
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
          >
            <div className="h-5 w-5 rounded border-2 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-sm">{item.name}</div>
              {item.quantity && (
                <div className="text-xs text-muted-foreground">
                  Quantity: {item.quantity}
                </div>
              )}
              {item.reason && (
                <div className="text-xs text-muted-foreground mt-1 italic">
                  {item.reason}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

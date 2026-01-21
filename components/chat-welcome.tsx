"use client"

import { Button } from "@/components/ui/button"
import { Compass, Sparkles, Dice5, Palmtree, Mountain, Building, Map } from "lucide-react"

interface ChatWelcomeProps {
  onStartPlanning: (suggestion?: string) => void
  onGetLucky: () => void
}

const suggestions = [
  { icon: Palmtree, title: "Beach Getaway", subtitle: "Tropical islands & relaxation", color: "bg-cyan-500" },
  { icon: Mountain, title: "Adventure Trip", subtitle: "Hiking, skiing & exploration", color: "bg-emerald-500" },
  { icon: Building, title: "City Explorer", subtitle: "Culture, food & nightlife", color: "bg-violet-500" },
  { icon: Map, title: "Road Trip", subtitle: "Scenic drives & hidden gems", color: "bg-amber-500" },
]

export function ChatWelcome({ onStartPlanning, onGetLucky }: ChatWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="relative mb-6">
        <Compass className="h-16 w-16 text-primary" />
        <Sparkles className="h-6 w-6 text-amber-400 absolute -top-1 -right-1" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Where to next?</h2>
      <p className="text-muted-foreground mb-8 max-w-xs">
        Tell me about your dream trip and I'll help you plan every detail
      </p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onStartPlanning(suggestion.title)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:bg-accent hover:scale-105 transition-all"
          >
            <div className={`p-3 rounded-full ${suggestion.color} text-white`}>
              <suggestion.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">{suggestion.title}</span>
            <span className="text-[10px] text-muted-foreground">{suggestion.subtitle}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 text-muted-foreground text-sm mb-4">
        <div className="h-px bg-border flex-1" />
        <span>or</span>
        <div className="h-px bg-border flex-1" />
      </div>

      <Button onClick={onGetLucky} size="lg" variant="outline" className="gap-2 bg-transparent">
        <Dice5 className="h-5 w-5" />
        Get Lucky
      </Button>
    </div>
  )
}

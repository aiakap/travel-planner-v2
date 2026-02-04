"use client"

import { Sparkles } from "lucide-react"
import { Card } from "./card"

interface IntelligenceLoadingProps {
  feature: 'currency' | 'emergency' | 'cultural' | 'activities' | 'dining' | 'language' | 'packing' | 'documents' | 'weather' | 'budget'
  mode?: 'checking' | 'generating'
}

const LOADING_MESSAGES = {
  currency: {
    checking: "Checking our money vault...",
    generating: "Calculating exchange rates and counting coins..."
  },
  emergency: {
    checking: "Looking for the panic button...",
    generating: "Locating nearest embassies and emergency contacts..."
  },
  cultural: {
    checking: "Consulting our etiquette encyclopedia...",
    generating: "Learning local customs so you don't accidentally offend anyone..."
  },
  activities: {
    checking: "Scanning for adventure opportunities...",
    generating: "Finding the perfect activities to fill your free time..."
  },
  dining: {
    checking: "Sniffing out the best restaurants...",
    generating: "Curating a delicious dining guide just for you..."
  },
  language: {
    checking: "Dusting off our phrase books...",
    generating: "Teaching you just enough to sound like a local (or at least try)..."
  },
  packing: {
    checking: "Rummaging through your virtual closet...",
    generating: "Making sure you don't forget your toothbrush (or anything else)..."
  },
  documents: {
    checking: "Flipping through passport stamps...",
    generating: "Researching visa requirements and travel documents..."
  },
  weather: {
    checking: "Checking the clouds...",
    generating: "Fetching weather forecasts for your destinations..."
  },
  budget: {
    checking: "Opening the piggy bank...",
    generating: "Calculating your trip expenses and recommendations..."
  }
}

const ICONS = {
  currency: '💰',
  emergency: '🚨',
  cultural: '🎭',
  activities: '🎪',
  dining: '🍽️',
  language: '💬',
  packing: '🧳',
  documents: '📄',
  weather: '🌤️',
  budget: '💵'
}

export function IntelligenceLoading({ feature, mode = 'checking' }: IntelligenceLoadingProps) {
  const message = LOADING_MESSAGES[feature][mode]
  const icon = ICONS[feature]

  return (
    <div className="animate-fade-in">
      <Card className="p-12 text-center">
        <div className="mb-6 text-6xl animate-bounce">{icon}</div>
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-purple-600"></div>
          <Sparkles className="h-6 w-6 text-purple-600 animate-pulse" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">{message}</h3>
        <p className="text-slate-600 text-sm">
          {mode === 'checking' ? 'Just a moment while we check our memory...' : 'This might take a few seconds...'}
        </p>
      </Card>
    </div>
  )
}

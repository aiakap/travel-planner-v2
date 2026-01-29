"use client"

import { useState } from "react"
import { MessageSquare, Sparkles, Upload, Dices, FileText, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { TripBuilderModal } from "@/components/trip-builder-modal"

export function JourneyCreationCards() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [isTripBuilderOpen, setIsTripBuilderOpen] = useState(false)

  const handleChatClick = () => {
    // Navigate to chat page with trip creation context
    router.push("/chat?context=new-trip")
  }

  const handleSmartStartClick = () => {
    // Open trip builder modal with smart start context
    setIsTripBuilderOpen(true)
  }

  const handleUploadClick = () => {
    // TODO: Open upload modal
    toast.info("Upload & Extract coming soon! You'll be able to drag and drop confirmations here.")
  }

  const handleSurpriseMeClick = async () => {
    setIsLoading("surprise")
    const toastId = toast.loading("Creating your surprise trip...")
    
    try {
      // Call Get Lucky API
      const response = await fetch('/api/get-lucky/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileData: {}, // Profile will be fetched server-side
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate trip')
      }

      // Handle SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let tripId: string | null = null

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6))
                
                if (event.type === 'stage') {
                  toast.loading(event.message, { id: toastId })
                } else if (event.type === 'trip_updated' && event.data?.tripId) {
                  tripId = event.data.tripId
                } else if (event.type === 'complete' && tripId) {
                  toast.success('Your surprise trip is ready!', { id: toastId })
                  router.push(`/view1/${tripId}`)
                  return
                } else if (event.type === 'error') {
                  throw new Error(event.message || 'Generation failed')
                }
              } catch (e) {
                // Skip malformed JSON
              }
            }
          }
        }
      }

      toast.success('Trip generated successfully!', { id: toastId })
    } catch (error) {
      console.error('Get Lucky error:', error)
      toast.error('Failed to generate surprise trip', { id: toastId })
    } finally {
      setIsLoading(null)
    }
  }

  const handleTripBuilderComplete = (tripId: string) => {
    setIsTripBuilderOpen(false)
    router.push(`/view1/${tripId}`)
  }

  const cards = [
    {
      id: "chat",
      icon: MessageSquare,
      accentIcon: Sparkles,
      title: "Chat with AI",
      description: "Tell me about your trip naturally",
      details: "Dates, destinations, activities, or budget",
      gradient: "from-purple-500 to-indigo-500",
      bgGradient: "from-purple-50 to-indigo-50",
      hoverGradient: "hover:from-purple-100 hover:to-indigo-100",
      onClick: handleChatClick,
    },
    {
      id: "smart",
      icon: Sparkles,
      accentIcon: User,
      title: "Smart Start",
      description: "Get personalized suggestions",
      details: "Based on your interests and travel style",
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-50 to-teal-50",
      hoverGradient: "hover:from-emerald-100 hover:to-teal-100",
      onClick: handleSmartStartClick,
    },
    {
      id: "upload",
      icon: Upload,
      accentIcon: FileText,
      title: "Upload & Extract",
      description: "Have a confirmation already?",
      details: "Hotel, flight, or any travel document",
      gradient: "from-orange-500 to-amber-500",
      bgGradient: "from-orange-50 to-amber-50",
      hoverGradient: "hover:from-orange-100 hover:to-amber-100",
      onClick: handleUploadClick,
    },
    {
      id: "surprise",
      icon: Dices,
      accentIcon: Sparkles,
      title: "Surprise Me",
      description: "Feeling adventurous?",
      details: "Let AI plan a complete trip for you",
      gradient: "from-pink-500 to-rose-500",
      bgGradient: "from-pink-50 to-rose-50",
      hoverGradient: "hover:from-pink-100 hover:to-rose-100",
      onClick: handleSurpriseMeClick,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        const AccentIcon = card.accentIcon
        const loading = isLoading === card.id

        return (
          <button
            key={card.id}
            onClick={card.onClick}
            disabled={loading}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.bgGradient} ${card.hoverGradient} border border-slate-200 p-6 text-left transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
            
            {/* Content */}
            <div className="relative space-y-4">
              {/* Icons */}
              <div className="flex items-center justify-between">
                <div className={`relative p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                  <div className="absolute -top-1 -right-1">
                    <AccentIcon className="h-4 w-4 text-white drop-shadow-lg" />
                  </div>
                </div>
                
                {loading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-slate-600" />
                )}
              </div>
              
              {/* Text */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-slate-950 transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm font-medium text-slate-700 mb-1">
                  {card.description}
                </p>
                <p className="text-xs text-slate-500">
                  {card.details}
                </p>
              </div>
              
              {/* Hover Arrow */}
              <div className="flex items-center text-slate-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Get started
                <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        )
      })}

      {/* Trip Builder Modal */}
      <TripBuilderModal
        isOpen={isTripBuilderOpen}
        onClose={() => setIsTripBuilderOpen(false)}
        onComplete={handleTripBuilderComplete}
      />
    </div>
  )
}

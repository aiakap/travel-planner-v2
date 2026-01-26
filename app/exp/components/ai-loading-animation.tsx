"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

const loadingMessages = [
  "Searching for the perfect experiences...",
  "Sorting through amazing destinations...",
  "Sifting through travel options...",
  "Customizing your adventure...",
  "Planning for you and your crew...",
  "Finding hidden gems...",
  "Crafting your itinerary...",
  "Discovering local favorites...",
]

export function AILoadingAnimation() {
  const [messageIndex, setMessageIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false)
      
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
        setIsVisible(true)
      }, 300) // Fade out duration
    }, 3000) // Change message every 3 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex justify-start">
      <div className="bg-slate-50 rounded-lg px-5 py-3 flex items-center gap-3 border border-slate-100">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400 flex-shrink-0" />
        <span 
          className={`text-sm text-slate-600 transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {loadingMessages[messageIndex]}
        </span>
      </div>
    </div>
  )
}

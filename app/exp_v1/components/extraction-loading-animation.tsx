"use client"

import { Loader2 } from "lucide-react"

interface ExtractionLoadingAnimationProps {
  step: number
  totalSteps: number
  message?: string
}

export function ExtractionLoadingAnimation({ 
  step, 
  totalSteps,
  message = "Extracting booking details..."
}: ExtractionLoadingAnimationProps) {
  const progress = (step / totalSteps) * 100

  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex-1">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-blue-900 mb-2">
              {message}
            </div>
            <div className="w-full bg-blue-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="text-xs text-blue-700 mt-1">
              Step {step} of {totalSteps}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

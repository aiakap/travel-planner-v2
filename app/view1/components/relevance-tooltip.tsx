"use client"

import { useState } from "react"
import { Info, TrendingUp } from "lucide-react"

export interface ProfileReference {
  id: string
  category: string
  value: string
  relevance: string
}

interface RelevanceTooltipProps {
  score: number
  reasoning: string
  profileReferences?: ProfileReference[]
}

export function RelevanceTooltip({ score, reasoning, profileReferences = [] }: RelevanceTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Color code based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-blue-600 bg-blue-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-slate-600 bg-slate-100'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Highly Relevant'
    if (score >= 60) return 'Very Relevant'
    if (score >= 40) return 'Relevant'
    return 'Somewhat Relevant'
  }

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(score)} transition-all hover:scale-105`}
      >
        <TrendingUp className="h-3 w-3" />
        {score}
      </button>

      {isOpen && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-4">
            {/* Score Header */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full ${getScoreColor(score)} flex items-center justify-center font-bold text-lg`}>
                  {score}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Relevance Score
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {getScoreLabel(score)}
                  </div>
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-1">
                <Info className="h-3 w-3 text-slate-500" />
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Why This Matters
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {reasoning}
              </p>
            </div>

            {/* Profile References */}
            {profileReferences.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Based On Your Profile
                </div>
                <div className="space-y-2">
                  {profileReferences.map((ref, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-md p-2">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-900">
                            {ref.category}: {ref.value}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            {ref.relevance}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
              <div className="border-8 border-transparent border-t-white"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

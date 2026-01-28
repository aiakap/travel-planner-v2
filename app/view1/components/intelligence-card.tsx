"use client"

import { ReactNode } from "react"
import { Card } from "./card"
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface IntelligenceCardProps {
  title: string
  icon: ReactNode
  children: ReactNode
  onRegenerate?: () => void
  regenerating?: boolean
  expandable?: boolean
  defaultExpanded?: boolean
}

export function IntelligenceCard({
  title,
  icon,
  children,
  onRegenerate,
  regenerating = false,
  expandable = false,
  defaultExpanded = true
}: IntelligenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-5 py-4 border-b border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
              {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>

          <div className="flex items-center gap-2">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={regenerating}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-3 w-3 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
            )}

            {expandable && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {(!expandable || isExpanded) && (
        <div className="p-5">
          {children}
        </div>
      )}
    </Card>
  )
}

interface IntelligenceCardItemProps {
  label: string
  value: string | ReactNode
  expandable?: boolean
  defaultExpanded?: boolean
}

export function IntelligenceCardItem({
  label,
  value,
  expandable = false,
  defaultExpanded = false
}: IntelligenceCardItemProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            {label}
          </div>
          {expandable ? (
            <>
              <div className={`text-sm text-slate-900 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                {value}
              </div>
              {!isExpanded && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-1"
                >
                  Show more
                </button>
              )}
              {isExpanded && (
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-1"
                >
                  Show less
                </button>
              )}
            </>
          ) : (
            <div className="text-sm text-slate-900">
              {value}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

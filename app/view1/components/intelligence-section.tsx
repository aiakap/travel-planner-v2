"use client"

import { useState } from "react"
import { Card } from "./card"
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react"

export interface IntelligenceItem {
  label: string
  value: string
  reasoning?: string
  source?: string
  expandable?: boolean
}

export interface Source {
  name: string
  url: string
  type: 'api' | 'official' | 'reference'
  timestamp?: string
}

interface IntelligenceSectionProps {
  title: string
  icon: React.ReactNode
  items: IntelligenceItem[]
  sources?: Source[]
  defaultExpanded?: boolean
}

export function IntelligenceSection({ 
  title, 
  icon, 
  items,
  sources,
  defaultExpanded = true 
}: IntelligenceSectionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const toggleItemExpansion = (index: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  if (items.length === 0) return null

  return (
    <Card className="h-full">
      <div className="p-5 h-full flex flex-col">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-4 text-blue-600">
          {icon}
          <h4 className="font-bold text-slate-900">{title}</h4>
        </div>

        {/* Items List */}
        <ul className="space-y-3 flex-grow">
          {items.map((item, idx) => {
            const isExpanded = expandedItems.has(idx)
            const hasReason = item.reasoning && item.reasoning.length > 0
            const hasSource = item.source && item.source.length > 0
            const isExpandable = item.expandable !== false && (hasReason || hasSource)

            return (
              <li key={idx} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div 
                  className={`flex items-start gap-3 group ${isExpandable ? 'cursor-pointer' : ''}`}
                  onClick={() => isExpandable && toggleItemExpansion(idx)}
                >
                  <div className="mt-0.5 w-4 h-4 rounded border border-slate-300 group-hover:border-blue-500 transition-colors flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-sm bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-grow">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                          {item.label}
                        </div>
                        <div className="text-sm font-medium text-slate-900">
                          {item.value}
                        </div>
                      </div>
                      {isExpandable && (
                        <button className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </div>
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-2 space-y-2">
                        {hasReason && (
                          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded">
                            {item.reasoning}
                          </p>
                        )}
                        {hasSource && (
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <span>Source:</span>
                            <a 
                              href={item.source} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 underline inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {new URL(item.source).hostname}
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Sources Footer */}
        {sources && sources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Data Sources
            </div>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                  title={source.timestamp ? `Updated: ${new Date(source.timestamp).toLocaleString()}` : undefined}
                >
                  <span>{source.name}</span>
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

interface IntelligenceSectionGroupProps {
  children: React.ReactNode
  className?: string
}

export function IntelligenceSectionGroup({ children, className = "" }: IntelligenceSectionGroupProps) {
  return (
    <div className={`grid sm:grid-cols-2 md:grid-cols-3 gap-6 ${className}`}>
      {children}
    </div>
  )
}

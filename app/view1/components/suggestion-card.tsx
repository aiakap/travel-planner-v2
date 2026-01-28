"use client"

import { useRouter } from "next/navigation"
import type { TodoSuggestion } from "@/lib/trip-analysis/todo-suggestions"
import { getPriorityColor, getCategoryColor } from "@/lib/trip-analysis/todo-suggestions"
import { Card } from "./card"
import { Badge } from "./badge"
import { ArrowRight } from "lucide-react"

interface SuggestionCardProps {
  suggestion: TodoSuggestion
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const router = useRouter()
  
  const handleAction = () => {
    const { actionData } = suggestion
    
    if (actionData.type === 'navigate') {
      const query = actionData.query 
        ? '?' + new URLSearchParams(actionData.query).toString() 
        : ''
      router.push(`${actionData.route}${query}`)
    } else if (actionData.type === 'external') {
      window.open(actionData.url, '_blank', 'noopener,noreferrer')
    } else if (actionData.type === 'modal') {
      // Modal handling will be implemented later
      console.log('Modal action:', actionData)
    }
  }
  
  const priorityColor = getPriorityColor(suggestion.priority)
  const categoryColor = getCategoryColor(suggestion.category)
  
  const borderColorClass = {
    red: 'border-l-red-500',
    amber: 'border-l-amber-500',
    blue: 'border-l-blue-500',
    purple: 'border-l-purple-500',
    green: 'border-l-green-500',
    orange: 'border-l-orange-500',
    indigo: 'border-l-indigo-500',
  }[priorityColor]
  
  const iconBgClass = {
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  }[categoryColor]
  
  const priorityBadgeClass = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200',
  }[suggestion.priority]
  
  const Icon = suggestion.icon
  
  return (
    <Card className={`border-l-4 ${borderColorClass} hover:shadow-md transition-shadow`}>
      <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 ${iconBgClass} rounded-full flex items-center justify-center`}>
            <Icon size={24} />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-slate-900 text-base">{suggestion.title}</h3>
            <Badge className={priorityBadgeClass}>
              {suggestion.priority}
            </Badge>
            {suggestion.dateContext && (
              <Badge variant="outline" className="text-xs">
                {suggestion.dateContext}
              </Badge>
            )}
          </div>
          <p className="text-slate-600 text-sm">{suggestion.description}</p>
          {suggestion.relevanceScore && suggestion.relevanceScore > 70 && (
            <div className="mt-2">
              <span className="text-xs text-slate-500">
                Relevance: {suggestion.relevanceScore}%
              </span>
            </div>
          )}
        </div>
        
        {/* Action Button */}
        <div className="flex-shrink-0">
          <button
            onClick={handleAction}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm hover:shadow-md transition-all"
          >
            {suggestion.actionLabel}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </Card>
  )
}

interface SuggestionSectionProps {
  title: string
  icon: React.ReactNode
  suggestions: TodoSuggestion[]
  defaultExpanded?: boolean
}

export function SuggestionSection({ 
  title, 
  icon, 
  suggestions,
  defaultExpanded = true 
}: SuggestionSectionProps) {
  if (suggestions.length === 0) return null
  
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          {title} ({suggestions.length})
        </h2>
      </div>
      <div className="space-y-3">
        {suggestions.map(suggestion => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} />
        ))}
      </div>
    </div>
  )
}

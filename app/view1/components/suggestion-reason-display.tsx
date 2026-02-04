"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Sparkles, ChevronDown, ChevronRight, Info } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// TRIP-LEVEL SUGGESTION BANNER
// ============================================================================

interface TripSuggestionBannerProps {
  suggestionSummary: string
  suggestionParameters?: {
    duration?: string
    budget?: string
    travelStyle?: string
    keyInterests?: string[]
    companions?: string
  }
  profileReferences?: string[]
  className?: string
}

export function TripSuggestionBanner({
  suggestionSummary,
  suggestionParameters,
  profileReferences,
  className,
}: TripSuggestionBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={cn(
      "bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-4",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-purple-100 rounded-lg shrink-0">
          <Sparkles className="h-5 w-5 text-purple-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-purple-900">AI-Generated Trip</h3>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
              Personalized for you
            </Badge>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{suggestionSummary}</p>
          
          {suggestionParameters && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-2 -ml-2 text-purple-600 hover:text-purple-700">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-1" />
                  )}
                  {isExpanded ? "Hide details" : "View trip parameters"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 pt-3 border-t border-purple-100 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  {suggestionParameters.duration && (
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="ml-1 font-medium">{suggestionParameters.duration}</span>
                    </div>
                  )}
                  {suggestionParameters.budget && (
                    <div>
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="ml-1 font-medium">{suggestionParameters.budget}</span>
                    </div>
                  )}
                  {suggestionParameters.travelStyle && (
                    <div>
                      <span className="text-muted-foreground">Style:</span>
                      <span className="ml-1 font-medium">{suggestionParameters.travelStyle}</span>
                    </div>
                  )}
                  {suggestionParameters.companions && (
                    <div>
                      <span className="text-muted-foreground">Travelers:</span>
                      <span className="ml-1 font-medium">{suggestionParameters.companions}</span>
                    </div>
                  )}
                </div>
                {suggestionParameters.keyInterests && suggestionParameters.keyInterests.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">Based on:</span>
                    {suggestionParameters.keyInterests.map((interest, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs border-purple-200 text-purple-700">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SEGMENT-LEVEL SUGGESTION DISPLAY
// ============================================================================

interface SegmentSuggestionProps {
  suggestionReason: string
  profileReferences?: string[]
  className?: string
}

export function SegmentSuggestionReason({
  suggestionReason,
  profileReferences,
  className,
}: SegmentSuggestionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className={className}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-auto py-1 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Why this location?
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 ml-1" />
          ) : (
            <ChevronRight className="h-3 w-3 ml-1" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-xs text-slate-700 leading-relaxed">{suggestionReason}</p>
          {profileReferences && profileReferences.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {profileReferences.slice(0, 5).map((ref, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                  {formatProfileReference(ref)}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ============================================================================
// RESERVATION-LEVEL SUGGESTION TOOLTIP
// ============================================================================

interface ReservationSuggestionTooltipProps {
  suggestionReason: string
  profileReferences?: string[]
  children: React.ReactNode
}

export function ReservationSuggestionTooltip({
  suggestionReason,
  profileReferences,
  children,
}: ReservationSuggestionTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-purple-600">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Why suggested</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{suggestionReason}</p>
            {profileReferences && profileReferences.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {profileReferences.slice(0, 3).map((ref, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {formatProfileReference(ref)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================================================
// INLINE SUGGESTION INDICATOR
// ============================================================================

interface SuggestionIndicatorProps {
  suggestionReason: string
  profileReferences?: string[]
  compact?: boolean
}

export function SuggestionIndicator({
  suggestionReason,
  profileReferences,
  compact = false,
}: SuggestionIndicatorProps) {
  if (compact) {
    return (
      <ReservationSuggestionTooltip 
        suggestionReason={suggestionReason}
        profileReferences={profileReferences}
      >
        <button className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 transition-colors">
          <Sparkles className="h-3 w-3" />
        </button>
      </ReservationSuggestionTooltip>
    )
  }

  return (
    <ReservationSuggestionTooltip 
      suggestionReason={suggestionReason}
      profileReferences={profileReferences}
    >
      <button className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors">
        <Sparkles className="h-3 w-3" />
        <span>AI suggested</span>
      </button>
    </ReservationSuggestionTooltip>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format a profile reference ID into a readable label
 * e.g., "hobbies-photography" -> "Photography"
 */
function formatProfileReference(ref: string): string {
  // Remove category prefix and format
  const parts = ref.split('-')
  if (parts.length > 1) {
    // Skip the first part (category) and join the rest
    return parts.slice(1)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }
  return ref.charAt(0).toUpperCase() + ref.slice(1)
}

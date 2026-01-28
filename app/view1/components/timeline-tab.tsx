"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { List, BarChart3, Rows } from "lucide-react"
import { getRecommendedViewMode } from "../lib/view-utils"
import { VerticalTimelineView } from "./vertical-timeline-view"
import { GanttView } from "./gantt-view"
import { CompactListView } from "./compact-list-view"

interface TimelineTabProps {
  itinerary: ViewItinerary
}

type ViewMode = 'vertical' | 'gantt' | 'compact'

export function TimelineTab({ itinerary }: TimelineTabProps) {
  const recommendedMode = getRecommendedViewMode(itinerary.dayCount)
  const [viewMode, setViewMode] = useState<ViewMode>(recommendedMode)

  // Load saved preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('timeline-view-mode')
    if (saved && ['vertical', 'gantt', 'compact'].includes(saved)) {
      setViewMode(saved as ViewMode)
    }
  }, [])

  // Save preference to localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('timeline-view-mode', mode)
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="text-sm text-muted-foreground">
            Viewing {itinerary.dayCount} day{itinerary.dayCount !== 1 ? 's' : ''} across {itinerary.segments.length} segment{itinerary.segments.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'vertical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewModeChange('vertical')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Vertical</span>
            </Button>
            <Button
              variant={viewMode === 'gantt' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewModeChange('gantt')}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Gantt</span>
            </Button>
            <Button
              variant={viewMode === 'compact' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewModeChange('compact')}
              className="gap-2"
            >
              <Rows className="h-4 w-4" />
              <span className="hidden sm:inline">Compact</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* View Content */}
      {viewMode === 'vertical' && <VerticalTimelineView itinerary={itinerary} />}
      {viewMode === 'gantt' && <GanttView itinerary={itinerary} />}
      {viewMode === 'compact' && <CompactListView itinerary={itinerary} />}
    </div>
  )
}

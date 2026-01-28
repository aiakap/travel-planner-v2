"use client"

import { useState } from "react"
import { X, Sparkles } from "lucide-react"
import { InteractiveTimelineSlider } from "./interactive-timeline-slider"

interface SegmentData {
  id: string
  name: string
  startDate: Date
  endDate: Date
  color: string
  order: number
}

interface TimelineResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  segments: SegmentData[]
  tripStartDate: Date
  tripEndDate: Date
  currentSegmentId: string
  onApply: (segments: SegmentData[], tripStartDate: Date, tripEndDate: Date) => Promise<void>
}

export function TimelineResolutionModal({
  isOpen,
  onClose,
  segments: initialSegments,
  tripStartDate: initialTripStart,
  tripEndDate: initialTripEnd,
  currentSegmentId,
  onApply,
}: TimelineResolutionModalProps) {
  const [segments, setSegments] = useState(initialSegments)
  const [tripStartDate, setTripStartDate] = useState(initialTripStart)
  const [tripEndDate, setTripEndDate] = useState(initialTripEnd)
  const [isApplying, setIsApplying] = useState(false)

  if (!isOpen) return null

  const handleUpdate = (
    updatedSegments: SegmentData[],
    newTripStart: Date,
    newTripEnd: Date
  ) => {
    setSegments(updatedSegments)
    setTripStartDate(newTripStart)
    setTripEndDate(newTripEnd)
  }

  const handleApply = async () => {
    setIsApplying(true)
    try {
      await onApply(segments, tripStartDate, tripEndDate)
      onClose()
    } catch (error) {
      console.error("Failed to apply changes:", error)
      alert("Failed to save changes. Please try again.")
    } finally {
      setIsApplying(false)
    }
  }

  const handleCancel = () => {
    // Reset to initial values
    setSegments(initialSegments)
    setTripStartDate(initialTripStart)
    setTripEndDate(initialTripEnd)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100]"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Smart Date Resolution
                </h2>
                <p className="text-xs text-slate-500">
                  Drag segments to adjust dates and resolve conflicts
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              disabled={isApplying}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <InteractiveTimelineSlider
              segments={segments}
              tripStartDate={tripStartDate}
              tripEndDate={tripEndDate}
              onUpdate={handleUpdate}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center gap-3 p-4 border-t border-slate-200 bg-slate-50">
            <div className="text-xs text-slate-600">
              <span className="font-medium">Tip:</span> Use 🔒 Lock/Unlock to control whether trip dates adjust
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={isApplying}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={isApplying}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[140px] justify-center"
              >
                {isApplying ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Apply & Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

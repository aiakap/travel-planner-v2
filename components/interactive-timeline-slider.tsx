"use client"

import { useState, useRef, useEffect } from "react"
import { format, addDays, differenceInDays } from "date-fns"
import { Lock, Unlock, ChevronLeft, ChevronRight, Plus, X, GripVertical } from "lucide-react"

interface SegmentData {
  id: string
  name: string
  startDate: Date
  endDate: Date
  color: string
  order: number
}

interface InteractiveTimelineSliderProps {
  segments: SegmentData[]
  tripStartDate: Date
  tripEndDate: Date
  onUpdate: (segments: SegmentData[], tripStartDate: Date, tripEndDate: Date) => void
  onAddSegment?: (position: 'start' | 'end') => void
}

const SEGMENT_COLORS = [
  'bg-blue-400',
  'bg-rose-400',
  'bg-emerald-400',
  'bg-purple-400',
  'bg-orange-400',
  'bg-cyan-400',
  'bg-pink-400',
  'bg-lime-400',
]

export function InteractiveTimelineSlider({
  segments: initialSegments,
  tripStartDate: initialTripStart,
  tripEndDate: initialTripEnd,
  onUpdate,
  onAddSegment,
}: InteractiveTimelineSliderProps) {
  const [segments, setSegments] = useState(initialSegments)
  const [tripStartDate, setTripStartDate] = useState(initialTripStart)
  const [tripEndDate, setTripEndDate] = useState(initialTripEnd)
  const [isLocked, setIsLocked] = useState(true)
  const [dragState, setDragState] = useState<{
    segmentId: string | null
    type: 'edge-start' | 'edge-end' | 'body' | null
    startX: number
    initialSegments: SegmentData[]
  } | null>(null)
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)

  const timelineRef = useRef<HTMLDivElement>(null)

  const tripDuration = differenceInDays(tripEndDate, tripStartDate)

  // Calculate segment position and width
  const getSegmentStyle = (segment: SegmentData) => {
    const startOffset = differenceInDays(segment.startDate, tripStartDate)
    const duration = differenceInDays(segment.endDate, segment.startDate)
    const leftPercent = (startOffset / tripDuration) * 100
    const widthPercent = (duration / tripDuration) * 100

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
    }
  }

  // Handle edge drag start
  const handleEdgeDragStart = (e: React.MouseEvent, segmentId: string, edge: 'edge-start' | 'edge-end') => {
    e.preventDefault()
    e.stopPropagation()
    setDragState({
      segmentId,
      type: edge,
      startX: e.clientX,
      initialSegments: [...segments],
    })
  }

  // Handle body drag start
  const handleBodyDragStart = (e: React.MouseEvent, segmentId: string) => {
    e.preventDefault()
    setDragState({
      segmentId,
      type: 'body',
      startX: e.clientX,
      initialSegments: [...segments],
    })
  }

  // Handle mouse move
  useEffect(() => {
    if (!dragState || !timelineRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const timelineRect = timelineRef.current!.getBoundingClientRect()
      const deltaX = e.clientX - dragState.startX
      const dayWidth = timelineRect.width / tripDuration
      const daysDelta = Math.round(deltaX / dayWidth)

      if (daysDelta === 0) return

      const segment = segments.find(s => s.id === dragState.segmentId)
      if (!segment) return

      const segmentIndex = segments.findIndex(s => s.id === dragState.segmentId)
      const newSegments = [...dragState.initialSegments]

      if (dragState.type === 'edge-start') {
        handleEdgeStartDrag(newSegments, segmentIndex, daysDelta)
      } else if (dragState.type === 'edge-end') {
        handleEdgeEndDrag(newSegments, segmentIndex, daysDelta)
      } else if (dragState.type === 'body') {
        handleBodyDrag(newSegments, segmentIndex, daysDelta)
      }

      setSegments(newSegments)
    }

    const handleMouseUp = () => {
      if (dragState) {
        onUpdate(segments, tripStartDate, tripEndDate)
      }
      setDragState(null)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = dragState.type === 'body' ? 'grabbing' : 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState, segments, tripStartDate, tripEndDate, tripDuration])

  // Handle edge start drag
  const handleEdgeStartDrag = (newSegments: SegmentData[], segmentIndex: number, daysDelta: number) => {
    const segment = newSegments[segmentIndex]
    const newStartDate = addDays(segment.startDate, daysDelta)
    
    // Prevent segment from becoming too small (min 1 day)
    if (differenceInDays(segment.endDate, newStartDate) < 1) return

    if (isLocked) {
      // Adjust previous segment
      if (segmentIndex > 0) {
        const prevSegment = newSegments[segmentIndex - 1]
        const prevDuration = differenceInDays(newStartDate, prevSegment.startDate)
        if (prevDuration < 1) return // Prevent previous segment from becoming too small
        prevSegment.endDate = newStartDate
      } else {
        // Can't shrink before first segment when locked
        return
      }
    } else {
      // Extend trip start date
      if (newStartDate < tripStartDate) {
        setTripStartDate(newStartDate)
      }
    }

    segment.startDate = newStartDate
  }

  // Handle edge end drag
  const handleEdgeEndDrag = (newSegments: SegmentData[], segmentIndex: number, daysDelta: number) => {
    const segment = newSegments[segmentIndex]
    const newEndDate = addDays(segment.endDate, daysDelta)
    
    // Prevent segment from becoming too small (min 1 day)
    if (differenceInDays(newEndDate, segment.startDate) < 1) return

    if (isLocked) {
      // Adjust next segment
      if (segmentIndex < newSegments.length - 1) {
        const nextSegment = newSegments[segmentIndex + 1]
        const nextDuration = differenceInDays(nextSegment.endDate, newEndDate)
        if (nextDuration < 1) return // Prevent next segment from becoming too small
        nextSegment.startDate = newEndDate
      } else {
        // Can't extend past last segment when locked
        return
      }
    } else {
      // Extend trip end date
      if (newEndDate > tripEndDate) {
        setTripEndDate(newEndDate)
      }
    }

    segment.endDate = newEndDate
  }

  // Handle body drag
  const handleBodyDrag = (newSegments: SegmentData[], segmentIndex: number, daysDelta: number) => {
    const segment = newSegments[segmentIndex]
    const duration = differenceInDays(segment.endDate, segment.startDate)
    const newStartDate = addDays(segment.startDate, daysDelta)
    const newEndDate = addDays(segment.endDate, daysDelta)

    if (isLocked) {
      // Check boundaries
      if (segmentIndex > 0) {
        const prevSegment = newSegments[segmentIndex - 1]
        if (newStartDate < prevSegment.endDate) return
      }
      if (segmentIndex < newSegments.length - 1) {
        const nextSegment = newSegments[segmentIndex + 1]
        if (newEndDate > nextSegment.startDate) return
      }
      if (newStartDate < tripStartDate || newEndDate > tripEndDate) return
    } else {
      // Extend trip dates if needed
      if (newStartDate < tripStartDate) setTripStartDate(newStartDate)
      if (newEndDate > tripEndDate) setTripEndDate(newEndDate)
    }

    segment.startDate = newStartDate
    segment.endDate = newEndDate
  }

  // Move segment left/right by 1 day
  const handleMoveSegment = (segmentId: string, direction: 'left' | 'right') => {
    const segmentIndex = segments.findIndex(s => s.id === segmentId)
    if (segmentIndex === -1) return

    const newSegments = [...segments]
    const segment = newSegments[segmentIndex]
    const offset = direction === 'left' ? -1 : 1
    const duration = differenceInDays(segment.endDate, segment.startDate)

    if (isLocked) {
      // Swap days with neighbor
      if (direction === 'left' && segmentIndex > 0) {
        const prevSegment = newSegments[segmentIndex - 1]
        const prevDuration = differenceInDays(prevSegment.endDate, prevSegment.startDate)
        if (prevDuration <= 1) return // Can't shrink neighbor below 1 day
        
        prevSegment.endDate = addDays(prevSegment.endDate, -1)
        segment.startDate = addDays(segment.startDate, -1)
        segment.endDate = addDays(segment.endDate, -1)
      } else if (direction === 'right' && segmentIndex < newSegments.length - 1) {
        const nextSegment = newSegments[segmentIndex + 1]
        const nextDuration = differenceInDays(nextSegment.endDate, nextSegment.startDate)
        if (nextDuration <= 1) return // Can't shrink neighbor below 1 day
        
        segment.startDate = addDays(segment.startDate, 1)
        segment.endDate = addDays(segment.endDate, 1)
        nextSegment.startDate = addDays(nextSegment.startDate, 1)
      }
    } else {
      // Shift and extend trip
      segment.startDate = addDays(segment.startDate, offset)
      segment.endDate = addDays(segment.endDate, offset)
      
      if (segment.startDate < tripStartDate) setTripStartDate(segment.startDate)
      if (segment.endDate > tripEndDate) setTripEndDate(segment.endDate)
    }

    setSegments(newSegments)
    onUpdate(newSegments, tripStartDate, tripEndDate)
  }

  // Delete segment
  const handleDeleteSegment = (segmentId: string) => {
    const segmentIndex = segments.findIndex(s => s.id === segmentId)
    if (segmentIndex === -1) return

    const newSegments = segments.filter(s => s.id !== segmentId)
    
    if (newSegments.length === 0) {
      alert("Cannot delete the last segment")
      return
    }

    // Redistribute days to neighbors
    if (isLocked && newSegments.length > 0) {
      const deletedSegment = segments[segmentIndex]
      const freedDays = differenceInDays(deletedSegment.endDate, deletedSegment.startDate)
      
      if (segmentIndex > 0 && segmentIndex < segments.length - 1) {
        // Split between neighbors
        const prevSegment = newSegments[segmentIndex - 1]
        const nextSegment = newSegments[segmentIndex]
        const halfDays = Math.floor(freedDays / 2)
        
        prevSegment.endDate = addDays(prevSegment.endDate, halfDays)
        nextSegment.startDate = addDays(nextSegment.startDate, -(freedDays - halfDays))
      } else if (segmentIndex === 0) {
        // Give to next segment
        const nextSegment = newSegments[0]
        nextSegment.startDate = deletedSegment.startDate
      } else {
        // Give to previous segment
        const prevSegment = newSegments[newSegments.length - 1]
        prevSegment.endDate = deletedSegment.endDate
      }
    }

    setSegments(newSegments)
    onUpdate(newSegments, tripStartDate, tripEndDate)
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">
            Trip: {format(tripStartDate, "MMM d")} - {format(tripEndDate, "MMM d, yyyy")}
          </span>
          <span className="text-xs text-slate-500">
            ({tripDuration} days)
          </span>
        </div>
        
        <button
          onClick={() => setIsLocked(!isLocked)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isLocked
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          title={isLocked ? "Trip dates locked - segments adjust within bounds" : "Trip dates unlocked - trip extends/shrinks"}
        >
          {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          {isLocked ? 'Locked' : 'Unlocked'}
        </button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Controls */}
        <div className="flex items-center gap-2 mb-3">
          {onAddSegment && (
            <button
              onClick={() => onAddSegment('start')}
              className="p-1.5 rounded hover:bg-slate-100 transition-colors"
              title="Add segment at start"
            >
              <Plus className="h-4 w-4 text-slate-600" />
            </button>
          )}
          <div className="flex-1" />
          {onAddSegment && (
            <button
              onClick={() => onAddSegment('end')}
              className="p-1.5 rounded hover:bg-slate-100 transition-colors"
              title="Add segment at end"
            >
              <Plus className="h-4 w-4 text-slate-600" />
            </button>
          )}
        </div>

        {/* Date labels */}
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>{format(tripStartDate, "MMM d")}</span>
          <span>{format(tripEndDate, "MMM d")}</span>
        </div>

        {/* Timeline track */}
        <div
          ref={timelineRef}
          className="relative h-32 bg-slate-100 rounded-lg mb-4"
        >
          {/* Segments */}
          {segments.map((segment, index) => {
            const style = getSegmentStyle(segment)
            const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length]
            const isAbove = index % 2 === 0
            const duration = differenceInDays(segment.endDate, segment.startDate)
            const isHovered = hoveredSegment === segment.id

            return (
              <div
                key={segment.id}
                className="absolute"
                style={{
                  left: style.left,
                  width: style.width,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                {/* Label */}
                <div
                  className={`absolute left-0 right-0 text-center ${
                    isAbove ? 'bottom-full mb-2' : 'top-full mt-2'
                  }`}
                >
                  <div className="text-xs font-medium text-slate-900 truncate px-1">
                    {segment.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {duration} day{duration !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Segment bar */}
                <div
                  className={`relative h-12 ${color} rounded-lg shadow-sm transition-all group ${
                    isHovered ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                  onMouseEnter={() => setHoveredSegment(segment.id)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  title={`${segment.name}\n${format(segment.startDate, "MMM d")} - ${format(segment.endDate, "MMM d")}\n${duration} days`}
                >
                  {/* Left edge handle */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-black/20 flex items-center justify-center"
                    onMouseDown={(e) => handleEdgeDragStart(e, segment.id, 'edge-start')}
                  >
                    <GripVertical className="h-3 w-3 text-white/70" />
                  </div>

                  {/* Body (draggable) */}
                  <div
                    className="absolute inset-x-2 top-0 bottom-0 cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleBodyDragStart(e, segment.id)}
                  />

                  {/* Right edge handle */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-black/20 flex items-center justify-center"
                    onMouseDown={(e) => handleEdgeDragStart(e, segment.id, 'edge-end')}
                  >
                    <GripVertical className="h-3 w-3 text-white/70" />
                  </div>

                  {/* Controls (visible on hover) */}
                  {isHovered && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded shadow-lg border border-slate-200 p-1">
                      <button
                        onClick={() => handleMoveSegment(segment.id, 'left')}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                        title="Move left 1 day"
                      >
                        <ChevronLeft className="h-3 w-3 text-slate-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteSegment(segment.id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="Delete segment"
                      >
                        <X className="h-3 w-3 text-red-600" />
                      </button>
                      <button
                        onClick={() => handleMoveSegment(segment.id, 'right')}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                        title="Move right 1 day"
                      >
                        <ChevronRight className="h-3 w-3 text-slate-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Instructions */}
        <div className="text-xs text-slate-500 text-center space-y-1">
          <div>Drag edges to resize • Drag body to move • Hover for controls</div>
          <div>
            {isLocked ? (
              <span>🔒 Locked: Neighbors adjust to fit within trip dates</span>
            ) : (
              <span>🔓 Unlocked: Trip dates extend/shrink as needed</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Lock, Unlock, ChevronUp, ChevronDown, Trash2, Split, MapPin, Loader2, Plus, Minus, AlertCircle } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { toast } from "sonner"
import { DatePopover } from "@/components/ui/date-popover"
import type { Trip, Segment, SegmentType } from "@prisma/client"

interface JourneySegment {
  id: string
  title: string
  location: string
  days: number
  color: string
  segmentType: string
  startLocation: string
  endLocation: string
}

interface JourneyEditClientProps {
  trip: Trip & {
    segments: Array<Segment & { segmentType: SegmentType }>
  }
  segmentTypes: SegmentType[]
  returnTo: string
}

const segmentColors = [
  'bg-blue-50 border-blue-200',
  'bg-rose-50 border-rose-200',
  'bg-emerald-50 border-emerald-200',
  'bg-purple-50 border-purple-200',
  'bg-amber-50 border-amber-200',
  'bg-cyan-50 border-cyan-200',
  'bg-pink-50 border-pink-200',
  'bg-lime-50 border-lime-200',
]

// Error message helpers
function getUserFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('Not authenticated')) {
      return 'Your session has expired. Please refresh the page and try again.'
    }
    if (error.message.includes('not found')) {
      return 'Some segments could not be found. The trip may have been modified elsewhere. Please refresh and try again.'
    }
    if (error.message.includes('geocode')) {
      return 'Could not find location coordinates for new segments. Please check location names.'
    }
    if (error.message.includes('transaction') || error.message.includes('Transaction')) {
      return 'A database error occurred. No changes were saved. Please try again.'
    }
    if (error.message.includes('Invalid dates')) {
      return error.message
    }
    return error.message
  }
  return 'An unexpected error occurred. No changes were saved.'
}

function getTechnicalError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n\nStack:\n${error.stack || 'No stack trace'}`
  }
  return JSON.stringify(error, null, 2)
}

export function JourneyEditClient({
  trip,
  segmentTypes,
  returnTo
}: JourneyEditClientProps) {
  const router = useRouter()
  const [isLocked, setIsLocked] = useState(true)
  const [tripStartDate, setTripStartDate] = useState(trip.startDate)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<{
    userMessage: string
    technicalDetails: string
  } | null>(null)
  const [deletedSegmentIds, setDeletedSegmentIds] = useState<string[]>([])
  const [chapters, setChapters] = useState<JourneySegment[]>([])
  
  // State for inline editing
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  // Initialize chapters from segments
  useEffect(() => {
    if (trip.segments.length > 0) {
      const mappedChapters = trip.segments
        .sort((a, b) => a.order - b.order)
        .map((seg, index) => {
          const days = Math.max(1, differenceInDays(seg.endTime, seg.startTime) + 1)
          const location = seg.startTitle === seg.endTitle 
            ? seg.startTitle 
            : `${seg.startTitle} ➝ ${seg.endTitle}`
          
          return {
            id: seg.id,
            title: seg.name,
            location,
            days,
            color: segmentColors[index % segmentColors.length],
            segmentType: seg.segmentType.name,
            startLocation: seg.startTitle,
            endLocation: seg.endTitle,
          }
        })
      setChapters(mappedChapters)
    }
  }, [trip.segments])

  // Helper to calculate start date for a chapter
  const getCalculatedStartDate = (index: number): Date => {
    let currentDate = new Date(tripStartDate)
    for (let i = 0; i < index; i++) {
      currentDate.setDate(currentDate.getDate() + chapters[i].days)
    }
    return currentDate
  }

  // Helper to get start date string for chapter
  const getStartDateForChapter = (index: number): string => {
    const date = getCalculatedStartDate(index)
    return format(date, 'yyyy-MM-dd')
  }

  // Helper to get end date string for chapter
  const getEndDateForChapter = (index: number): string => {
    const startDate = getCalculatedStartDate(index)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + chapters[index].days - 1)
    return format(endDate, 'yyyy-MM-dd')
  }

  // Helper to format dates dynamically for display
  const getDatesForChapter = (index: number): string => {
    let dayOffset = 0
    for (let i = 0; i < index; i++) {
      dayOffset += chapters[i].days
    }
    
    const start = new Date(tripStartDate)
    start.setDate(start.getDate() + dayOffset)
    
    const end = new Date(start)
    end.setDate(end.getDate() + chapters[index].days - 1)
    
    const fmt = (d: Date) => format(d, "MMM d")
    return `${fmt(start)} - ${fmt(end)}`
  }

  const getTripEndDate = (): string => {
    const totalDays = chapters.reduce((acc, c) => acc + c.days, 0)
    const end = new Date(tripStartDate)
    end.setDate(end.getDate() + totalDays - 1)
    return format(end, "MMM d, yyyy")
  }

  const getTotalDays = (): number => {
    return chapters.reduce((acc, c) => acc + c.days, 0)
  }

  // Handle start date change from DatePopover
  const handleStartDateChange = (index: number, newStartDate: string) => {
    setError(null)
    // Parse new start date
    const [year, month, day] = newStartDate.split('-').map(Number)
    const newStart = new Date(year, month - 1, day)
    
    // Calculate what the start date should be based on previous segments
    const calculatedStart = getCalculatedStartDate(index)
    
    // If changing start date, we need to adjust the previous segment's duration
    if (index > 0) {
      const daysDiff = differenceInDays(newStart, calculatedStart)
      const prevChapter = chapters[index - 1]
      const newPrevDays = prevChapter.days + daysDiff
      
      if (newPrevDays >= 1) {
        setChapters(prev => prev.map((ch, i) => 
          i === index - 1 ? { ...ch, days: newPrevDays } : ch
        ))
      }
    } else {
      // Changing first segment start date = changing trip start date
      setTripStartDate(newStart)
    }
  }

  // Handle end date change from DatePopover
  const handleEndDateChange = (index: number, newEndDate: string) => {
    setError(null)
    // Parse new end date
    const [year, month, day] = newEndDate.split('-').map(Number)
    const newEnd = new Date(year, month - 1, day)
    
    // Calculate start date for this segment
    const startDate = getCalculatedStartDate(index)
    
    // Calculate new duration
    const newDays = differenceInDays(newEnd, startDate) + 1
    
    if (newDays >= 1) {
      setChapters(prev => prev.map((ch, i) => 
        i === index ? { ...ch, days: newDays } : ch
      ))
    }
  }

  const handleSliderChange = (index: number, newValue: string) => {
    const newDays = parseInt(newValue, 10)
    const diff = newDays - chapters[index].days
    handleDurationChange(index, diff)
  }

  const handleDurationChange = (index: number, change: number) => {
    setError(null)
    const newChapters = [...chapters]
    const target = newChapters[index]
    
    // Prevent reducing below 1 day
    if (target.days + change < 1) return

    if (isLocked) {
      // Locked Mode: Cannibalize neighbor
      // Prefer taking from next neighbor
      if (index < newChapters.length - 1) {
        const neighbor = newChapters[index + 1]
        if (neighbor.days - change >= 1) {
          target.days += change
          neighbor.days -= change
          setChapters(newChapters)
        }
      } else if (index > 0) {
        // If last chapter, try to take from previous
        const neighbor = newChapters[index - 1]
        if (neighbor.days - change >= 1) {
          target.days += change
          neighbor.days -= change
          setChapters(newChapters)
        }
      }
    } else {
      // Unlocked Mode: Just expand/contract
      target.days += change
      setChapters(newChapters)
    }
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    setError(null)
    const newChapters = [...chapters]
    if (direction === 'up' && index > 0) {
      [newChapters[index - 1], newChapters[index]] = [newChapters[index], newChapters[index - 1]]
    } else if (direction === 'down' && index < chapters.length - 1) {
      [newChapters[index + 1], newChapters[index]] = [newChapters[index], newChapters[index + 1]]
    }
    setChapters(newChapters)
  }

  const handleDelete = (index: number) => {
    setError(null)
    if (chapters.length <= 1) return
    
    const deletedChapter = chapters[index]
    // Track deletion if it's an existing segment (not a new one from split)
    if (!deletedChapter.id.startsWith('new-')) {
      setDeletedSegmentIds(prev => [...prev, deletedChapter.id])
    }
    
    const newChapters = chapters.filter((_, i) => i !== index)
    setChapters(newChapters)
  }

  const handleSplitSegment = (index: number) => {
    setError(null)
    const target = chapters[index]
    if (target.days <= 1) return

    const newChapters = [...chapters]
    const halfDays = Math.floor(target.days / 2)
    const remainingDays = target.days - halfDays

    // Update current
    target.days = remainingDays

    // Insert new (will need to be created as a new segment)
    const newId = `new-${Math.random().toString(36).substr(2, 9)}`
    newChapters.splice(index + 1, 0, {
      ...target,
      id: newId,
      title: `${target.title} (Part 2)`,
      days: halfDays,
      // Preserve all data needed for segment creation
      startLocation: target.startLocation,
      endLocation: target.endLocation,
      segmentType: target.segmentType,
    })

    setChapters(newChapters)
  }

  // Calculate max days available for slider based on neighbor if locked
  const getMaxDaysForSlider = (index: number): number => {
    if (!isLocked) return 30 // Max for unlocked mode
    let max = chapters[index].days
    // Check neighbor we would cannibalize
    if (index < chapters.length - 1) {
      max += (chapters[index + 1].days - 1)
    } else if (index > 0) {
      max += (chapters[index - 1].days - 1)
    }
    return max
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    
    try {
      // Calculate dates for all segments
      let currentDate = new Date(tripStartDate)
      const allSegments = chapters.map((chapter, index) => {
        const startDate = new Date(currentDate)
        const endDate = new Date(currentDate)
        endDate.setDate(endDate.getDate() + chapter.days - 1)
        
        // Move to next segment's start date
        currentDate = new Date(endDate)
        currentDate.setDate(currentDate.getDate() + 1)
        
        return { ...chapter, startDate, endDate, order: index }
      })
      
      // Separate into operations
      const newSegments = allSegments
        .filter(seg => seg.id && seg.id.startsWith('new-'))
        .map(seg => ({
          name: seg.title,
          startLocation: seg.startLocation,
          endLocation: seg.endLocation,
          startTime: seg.startDate,
          endTime: seg.endDate,
          segmentType: seg.segmentType,
          order: seg.order,
        }))
      
      const updatedSegments = allSegments
        .filter(seg => seg.id && !seg.id.startsWith('new-'))
        .map(seg => ({
          id: seg.id,
          name: seg.title, // Include name updates
          startTime: seg.startDate,
          endTime: seg.endDate,
          order: seg.order,
        }))
      
      // Calculate new trip end date
      const totalDays = getTotalDays()
      const newTripEnd = new Date(tripStartDate)
      newTripEnd.setDate(newTripEnd.getDate() + totalDays - 1)
      
      // Import and call atomic transaction action
      const { updateJourneySegments } = await import("@/lib/actions/update-journey-segments")
      
      // Execute atomic transaction
      await updateJourneySegments({
        tripId: trip.id,
        deletedSegmentIds,
        newSegments,
        updatedSegments,
        tripStartDate,
        tripEndDate: newTripEnd,
      })
      
      toast.success("Journey changes saved successfully")
      router.push(returnTo)
      router.refresh()
      
    } catch (error) {
      console.error("Failed to save journey changes:", error)
      setError({
        userMessage: getUserFriendlyError(error),
        technicalDetails: getTechnicalError(error),
      })
      toast.error(getUserFriendlyError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(returnTo)
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      {/* Sticky Header */}
      <div className="bg-white border-b border-slate-200 sticky top-20 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleCancel}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Back to Trip</span>
            </button>
            <h1 className="text-xl font-bold text-slate-900">Journey Manager</h1>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-red-900 mb-1">
                  Failed to Save Changes
                </h4>
                <p className="text-sm text-red-800 mb-2">
                  {error.userMessage}
                </p>
                <details className="text-xs text-red-700">
                  <summary className="cursor-pointer hover:underline font-medium">
                    Technical Details
                  </summary>
                  <pre className="mt-2 p-2 bg-red-100 rounded overflow-x-auto text-xs whitespace-pre-wrap break-words">
                    {error.technicalDetails}
                  </pre>
                </details>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Global Trip Settings */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
              <div className="w-full md:w-auto">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                  Start Date
                </label>
                <input 
                  type="date" 
                  className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  value={format(tripStartDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    setError(null)
                    // Parse date parts to avoid UTC interpretation
                    const [year, month, day] = e.target.value.split('-').map(Number)
                    setTripStartDate(new Date(year, month - 1, day))
                  }}
                />
              </div>
              
              <div className="flex-grow md:text-center">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Total Duration
                </div>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-2xl font-bold text-slate-900">{getTotalDays()} Days</span>
                  <span className="text-xs text-slate-500">Ends {getTripEndDate()}</span>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setError(null)
                  setIsLocked(!isLocked)
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                  isLocked 
                    ? 'bg-amber-50 border-amber-200 text-amber-800' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                }`}
              >
                {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                <span className="text-xs font-bold uppercase">
                  {isLocked ? 'Locked' : 'Unlocked'}
                </span>
              </button>
            </div>
          </div>

          {/* Vertical Chapter List */}
          <div className="space-y-3">
            {chapters.map((chapter, index) => (
              <div
                key={`${chapter.id}-${index}`}
                className={`bg-white p-4 rounded-xl border-2 transition-all ${chapter.color} shadow-sm`}
              >
                <div className="flex items-start gap-4">
                  {/* Left: Move Controls */}
                  <div className="flex flex-col gap-1 pt-1">
                    <button 
                      onClick={() => handleMove(index, 'up')} 
                      disabled={index === 0}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button 
                      onClick={() => handleMove(index, 'down')} 
                      disabled={index === chapters.length - 1}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  {/* Middle: Info, Dates & Slider */}
                  <div className="flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
                      {/* Left: Info + Dates */}
                      <div className="space-y-2">
                        {/* Editable Segment Name */}
                        {editingSegmentId === chapter.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => {
                              // Update chapter name
                              if (editingName.trim()) {
                                setChapters(prev => prev.map(ch => 
                                  ch.id === chapter.id ? { ...ch, title: editingName.trim() } : ch
                                ))
                              }
                              setEditingSegmentId(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur()
                              }
                              if (e.key === 'Escape') {
                                setEditingSegmentId(null)
                                setEditingName(chapter.title)
                              }
                            }}
                            className="font-bold text-sm text-slate-900 border border-blue-500 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="font-bold text-sm text-slate-900 cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition-colors"
                            onClick={() => {
                              setEditingSegmentId(chapter.id)
                              setEditingName(chapter.title)
                            }}
                            title="Click to edit"
                          >
                            {chapter.title}
                          </div>
                        )}
                        
                        {/* Location */}
                        <div className="text-xs text-slate-500 flex items-center gap-1 px-2">
                          <MapPin size={10} /> {chapter.location}
                        </div>
                        
                        {/* Date Pickers */}
                        <div className="flex gap-2 items-center px-2">
                          <DatePopover
                            value={getStartDateForChapter(index)}
                            onChange={(newDate) => handleStartDateChange(index, newDate)}
                            label="Start Date"
                            className="text-xs flex-1"
                          />
                          <span className="text-xs text-slate-400">→</span>
                          <DatePopover
                            value={getEndDateForChapter(index)}
                            onChange={(newDate) => handleEndDateChange(index, newDate)}
                            label="End Date"
                            className="text-xs flex-1"
                          />
                        </div>
                      </div>

                      {/* Right: Slider Control */}
                      <div className="flex items-center gap-4">
                        <div className="flex-grow">
                          <input 
                            type="range" 
                            min="1" 
                            max={getMaxDaysForSlider(index)} 
                            value={chapter.days} 
                            onChange={(e) => handleSliderChange(index, e.target.value)}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                            <span>1d</span>
                            <span>{getMaxDaysForSlider(index)}d</span>
                          </div>
                        </div>
                        <div className="text-center min-w-[5rem]">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <button
                              onClick={() => handleDurationChange(index, -1)}
                              disabled={chapter.days <= 1}
                              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                              title="Decrease days"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-xl font-bold text-slate-900 leading-none min-w-[2rem] text-center">
                              {chapter.days}
                            </span>
                            <button
                              onClick={() => handleDurationChange(index, 1)}
                              disabled={chapter.days >= getMaxDaysForSlider(index)}
                              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                              title="Increase days"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="text-[9px] uppercase font-bold text-slate-400">Days</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2 border-l pl-4 border-slate-100 pt-1">
                    <button 
                      onClick={() => handleSplitSegment(index)}
                      disabled={chapter.days <= 1}
                      title="Split Segment"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <Split size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(index)}
                      disabled={chapters.length <= 1}
                      title="Delete Segment"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-500">
              {isLocked ? (
                <span className="flex items-center gap-1">
                  <Lock size={12}/> Dates Locked: Adjusting trades time with neighbors
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Unlock size={12}/> Dates Unlocked: Adjusting changes trip length
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Apply Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

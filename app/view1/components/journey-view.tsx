"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { MapPin, Clock, MessageCircle, Edit2, ChevronLeft, ChevronRight, Trash2, Sparkles, Plus, Moon, ArrowDown } from "lucide-react"
import { Card } from "./card"
import { Badge } from "./badge"
import { ActionIcon } from "./action-icon"
import { generateAllDays, mapToCalendarData, getDayOfWeek, getSegmentDaysWithMoments } from "../lib/view-utils"
import { editReservation } from "../lib/chat-integration"
import { useOptimisticDelete } from "@/hooks/use-optimistic-delete"
import { deleteReservation } from "@/lib/actions/delete-reservation"

interface JourneyViewProps {
  itinerary: ViewItinerary
  scrollToId?: string | null
}

export function JourneyView({ itinerary, scrollToId }: JourneyViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Flatten all reservations for optimistic delete (memoized to prevent re-renders)
  const allReservations = useMemo(
    () => itinerary.segments.flatMap(s => s.reservations),
    [itinerary.segments]
  )
  
  // Use optimistic delete hook
  const { items: optimisticReservations, handleDelete } = useOptimisticDelete(
    allReservations,
    deleteReservation,
    {
      itemName: "reservation",
      successMessage: "Reservation removed from your trip",
      errorMessage: "Could not delete reservation"
    }
  )

  // Create optimistic itinerary with filtered reservations
  const optimisticItinerary = {
    ...itinerary,
    segments: itinerary.segments.map(segment => ({
      ...segment,
      reservations: segment.reservations.filter(r => 
        optimisticReservations.some(or => or.id === r.id)
      )
    }))
  }

  const allDays = generateAllDays(optimisticItinerary.startDate, optimisticItinerary.endDate)
  const calendarData = mapToCalendarData(optimisticItinerary)
  
  // Get current tab from URL
  const currentTab = searchParams.get('tab') || 'journey'

  // Scroll to element on mount if scrollToId is provided
  useEffect(() => {
    if (!scrollToId) return

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const element = document.getElementById(scrollToId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Add highlight effect
        setHighlightedId(scrollToId)
        // Remove highlight after animation
        setTimeout(() => setHighlightedId(null), 2000)
      }
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [scrollToId])

  const scrollToDate = (fullId: string) => {
    setSelectedDate(fullId)
    
    const momentElement = document.getElementById(`date-${fullId}`)
    
    if (momentElement) {
      momentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      // Find relevant chapter/segment
      const relevantChapter = calendarData.chapters.find(c => c.dateRange.includes(fullId))
      if (relevantChapter) {
        const chapterElement = document.getElementById(`segment-${relevantChapter.id}`)
        if (chapterElement) {
           chapterElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }
  }

  const scrollCalendar = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Check if a day has moments
  const hasMoments = (fullId: string) => {
    return calendarData.moments.some(m => {
      const momentFullId = `${m.month}-${m.date}`
      return momentFullId === fullId
    })
  }

  // Get chapter color bar for a date
  const getChapterBarColor = (dateObj: Date) => {
    const chapter = calendarData.chapters.find(c => {
      const start = new Date(optimisticItinerary.segments.find(s => s.id === c.id)?.startDate || '')
      const end = new Date(optimisticItinerary.segments.find(s => s.id === c.id)?.endDate || '')
      return dateObj >= start && dateObj <= end
    })
    
    if (!chapter) return 'bg-slate-400'
    
    if (chapter.type === 'travel') return 'bg-blue-400'
    if (chapter.type === 'stay') return 'bg-rose-400'
    return 'bg-emerald-400'
  }

  return (
    <div className="space-y-6 animate-fade-in">
       {/* Visual Calendar Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-4">
             <h3 className="font-bold text-slate-900 text-sm">{optimisticItinerary.dayCount}-Day Journey</h3>
             <div className="flex gap-1">
               <button onClick={() => scrollCalendar('left')} className="p-1 hover:bg-slate-100 rounded-full text-slate-500 hover:text-blue-600 transition-colors">
                 <ChevronLeft size={16} />
               </button>
               <button onClick={() => scrollCalendar('right')} className="p-1 hover:bg-slate-100 rounded-full text-slate-500 hover:text-blue-600 transition-colors">
                 <ChevronRight size={16} />
               </button>
             </div>
          </div>
          <div className="flex gap-2 text-[10px]">
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-100 border border-blue-200 rounded-sm"></div> Travel</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-100 border border-rose-200 rounded-sm"></div> Stay</span>
          </div>
        </div>

        {/* Days Grid - Scrollable Container */}
        <div 
          className="overflow-x-auto pb-4 pt-2 -mx-4 px-4 no-scrollbar scroll-smooth"
          ref={scrollContainerRef}
        >
          <div className="flex gap-1.5 min-w-max">
            {allDays.map((dayObj, idx) => {
              const hasMoment = hasMoments(dayObj.fullId)
              const isSelected = selectedDate === dayObj.fullId
              const isNewMonth = idx === 0 || dayObj.month !== allDays[idx-1].month

              return (
                <div key={idx} className="flex flex-col">
                  {isNewMonth && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-1 sticky left-0">
                      {dayObj.month}
                    </span>
                  )}
                  <button 
                    onClick={() => scrollToDate(dayObj.fullId)}
                    className={`
                      relative flex-shrink-0 w-11 h-16 rounded-lg border transition-all duration-200 flex flex-col items-center justify-start pt-2
                      ${isSelected ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50 scale-105 z-10' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}
                      ${!isNewMonth ? 'mt-[18px]' : ''}
                    `}
                  >
                    <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{dayObj.date}</span>
                    <span className="text-[9px] text-slate-400 uppercase">
                       {getDayOfWeek(idx, itinerary.startDate)}
                    </span>
                    
                    {/* Moment Dot Indicator */}
                    {hasMoment && (
                      <div className="mt-1 w-1 h-1 rounded-full bg-slate-400"></div>
                    )}

                    {/* Chapter Bar Visualization */}
                    <div className="absolute bottom-1.5 inset-x-1 h-1 rounded-full overflow-hidden flex">
                       <div className={`w-full h-full ${getChapterBarColor(dayObj.dateObj)}`}></div>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Chapters & Moments List */}
      <div className="space-y-8">
        {calendarData.chapters.map((chapter) => {
          const chapterMoments = calendarData.moments.filter(m => m.chapterId === chapter.id)
          
          return (
            <div key={chapter.id} id={`segment-${chapter.id}`} className={`relative scroll-mt-[120px] ${
                highlightedId === `segment-${chapter.id}` ? 'animate-highlight-pulse' : ''
              }`}>
              
              {/* Compact Chapter Header */}
              <div className="sticky top-[65px] z-20 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 py-3 mb-4 transition-all">
                 <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{chapter.title}</h3>
                        <Badge className={`${chapter.color} text-[9px] px-1.5`}>{chapter.type}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-medium">
                        <span>{chapter.start} - {chapter.end}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="flex items-center gap-1"><MapPin size={10} /> {chapter.location}</span>
                         {chapter.timeZone && (
                          <>
                           <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                           <span className="flex items-center gap-1"><Clock size={10} /> {chapter.timeZone}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const returnUrl = `/view1/${optimisticItinerary.id}?tab=${currentTab}`
                          router.push(`/reservations/new/natural?segmentId=${chapter.id}&tripId=${optimisticItinerary.id}&returnTo=${encodeURIComponent(returnUrl)}`)
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors border border-dashed border-indigo-300 hover:border-indigo-400"
                        title="Add reservation with natural language"
                      >
                        <Sparkles size={12} />
                        <span>Add</span>
                      </button>
                      <ActionIcon icon={MessageCircle} label="Chat" />
                      <button
                        onClick={() => {
                          const returnUrl = `/view1/${optimisticItinerary.id}?tab=${currentTab}`
                          router.push(`/segment/${chapter.id}/edit?returnTo=${encodeURIComponent(returnUrl)}`)
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} className="text-slate-600" />
                      </button>
                    </div>
                 </div>
              </div>

              {/* Days & Moments List */}
              {(() => {
                // Get the segment to access start/end dates
                const segment = optimisticItinerary.segments.find(s => s.id === chapter.id)
                if (!segment) return null
                
                // Generate all days with their moments grouped
                const segmentDays = getSegmentDaysWithMoments(
                  segment.startDate,
                  segment.endDate,
                  chapterMoments
                )
                
                return (
                  <div className="space-y-4 pl-3 md:pl-4 border-l-2 border-slate-200 ml-2">
                    {segmentDays.map((dayObj, dayIdx) => {
                      const dayFullId = dayObj.fullId
                      const isSelected = selectedDate === dayFullId
                      
                      return (
                        <div key={dayFullId} id={`date-${dayFullId}`} className="relative">
                          {/* Day Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`absolute -left-[19px] md:-left-[23px] w-3 h-3 rounded-full border-2 border-white shadow-sm transition-colors duration-300 ${
                              isSelected ? 'bg-blue-600' : dayObj.moments.length > 0 ? 'bg-slate-400' : 'bg-slate-200'
                            }`}></div>
                            <span className={`text-xs font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                              {dayObj.weekday}, {dayObj.monthShort} {dayObj.date}
                            </span>
                          </div>
                          
                          {/* Moments for this day */}
                          {dayObj.moments.length > 0 ? (
                            <div className="space-y-2 ml-1">
                              {dayObj.moments.map((moment) => {
                                const momentId = `${moment.month}-${moment.date}`
                                
                                // Render continuation indicator for multi-day reservations (days 2+)
                                if (moment.isContinuation) {
                                  const label = moment.nightNumber 
                                    ? `Night ${moment.nightNumber} of ${moment.totalNights}`
                                    : `Day ${moment.dayNumber} of ${moment.totalDays}`
                                  
                                  return (
                                    <div key={moment.id} className="relative">
                                      {/* Continuation indicator - subtle and compact */}
                                      <div 
                                        className="p-2 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors"
                                        onClick={() => {
                                          // Scroll to the parent reservation
                                          if (moment.parentReservationId) {
                                            const parentElement = document.getElementById(`reservation-${moment.parentReservationId}`)
                                            if (parentElement) {
                                              parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                            }
                                          }
                                        }}
                                        title={`View full ${moment.reservationType === 'hotel' ? 'hotel' : 'rental'} details`}
                                      >
                                        <moment.icon className="w-3 h-3 text-slate-400" />
                                        <span>{moment.title} — {label}</span>
                                      </div>
                                    </div>
                                  )
                                }
                                
                                // Render full reservation card (day 1 or single-day reservations)
                                return (
                                  <div key={moment.id}>
                                    <div 
                                      id={`reservation-${moment.id}`}
                                      data-date-id={`date-${momentId}`}
                                      className={`relative group transition-all duration-300 scroll-mt-[140px] ${
                                        highlightedId === `reservation-${moment.id}` ? 'animate-highlight-pulse' : ''
                                      }`}
                                    >
                                      <Card className={`p-3 flex items-center gap-4 ${selectedDate === momentId ? 'ring-1 ring-blue-500 shadow-md bg-blue-50/30' : ''}`}>
                                          {/* Time Column */}
                                          <div className="flex flex-col items-center min-w-[45px] text-center">
                                            {moment.endTime ? (
                                              // Two-line layout with arrow for reservations with end time
                                              <div className="flex flex-col items-center gap-0.5">
                                                <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md leading-none whitespace-nowrap">
                                                  {moment.time}
                                                </span>
                                                <div className="flex items-center gap-0.5 text-slate-400">
                                                  <ArrowDown className="w-2.5 h-2.5" />
                                                  {moment.endDateDiff != null && moment.endDateDiff > 0 && (
                                                    <span className="text-[8px] font-medium">+{moment.endDateDiff}d</span>
                                                  )}
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md leading-none whitespace-nowrap">
                                                  {moment.endTime}
                                                </span>
                                              </div>
                                            ) : (
                                              // Single time display
                                              <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md leading-none whitespace-nowrap">
                                                {moment.time}
                                              </span>
                                            )}
                                          </div>

                                          {/* Content */}
                                          <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                              <h4 className="font-bold text-sm text-slate-900 truncate">{moment.title}</h4>
                                              <moment.icon className="text-slate-400 flex-shrink-0" size={14} />
                                              {/* Multi-day badge for hotels */}
                                              {moment.isMultiDay && moment.totalNights && moment.totalNights > 1 && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-0.5">
                                                  <Moon className="w-2.5 h-2.5" />
                                                  {moment.totalNights} nights
                                                </span>
                                              )}
                                              {/* Multi-day badge for transport/car rentals */}
                                              {moment.isMultiDay && moment.totalDays && moment.totalDays > 1 && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                                  {moment.totalDays} days
                                                </span>
                                              )}
                                              {/* Badge for reservations displayed on different day than actual date */}
                                              {moment.displayedOnDifferentDay && moment.actualDateDisplay && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                  {moment.reservationType === 'hotel' ? 'Check-in' : 'Actual'}: {moment.actualDateDisplay}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-xs text-slate-500 truncate">Reservation confirmed</p>
                                          </div>
                                          
                                          {/* Action Icons */}
                                          <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
                                             <button
                                               onClick={() => handleDelete(moment.id)}
                                               className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-md transition-all"
                                               title="Delete"
                                             >
                                               <Trash2 size={14} className="text-red-600" />
                                             </button>
                                             <ActionIcon icon={MessageCircle} />
                                             <ActionIcon 
                                               icon={Edit2} 
                                               onClick={() => editReservation(optimisticItinerary.id, moment.id, moment.chapterId, 'timeline')}
                                             />
                                          </div>
                                      </Card>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            /* Empty day placeholder */
                            <div className="ml-1 py-2 px-3 rounded-lg bg-slate-50/50 border border-dashed border-slate-200 text-xs text-slate-400">
                              No reservations
                            </div>
                          )}
                        </div>
                      )
                    })}
                    
                    {/* Add Reservation Button - After all days */}
                    <div className="relative mt-3">
                      <div className="absolute -left-[19px] md:-left-[23px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-dashed border-indigo-300 bg-white"></div>
                      <button
                        onClick={() => {
                          const returnUrl = `/view1/${optimisticItinerary.id}?tab=${currentTab}`
                          router.push(`/reservations/new/natural?segmentId=${chapter.id}&tripId=${optimisticItinerary.id}&returnTo=${encodeURIComponent(returnUrl)}`)
                        }}
                        className="w-full py-2.5 px-3 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors border border-dashed border-indigo-200 hover:border-indigo-400 flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={12} />
                        <span>Add reservation</span>
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>

    </div>
  )
}

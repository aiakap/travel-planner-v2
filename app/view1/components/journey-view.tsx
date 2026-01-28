"use client"

import { useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { MapPin, Clock, MessageCircle, Edit2, ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "./card"
import { Badge } from "./badge"
import { ActionIcon } from "./action-icon"
import { generateAllDays, mapToCalendarData, getDayOfWeek } from "../lib/view-utils"
import { editReservation } from "../lib/chat-integration"

interface JourneyViewProps {
  itinerary: ViewItinerary
}

export function JourneyView({ itinerary }: JourneyViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const allDays = generateAllDays(itinerary.startDate, itinerary.endDate)
  const calendarData = mapToCalendarData(itinerary)
  
  // Get current tab from URL
  const currentTab = searchParams.get('tab') || 'journey'

  const scrollToDate = (fullId: string) => {
    setSelectedDate(fullId)
    
    const momentElement = document.getElementById(`date-${fullId}`)
    
    if (momentElement) {
      momentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      // Find relevant chapter
      const relevantChapter = calendarData.chapters.find(c => c.dateRange.includes(fullId))
      if (relevantChapter) {
        const chapterElement = document.getElementById(`chapter-${relevantChapter.id}`)
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
      const start = new Date(itinerary.segments.find(s => s.id === c.id)?.startDate || '')
      const end = new Date(itinerary.segments.find(s => s.id === c.id)?.endDate || '')
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
             <h3 className="font-bold text-slate-900 text-sm">{itinerary.dayCount}-Day Journey</h3>
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
            <div key={chapter.id} id={`chapter-${chapter.id}`} className="relative scroll-mt-[120px]">
              
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
                      <ActionIcon icon={MessageCircle} label="Chat" />
                      <button
                        onClick={() => {
                          const returnUrl = `/view1?tab=${currentTab}`
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

              {/* Moments List */}
              <div className="space-y-3 pl-3 md:pl-4 border-l-2 border-slate-200 ml-2">
                {chapterMoments.map((moment) => {
                  const momentId = `${moment.month}-${moment.date}`
                  return (
                    <div 
                      id={`date-${momentId}`} 
                      key={moment.id} 
                      className={`relative group transition-all duration-300 scroll-mt-[140px]`}
                    >
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[19px] md:-left-[23px] top-4 w-3 h-3 rounded-full border-2 border-white shadow-sm transition-colors duration-300
                        ${selectedDate === momentId ? 'bg-blue-600 scale-125' : 'bg-slate-300 group-hover:bg-blue-400'}
                      `}></div>

                      <Card className={`p-3 flex items-center gap-4 ${selectedDate === momentId ? 'ring-1 ring-blue-500 shadow-md bg-blue-50/30' : ''}`}>
                          {/* Time & Date Column */}
                          <div className="flex flex-col items-center min-w-[45px] text-center">
                            <span className="text-xs font-bold text-slate-900 leading-none">{moment.date}</span>
                            <span className="text-[9px] uppercase font-bold text-slate-400 mb-1">{moment.month.slice(0,3)}</span>
                            <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md leading-none">
                              {moment.time}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-bold text-sm text-slate-900 truncate">{moment.title}</h4>
                              <moment.icon className="text-slate-400 flex-shrink-0" size={14} />
                            </div>
                            <p className="text-xs text-slate-500 truncate">Reservation confirmed</p>
                          </div>
                          
                          {/* Action Icons */}
                          <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
                             <ActionIcon icon={MessageCircle} />
                             <ActionIcon 
                               icon={Edit2} 
                               onClick={() => editReservation(itinerary.id, moment.id, moment.chapterId, 'timeline')}
                             />
                          </div>
                      </Card>
                    </div>
                  )
                })}
                
                {chapterMoments.length === 0 && (
                  <div className="text-xs text-slate-400 italic pl-2 py-2">
                    No specific moments planned. <br/>
                    <span className="text-[10px] opacity-70">Tap 'Edit' to add activities for these dates.</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

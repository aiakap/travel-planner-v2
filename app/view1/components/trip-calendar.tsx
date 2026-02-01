"use client"

import { useState, useMemo } from "react"
import type { ViewItinerary, ViewReservation } from "@/lib/itinerary-view-types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Edit2, MapPin, Clock, Plane, Hotel, Utensils, Car, Compass, Trash2 } from "lucide-react"
import { chatAboutSegment, chatAboutReservation, editReservation } from "../lib/chat-integration"
import { useOptimisticDelete } from "@/hooks/use-optimistic-delete"
import { deleteReservation } from "@/lib/actions/delete-reservation"
import { 
  generateAllDays, 
  formatDateCompact, 
  getDateNumber, 
  getWeekdayShort,
  getTripDates
} from "../lib/view-utils"

interface TripCalendarProps {
  itinerary: ViewItinerary
}

function getReservationIcon(type: ViewReservation['type']) {
  switch (type) {
    case 'flight': return Plane
    case 'hotel': return Hotel
    case 'restaurant': return Utensils
    case 'transport': return Car
    default: return Compass
  }
}

const ActionIcon = ({ icon: Icon, onClick }: { icon: any, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
  >
    <Icon size={16} />
  </button>
)

export function TripCalendar({ itinerary }: TripCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

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

  // Transform itinerary data into calendar structure (keeping dates as strings for UTC-safe handling)
  const calendarData = {
    segments: optimisticItinerary.segments.map(segment => {
      const segmentColor = itinerary.segmentColors[segment.id]
      const isTravel = segment.segmentType.toLowerCase().includes('travel') || 
                      segment.segmentType.toLowerCase().includes('flight')
      
      return {
        id: segment.id,
        title: segment.title,
        startDate: segment.startDate,
        endDate: segment.endDate,
        // Pre-compute segment date range for efficient lookup
        dateRange: getTripDates(segment.startDate, segment.endDate),
        location: segment.startTitle === segment.endTitle 
          ? segment.endTitle 
          : `${segment.startTitle} ➝ ${segment.endTitle}`,
        color: segmentColor,
        type: isTravel ? 'travel' : 'stay',
        reservations: segment.reservations.map(res => ({
          id: res.id,
          date: res.date,
          time: res.time || '00:00',
          title: res.title,
          description: res.description,
          icon: getReservationIcon(res.type),
          segmentId: segment.id
        }))
      }
    })
  }

  // Generate calendar days using UTC-safe function
  const calendarDays = useMemo(() => {
    if (calendarData.segments.length === 0) return []
    
    // Use UTC-safe generateAllDays and transform to the format we need
    const allDays = generateAllDays(optimisticItinerary.startDate, optimisticItinerary.endDate)
    const tripDates = getTripDates(optimisticItinerary.startDate, optimisticItinerary.endDate)
    
    return allDays.map((day, idx) => ({
      date: day.date,
      month: day.month.slice(0, 3), // Convert "January" to "Jan"
      day: getWeekdayShort(tripDates[idx]),
      fullDate: tripDates[idx],
      dateObj: day.dateObj
    }))
  }, [optimisticItinerary.startDate, optimisticItinerary.endDate, calendarData.segments.length])

  // Group days by month
  const daysByMonth = calendarDays.reduce((acc, day) => {
    if (!acc[day.month]) {
      acc[day.month] = []
    }
    acc[day.month].push(day)
    return acc
  }, {} as Record<string, typeof calendarDays>)

  // Check if a date has moments (reservations)
  const hasMoments = (fullDate: string) => {
    return calendarData.segments.some(segment =>
      segment.reservations.some(res => res.date === fullDate)
    )
  }

  // Get segment for a specific date (UTC-safe using string comparison)
  const getSegmentForDate = (fullDate: string) => {
    return calendarData.segments.find(segment => 
      segment.dateRange.includes(fullDate)
    )
  }

  const scrollToMoment = (fullDate: string) => {
    setSelectedDate(fullDate)
    const element = document.getElementById(`date-${fullDate}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Get color class based on hex color
  const getColorClass = (hexColor: string) => {
    // Convert hex to RGB and determine if it's more blue, red, or neutral
    const r = parseInt(hexColor.slice(1, 3), 16)
    const g = parseInt(hexColor.slice(3, 5), 16)
    const b = parseInt(hexColor.slice(5, 7), 16)
    
    if (b > r && b > g) return 'bg-blue-400'
    if (r > b && r > g) return 'bg-rose-400'
    return 'bg-slate-400'
  }

  return (
    <div className="space-y-6">
      {/* Visual Calendar Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-slate-900 text-sm">Trip Calendar</h3>
          <div className="flex gap-2 text-[10px]">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-100 border border-blue-200 rounded-sm"></div> Travel
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-rose-100 border border-rose-200 rounded-sm"></div> Stay
            </span>
          </div>
        </div>

        {/* Days Grid */}
        <div className="overflow-x-auto pb-2 no-scrollbar">
          <div className="min-w-[500px]">
            <div className="flex gap-6 mb-2">
              {Object.keys(daysByMonth).map(month => (
                <div key={month} className="flex-1 font-semibold text-slate-400 text-[10px] uppercase tracking-wider pl-1">
                  {month}
                </div>
              ))}
            </div>
            
            <div className="flex gap-1.5">
              {calendarDays.map((day, idx) => {
                const hasMoment = hasMoments(day.fullDate)
                const isSelected = selectedDate === day.fullDate
                const segment = getSegmentForDate(day.fullDate)

                return (
                  <button 
                    key={`${day.fullDate}-${idx}`}
                    onClick={() => scrollToMoment(day.fullDate)}
                    className={`
                      relative flex-shrink-0 w-11 h-16 rounded-lg border transition-all duration-200 flex flex-col items-center justify-start pt-2
                      ${isSelected ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}
                    `}
                  >
                    <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                      {day.date}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase">
                      {day.day}
                    </span>
                    
                    {/* Moment Dot Indicator */}
                    {hasMoment && (
                      <div className="mt-1 w-1 h-1 rounded-full bg-slate-400"></div>
                    )}

                    {/* Chapter Bar Visualization */}
                    {segment && (
                      <div className="absolute bottom-1.5 inset-x-1 h-1 rounded-full overflow-hidden">
                        <div 
                          className={getColorClass(segment.color)}
                          style={{ width: '100%', height: '100%' }}
                        ></div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Chapters & Moments List */}
      <div className="space-y-8">
        {calendarData.segments.map((segment) => {
          const segmentMoments = segment.reservations
          
          return (
            <div key={segment.id} className="relative">
              
              {/* Compact Chapter Header */}
              <div className="sticky top-[120px] z-20 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 py-3 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{segment.title}</h3>
                      <Badge 
                        className={`text-[9px] px-1.5 ${
                          segment.type === 'travel' 
                            ? 'bg-blue-100 text-blue-700 border-blue-200' 
                            : 'bg-rose-100 text-rose-700 border-rose-200'
                        }`}
                      >
                        {segment.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-medium">
                      <span>
                        {formatDateCompact(segment.startDate)} - {formatDateCompact(segment.endDate)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="flex items-center gap-1">
                        <MapPin size={10} /> {segment.location}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <ActionIcon 
                      icon={MessageCircle} 
                      onClick={() => chatAboutSegment(optimisticItinerary.id, optimisticItinerary.segments.find(s => s.id === segment.id)!, 'calendar')}
                    />
                    <ActionIcon icon={Edit2} />
                  </div>
                </div>
              </div>

              {/* Moments List */}
              <div className="space-y-3 pl-3 md:pl-4 border-l-2 border-slate-200 ml-2">
                {segmentMoments.map((moment) => {
                  const dayInfo = calendarDays.find(d => d.fullDate === moment.date)
                  
                  return (
                    <div 
                      id={`date-${moment.date}`}
                      key={moment.id} 
                      className="relative group transition-all duration-300"
                    >
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[19px] md:-left-[23px] top-4 w-3 h-3 rounded-full border-2 border-white shadow-sm transition-colors duration-300
                        ${selectedDate === moment.date ? 'bg-blue-600 scale-125' : 'bg-slate-300 group-hover:bg-blue-400'}
                      `}></div>

                      <Card className={`p-3 flex items-center gap-4 ${selectedDate === moment.date ? 'ring-1 ring-blue-500 shadow-md' : ''}`}>
                        {/* Time & Date Column */}
                        <div className="flex flex-col items-center min-w-[45px] text-center">
                          <span className="text-xs font-bold text-slate-900 leading-none">
                            {dayInfo?.date || getDateNumber(moment.date)}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-slate-400 mb-1">
                            {dayInfo?.day || getWeekdayShort(moment.date)}
                          </span>
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
                          <p className="text-xs text-slate-500 truncate">
                            {moment.description || 'Reservation confirmed'}
                          </p>
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
                          <ActionIcon 
                            icon={MessageCircle}
                            onClick={() => {
                              const res = optimisticItinerary.segments
                                .find(s => s.id === segment.id)
                                ?.reservations.find(r => r.id === moment.id)
                              if (res) chatAboutReservation(optimisticItinerary.id, res, segment.id, 'calendar')
                            }}
                          />
                          <ActionIcon 
                            icon={Edit2}
                            onClick={() => editReservation(optimisticItinerary.id, moment.id, segment.id, 'calendar')}
                          />
                        </div>
                      </Card>
                    </div>
                  )
                })}
                
                {segmentMoments.length === 0 && (
                  <div className="text-xs text-slate-400 italic pl-2">No moments added.</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

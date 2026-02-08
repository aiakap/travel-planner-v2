"use client";

import React from 'react';
import { Plane, Car, Loader2, Clock, MapPin, ArrowRight } from 'lucide-react';

export interface TravelInfo {
  mode: 'driving' | 'flight';
  durationHours: number;
  distanceKm: number;
  durationText?: string;
  distanceText?: string;
}

interface TravelSegmentIndicatorProps {
  from: { name: string; lat?: number; lng?: number };
  to: { name: string; lat?: number; lng?: number };
  type: 'outbound' | 'return';
  isCalculating: boolean;
  travelInfo?: TravelInfo | null;
  startDate?: Date | null;
  arrivalDate?: Date | null;
}

/**
 * Format duration in a human-readable way
 */
function formatDuration(hours: number): string {
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `~${mins}m`;
  }
  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return remainingHours > 0 ? `~${days}d ${remainingHours}h` : `~${days}d`;
}

/**
 * Get a contextual description based on travel time and mode
 */
function getTravelDescription(travelInfo: TravelInfo): string {
  const { mode, durationHours } = travelInfo;
  
  if (mode === 'driving') {
    if (durationHours < 2) return 'Quick drive';
    if (durationHours < 5) return 'Same day travel';
    if (durationHours < 8) return 'Long drive - consider leaving early';
    return 'Very long drive';
  }
  
  // Flight
  if (durationHours < 3) return 'Short flight';
  if (durationHours < 6) return 'Medium flight';
  if (durationHours < 12) return 'Long flight';
  return 'Multi-leg journey - arrives next day';
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Calculate departure date given arrival date and travel hours
 * For flights, add buffer time for airport procedures
 */
export function calculateDepartureDate(
  arrivalDate: Date,
  travelHours: number,
  mode: 'flight' | 'driving'
): Date {
  // For flights: account for airport time (+3h each side = 6h total buffer)
  const totalHours = mode === 'flight' ? travelHours + 6 : travelHours;
  const result = new Date(arrivalDate);
  result.setHours(result.getHours() - totalHours);
  return result;
}

/**
 * Calculate arrival date given departure date and travel hours
 */
export function calculateArrivalDate(
  departureDate: Date,
  travelHours: number,
  mode: 'flight' | 'driving'
): Date {
  // For flights: account for airport time (+3h each side = 6h total buffer)
  const totalHours = mode === 'flight' ? travelHours + 6 : travelHours;
  const result = new Date(departureDate);
  result.setHours(result.getHours() + totalHours);
  return result;
}

export function TravelSegmentIndicator({
  from,
  to,
  type,
  isCalculating,
  travelInfo,
  startDate,
  arrivalDate,
}: TravelSegmentIndicatorProps) {
  // Don't render if we don't have location data
  if (!from.name || !to.name) return null;

  // Shorten location names for display
  const fromShort = from.name.split(',')[0].trim();
  const toShort = to.name.split(',')[0].trim();

  // Calculate dates based on travel info
  let departureStr = '';
  let arrivalStr = '';
  
  if (travelInfo && startDate) {
    if (type === 'outbound' && arrivalDate) {
      // For outbound: departure is before first destination's start date
      const departDate = calculateDepartureDate(arrivalDate, travelInfo.durationHours, travelInfo.mode);
      departureStr = formatDate(departDate);
      arrivalStr = formatDate(arrivalDate);
    } else if (type === 'return' && startDate) {
      // For return: departure is the last day at destination
      const arriveDate = calculateArrivalDate(startDate, travelInfo.durationHours, travelInfo.mode);
      departureStr = formatDate(startDate);
      arrivalStr = formatDate(arriveDate);
    }
  }

  const showDates = departureStr && arrivalStr && departureStr !== arrivalStr;

  return (
    <div className="col-span-full">
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
        ${type === 'outbound' 
          ? 'bg-blue-50/50 border-blue-200/50' 
          : 'bg-amber-50/50 border-amber-200/50'
        }
      `}>
        {/* Icon */}
        <div className={`
          w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
          ${type === 'outbound' 
            ? 'bg-blue-100 text-blue-600' 
            : 'bg-amber-100 text-amber-600'
          }
        `}>
          {isCalculating ? (
            <Loader2 size={18} className="animate-spin" />
          ) : travelInfo?.mode === 'flight' ? (
            <Plane size={18} />
          ) : (
            <Car size={18} />
          )}
        </div>

        {/* Route Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <span className="truncate">{fromShort}</span>
            <ArrowRight size={14} className="text-stone-400 flex-shrink-0" />
            <span className="truncate">{toShort}</span>
          </div>
          
          {isCalculating ? (
            <div className="text-xs text-stone-400 mt-0.5">
              Calculating travel time...
            </div>
          ) : travelInfo ? (
            <div className="text-xs text-stone-500 mt-0.5">
              {getTravelDescription(travelInfo)}
            </div>
          ) : (
            <div className="text-xs text-stone-400 mt-0.5">
              Unable to calculate travel time
            </div>
          )}
        </div>

        {/* Duration & Distance */}
        {!isCalculating && travelInfo && (
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Duration */}
            <div className="flex items-center gap-1.5 text-stone-600">
              <Clock size={14} className="text-stone-400" />
              <span className="text-sm font-semibold">
                {formatDuration(travelInfo.durationHours)}
              </span>
            </div>

            {/* Distance */}
            <div className="hidden sm:flex items-center gap-1.5 text-stone-500">
              <MapPin size={14} className="text-stone-400" />
              <span className="text-xs">
                {travelInfo.distanceKm >= 1000 
                  ? `${(travelInfo.distanceKm / 1000).toFixed(1)}k km`
                  : `${Math.round(travelInfo.distanceKm)} km`
                }
              </span>
            </div>

            {/* Dates */}
            {showDates && (
              <div className={`
                hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md text-xs
                ${type === 'outbound' 
                  ? 'bg-blue-100/50 text-blue-700' 
                  : 'bg-amber-100/50 text-amber-700'
                }
              `}>
                <span>Depart {departureStr}</span>
                <ArrowRight size={10} />
                <span>Arrive {arrivalStr}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

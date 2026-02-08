"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  ArrowRight,
  Calendar, 
  Check, 
  Plus,
  Minus,
  Trash2,
  Home,
  Globe,
  Loader2,
  Play
} from 'lucide-react';
import { searchPlacesAutocomplete, type PlaceResult } from '../actions/google-places-autocomplete';
import { 
  createDraftTrip, 
  updateTripMetadata, 
  syncSegments 
} from '../actions/trip-builder-actions';
import { finalizeDraftTrip } from '@/lib/actions/finalize-draft-trip';
import { HomeLocationData } from '@/lib/types/home-location';
import { TravelSegmentIndicator, type TravelInfo } from './travel-segment-indicator';

/**
 * TYPES
 */
interface Chapter {
  id: string;
  dbId?: string;
  location: string;
  days: number;
  image: string | null;
  placeId?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
  timezoneOffset?: number;
}

interface JourneyManagerProps {
  segmentTypeMap: Record<string, string>;
  homeLocation?: HomeLocationData | null;
  initialTrip?: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    description?: string | null;
  };
  initialSegments?: Array<{
    id: string;
    name: string;
    days: number;
    startTitle: string;
    imageUrl: string | null;
    startLat?: number | null;
    startLng?: number | null;
    segmentType?: { name: string };
  }>;
  onComplete?: (tripId: string) => void;
}

/**
 * DATE HELPERS
 */
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDateISO = (date: Date): string => {
  // Use local date methods to avoid UTC conversion issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * JOURNEY HEADER COMPONENT
 */
interface JourneyHeaderProps {
  journeyName: string;
  onNameChange: (name: string) => void;
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  totalDays: number;
  saveStatus: 'saved' | 'saving' | 'error' | 'idle';
  onBack: () => void;
  canContinue: boolean;
  onContinue: () => void;
  isTransitioning: boolean;
}

const JourneyHeader = ({ 
  journeyName, 
  onNameChange, 
  startDate, 
  setStartDate, 
  totalDays, 
  saveStatus,
  onBack,
  canContinue,
  onContinue,
  isTransitioning
}: JourneyHeaderProps) => {
  
  const handleDateToggle = (isChecked: boolean) => {
    if (isChecked) {
      setStartDate(null);
    } else {
      setStartDate(new Date());
    }
  };

  const endDate = startDate ? addDays(startDate, totalDays) : null;

  return (
    <div className="bg-white border-b border-stone-200 sticky top-0 z-50 px-6 py-4 shadow-sm flex items-center justify-between">
      {/* Back + Title Section */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-stone-600" />
        </button>
        <div>
          <input 
            value={journeyName}
            onChange={(e) => onNameChange(e.target.value)}
            className="font-serif text-2xl text-stone-900 placeholder:text-stone-300 outline-none bg-transparent w-full md:w-96"
            placeholder="Name your journey..."
          />
          <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
            <span className="font-medium bg-stone-100 px-2 py-0.5 rounded text-stone-600 border border-stone-200">
              {totalDays} Days
            </span>
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-stone-500">
                <Loader2 size={10} className="animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-green-600">
                <Check size={10} /> Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-500">Save failed</span>
            )}
            {saveStatus === 'idle' && (
              <span>Draft</span>
            )}
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex items-center gap-4">
        {/* Date Controller */}
        <div className="hidden md:flex items-center gap-3 bg-stone-50 border border-stone-200 p-1.5 rounded-xl">
           {/* Date Display */}
           <div className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${startDate ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}
           `}>
              <Calendar size={14} className={startDate ? "text-stone-800" : "text-stone-300"} />
              {startDate ? (
                <>
                  <input
                    type="date"
                    value={formatDateISO(startDate)}
                    onChange={(e) => setStartDate(parseLocalDate(e.target.value))}
                    className="bg-transparent outline-none cursor-pointer"
                  />
                  <span className="text-stone-400 mx-1">→</span>
                  <span>{endDate && formatDate(endDate)}</span>
                </>
              ) : (
                <span>No dates selected</span>
              )}
           </div>

           {/* Divider */}
           <div className="w-px h-4 bg-stone-200 mx-1" />

           {/* Toggle Checkbox */}
           <label className="flex items-center gap-2 cursor-pointer select-none px-2 group">
             <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${!startDate ? 'bg-stone-800 border-stone-800 text-white' : 'bg-white border-stone-300 group-hover:border-stone-400'}`}>
               {!startDate && <Check size={10} />}
             </div>
             <input 
               type="checkbox" 
               className="hidden" 
               checked={!startDate} 
               onChange={(e) => handleDateToggle(e.target.checked)} 
             />
             <span className="text-xs font-medium text-stone-600 group-hover:text-stone-900 transition-colors">Decide dates later</span>
           </label>
        </div>

        {/* Continue to Planning Button */}
        {canContinue && (
          <button
            onClick={onContinue}
            disabled={isTransitioning}
            className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl font-medium text-sm hover:bg-stone-800 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTransitioning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play size={16} />
                Continue to Planning
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * JOURNEY TILE COMPONENT
 */
interface JourneyTileProps {
  item: Chapter;
  index: number;
  startDate: Date | null;
  runningDayCount: number;
  onUpdate: (id: string, updates: Partial<Chapter>) => void;
  onDelete: (index: number) => void;
  onMove: (index: number, direction: number) => void;
  onInsert: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const JourneyTile = ({ 
  item, 
  index, 
  startDate, 
  runningDayCount, 
  onUpdate, 
  onDelete, 
  onMove,
  onInsert,
  isFirst,
  isLast 
}: JourneyTileProps) => {
  // Date Calc - startDate is now passed as the tile's actual start date
  let dateRangeStr = `Day ${runningDayCount} - Day ${runningDayCount + item.days - 1}`;
  if (startDate) {
    const end = addDays(startDate, item.days - 1);
    dateRangeStr = `${formatDate(startDate)} - ${formatDate(end)}`;
  }
  
  // Fallback image
  const bgImage = item.image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=1200';
  
  return (
    <div className="group relative w-full h-64 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 bg-stone-900">
      
      {/* CARD CONTENT CONTAINER - clipped */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        {/* Background Image */}
        <img 
          src={bgImage} 
          alt={item.location}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity" />

        {/* Top Header: Sequence & Actions */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
          <div className="flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md text-xs font-bold border border-white/20 bg-white/20 text-white">
            {index + 1}
          </div>

          {/* Hover Actions */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-[-10px] group-hover:translate-y-0 duration-200">
            <button 
              onClick={() => onMove(index, -1)} 
              disabled={isFirst}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-black flex items-center justify-center backdrop-blur-md disabled:opacity-0 transition-all"
            >
              <ArrowLeft size={14} />
            </button>
            <button 
              onClick={() => onMove(index, 1)} 
              disabled={isLast}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-black flex items-center justify-center backdrop-blur-md disabled:opacity-0 transition-all"
            >
              <ArrowRight size={14} />
            </button>
            <button 
              onClick={() => onDelete(index)} 
              className="w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center backdrop-blur-md transition-all ml-2"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex justify-between items-end mb-1">
            <h3 className="font-serif text-2xl leading-none text-white">
              {item.location}
            </h3>
          </div>
          
          <div className="flex justify-between items-end">
            <div className="text-xs font-medium uppercase tracking-widest opacity-70 mb-1">
              {dateRangeStr}
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-lg p-1 border border-white/10">
                <button 
                  onClick={() => onUpdate(item.id, { days: Math.max(1, item.days - 1) })}
                  className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-md transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="text-sm font-bold tabular-nums min-w-[2ch] text-center">{item.days}d</span>
                <button 
                  onClick={() => onUpdate(item.id, { days: Math.min(60, item.days + 1) })}
                  className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-md transition-colors"
                >
                  <Plus size={12} />
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* INSERT BUTTON (RIGHT EDGE) */}
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
         <button 
           onClick={onInsert}
           className="bg-stone-900 text-white p-1.5 rounded-full border-2 border-white shadow-lg hover:scale-110 transition-transform"
           title="Insert chapter after"
         >
           <Plus size={16} />
         </button>
      </div>
    </div>
  );
};

/**
 * ADD TILE COMPONENT
 */
interface AddTileProps {
  onAdd: (chapter: Omit<Chapter, 'id'>) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

const AddTile = ({ onAdd, onCancel, autoFocus }: AddTileProps) => {
  const [isInput, setIsInput] = useState(autoFocus || false);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = async (value: string) => {
    setInput(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length > 1) {
      setIsLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const places = await searchPlacesAutocomplete(value);
          setSuggestions(places);
        } catch (error) {
          console.error('Error searching places:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  };

  const handleSelectPlace = (place: PlaceResult) => {
    onAdd({
      location: place.name,
      days: 3,
      image: place.image,
      placeId: place.placeId,
      lat: place.lat,
      lng: place.lng,
      timezone: place.timezone,
      timezoneOffset: place.timezoneOffset,
    });
    setInput('');
    setSuggestions([]);
    if (!autoFocus) setIsInput(false);
  };

  const handleCancel = () => {
    setInput('');
    setSuggestions([]);
    if (onCancel) {
      onCancel();
    } else {
      setIsInput(false);
    }
  };

  if (isInput) {
    return (
      <div className="w-full h-64 rounded-2xl bg-white border-2 border-stone-900 border-dashed flex flex-col items-center justify-center p-6 shadow-sm animate-fade-in relative">
        <h4 className="font-serif text-xl text-stone-800 mb-4">
           {autoFocus ? "Insert Chapter" : "Next Chapter?"}
        </h4>
        <div className="relative w-full">
          <input 
            autoFocus
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search for a city..."
            className="w-full text-center text-lg border-b border-stone-200 py-2 outline-none placeholder:text-stone-300 focus:border-stone-800 transition-colors bg-transparent"
          />
          {isLoading && (
            <Loader2 size={16} className="absolute right-2 top-3 animate-spin text-stone-400" />
          )}
        </div>
        
        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-[140px] left-4 right-4 bg-white border border-stone-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
            {suggestions.map((place) => (
              <button
                key={place.placeId}
                onClick={() => handleSelectPlace(place)}
                className="w-full px-4 py-3 text-left hover:bg-stone-50 flex items-center gap-3 border-b border-stone-100 last:border-0"
              >
                {place.image && (
                  <img src={place.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                )}
                <span className="font-medium text-stone-800">{place.name}</span>
              </button>
            ))}
          </div>
        )}
        
        <div className="flex gap-2 w-full mt-6">
          <button 
            onClick={handleCancel}
            className="flex-1 py-3 rounded-xl text-stone-500 hover:bg-stone-100 font-medium text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button 
      onClick={() => setIsInput(true)}
      className="group w-full h-64 rounded-2xl bg-stone-50 border-2 border-stone-200 border-dashed flex flex-col items-center justify-center gap-4 text-stone-400 hover:text-stone-600 hover:border-stone-400 hover:bg-stone-100 transition-all cursor-pointer"
    >
      <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Plus size={24} className="text-stone-400 group-hover:text-stone-800" />
      </div>
      <span className="font-medium text-sm tracking-wide uppercase">Add Chapter</span>
    </button>
  );
};

/**
 * MAIN JOURNEY MANAGER COMPONENT
 */
export function JourneyManager({ 
  segmentTypeMap, 
  homeLocation,
  initialTrip, 
  initialSegments,
  onComplete 
}: JourneyManagerProps) {
  const router = useRouter();
  
  // State
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [journeyName, setJourneyName] = useState('');
  const [isTitleManual, setIsTitleManual] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  
  // Settings State
  const [settings, setSettings] = useState({
    startFromHome: true,
    endAtHome: true,
  });

  // Auto-save state
  const [tripId, setTripId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tripIdRef = useRef<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // Continue to planning state
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Travel calculation state
  const [outboundTravel, setOutboundTravel] = useState<TravelInfo | null>(null);
  const [returnTravel, setReturnTravel] = useState<TravelInfo | null>(null);
  const [isCalculatingTravel, setIsCalculatingTravel] = useState(false);

  // Initialize from existing trip (edit mode)
  useEffect(() => {
    if (initialTrip) {
      setTripId(initialTrip.id);
      tripIdRef.current = initialTrip.id;
      setJourneyName(initialTrip.title || "");
      setIsTitleManual(true);
      setStartDate(new Date(initialTrip.startDate));
      setSaveStatus('saved');
    }
  }, [initialTrip]);

  // Initialize segments from existing trip
  useEffect(() => {
    if (initialSegments && initialSegments.length > 0) {
      const mappedChapters: Chapter[] = initialSegments.map((seg) => ({
        id: seg.id,
        dbId: seg.id,
        location: seg.startTitle || seg.name,
        days: seg.days || 1,
        image: seg.imageUrl,
        lat: seg.startLat ?? undefined,
        lng: seg.startLng ?? undefined,
      }));
      setChapters(mappedChapters);
    }
  }, [initialSegments]);

  // Auto-generate title logic
  useEffect(() => {
    if (!isTitleManual && chapters.length > 0) {
      const names = chapters.map(c => c.location.split(',')[0].trim());
      setJourneyName(names.join(' → '));
    }
  }, [chapters, isTitleManual]);

  // Calculate travel times when chapters or settings change
  useEffect(() => {
    async function calculateTravelTimes() {
      if (!homeLocation || chapters.length === 0) {
        setOutboundTravel(null);
        setReturnTravel(null);
        return;
      }

      setIsCalculatingTravel(true);

      try {
        const promises: Promise<void>[] = [];

        // Calculate outbound travel (home -> first destination)
        if (settings.startFromHome) {
          const firstDest = chapters[0];
          promises.push(
            fetch(`/api/travel-time?origin=${encodeURIComponent(homeLocation.name)}&destination=${encodeURIComponent(firstDest.location)}`)
              .then(res => res.json())
              .then(data => {
                if (!data.error) {
                  setOutboundTravel(data as TravelInfo);
                } else {
                  setOutboundTravel(null);
                }
              })
              .catch(() => setOutboundTravel(null))
          );
        } else {
          setOutboundTravel(null);
        }

        // Calculate return travel (last destination -> home)
        if (settings.endAtHome) {
          const lastDest = chapters[chapters.length - 1];
          promises.push(
            fetch(`/api/travel-time?origin=${encodeURIComponent(lastDest.location)}&destination=${encodeURIComponent(homeLocation.name)}`)
              .then(res => res.json())
              .then(data => {
                if (!data.error) {
                  setReturnTravel(data as TravelInfo);
                } else {
                  setReturnTravel(null);
                }
              })
              .catch(() => setReturnTravel(null))
          );
        } else {
          setReturnTravel(null);
        }

        await Promise.all(promises);
      } catch (error) {
        console.error('Error calculating travel times:', error);
      } finally {
        setIsCalculatingTravel(false);
      }
    }

    calculateTravelTimes();
  }, [chapters, homeLocation, settings.startFromHome, settings.endAtHome]);

  const handleNameChange = (val: string) => {
    setJourneyName(val);
    setIsTitleManual(true);
    setHasUserInteracted(true);
  };

  // Calculate total days at destinations
  const totalDestinationDays = chapters.reduce((acc, c) => acc + c.days, 0);

  // Calculate travel days based on actual travel info
  const calculateTravelDays = (travelInfo: TravelInfo | null): number => {
    if (!travelInfo) return 1; // Default to 1 day if not calculated yet
    const totalHours = travelInfo.mode === 'flight' 
      ? travelInfo.durationHours + 6 // Add airport buffer
      : travelInfo.durationHours;
    return Math.max(1, Math.ceil(totalHours / 24));
  };

  const outboundTravelDays = settings.startFromHome && homeLocation 
    ? calculateTravelDays(outboundTravel) 
    : 0;
  const returnTravelDays = settings.endAtHome && homeLocation && chapters.length > 0 
    ? calculateTravelDays(returnTravel) 
    : 0;

  // Total trip days including travel
  const totalTripDays = totalDestinationDays + outboundTravelDays + returnTravelDays;

  // Generate summary for saving
  const getGeneratedSummary = () => {
    const dateRange = startDate 
      ? `${formatDate(startDate)} - ${formatDate(addDays(startDate, totalTripDays - 1))}`
      : `${totalTripDays} days`;
    const chapterList = chapters.map(c => c.location).join(' → ');
    
    // Include travel info in summary
    let travelInfo = '';
    if (outboundTravel && settings.startFromHome) {
      travelInfo += `\nOutbound: ${outboundTravel.mode === 'flight' ? 'Flight' : 'Drive'} ~${Math.round(outboundTravel.durationHours)}h`;
    }
    if (returnTravel && settings.endAtHome) {
      travelInfo += `\nReturn: ${returnTravel.mode === 'flight' ? 'Flight' : 'Drive'} ~${Math.round(returnTravel.durationHours)}h`;
    }
    
    return `${totalTripDays} Days · ${dateRange}\nJourney: ${chapterList}${travelInfo}`;
  };

  // --- AUTO-SAVE LOGIC ---
  useEffect(() => {
    if (!hasUserInteracted || chapters.length === 0) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('saving');

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Use already-calculated travel days (totalTripDays already includes travel)
        const startDateStr = startDate ? formatDateISO(startDate) : formatDateISO(new Date());
        const endDateStr = formatDateISO(addDays(startDate || new Date(), totalTripDays - 1));
        
        if (!tripIdRef.current) {
          // First save - create trip
          const id = await createDraftTrip({
            title: journeyName || "Untitled Journey",
            description: getGeneratedSummary(),
            startDate: startDateStr,
            endDate: endDateStr,
          });
          tripIdRef.current = id;
          setTripId(id);
        } else {
          // Build all segments including travel segments
          const allSegments: Array<{
            id: string;
            dbId?: string;
            type: string;
            name: string;
            days: number;
            start_location: string;
            end_location: string;
            start_image: string | null;
            end_image: string | null;
            start_lat?: number;
            start_lng?: number;
            end_lat?: number;
            end_lng?: number;
            order: number;
            startTime: string;
            endTime: string;
          }> = [];
          
          let currentOrder = 0;
          let currentDayOffset = 0;
          
          // Add Travel Out segment if starting from home
          if (settings.startFromHome && homeLocation) {
            const travelOutStart = addDays(startDate || new Date(), currentDayOffset);
            const firstDestination = chapters[0]?.location || '';
            const outboundDays = outboundTravelDays;
            const travelOutEnd = addDays(travelOutStart, outboundDays - 1);
            const transportMode = outboundTravel?.mode === 'flight' ? 'Flight' : 'Drive';
            
            allSegments.push({
              id: 'travel-out',
              type: 'TRAVEL',
              name: firstDestination ? `${transportMode} to ${firstDestination.split(',')[0].trim()}` : 'Journey Begins',
              days: outboundDays,
              start_location: homeLocation.name,
              end_location: firstDestination,
              start_image: homeLocation.imageUrl,
              end_image: chapters[0]?.image || null,
              start_lat: homeLocation.lat ?? undefined,
              start_lng: homeLocation.lng ?? undefined,
              end_lat: chapters[0]?.lat,
              end_lng: chapters[0]?.lng,
              order: currentOrder,
              startDate: formatDateISO(travelOutStart),
              endDate: formatDateISO(travelOutEnd),
            });
            currentOrder++;
            currentDayOffset += outboundDays;
          }
          
          // Add chapter segments (STAY type) with adjusted dates
          chapters.forEach((chapter, idx) => {
            const daysBefore = chapters.slice(0, idx).reduce((sum, c) => sum + c.days, 0);
            const segStart = addDays(startDate || new Date(), currentDayOffset + daysBefore);
            const segEnd = addDays(segStart, chapter.days - 1);
            
            allSegments.push({
              id: chapter.id,
              dbId: chapter.dbId,
              type: 'STAY',
              name: chapter.location.split(',')[0].trim(),
              days: chapter.days,
              start_location: chapter.location,
              end_location: chapter.location,
              start_image: chapter.image,
              end_image: null,
              start_lat: chapter.lat,
              start_lng: chapter.lng,
              order: currentOrder,
              startDate: formatDateISO(segStart),
              endDate: formatDateISO(segEnd),
            });
            currentOrder++;
          });
          
          // Add Travel Home segment if returning home
          if (settings.endAtHome && homeLocation) {
            const lastChapter = chapters[chapters.length - 1];
            const totalChapterDays = chapters.reduce((sum, c) => sum + c.days, 0);
            const travelHomeStart = addDays(startDate || new Date(), currentDayOffset + totalChapterDays);
            const returnDays = returnTravelDays;
            const travelHomeEnd = addDays(travelHomeStart, returnDays - 1);
            const transportMode = returnTravel?.mode === 'flight' ? 'Flight' : 'Drive';
            
            allSegments.push({
              id: 'travel-home',
              type: 'TRAVEL',
              name: `${transportMode} back to ${homeLocation.name.split(',')[0].trim()}`,
              days: returnDays,
              start_location: lastChapter?.location || '',
              end_location: homeLocation.name,
              start_image: lastChapter?.image || null,
              end_image: homeLocation.imageUrl,
              start_lat: lastChapter?.lat,
              start_lng: lastChapter?.lng,
              end_lat: homeLocation.lat ?? undefined,
              end_lng: homeLocation.lng ?? undefined,
              order: currentOrder,
              startDate: formatDateISO(travelHomeStart),
              endDate: formatDateISO(travelHomeEnd),
            });
          }

          await Promise.all([
            updateTripMetadata(tripIdRef.current, {
              title: journeyName,
              description: getGeneratedSummary(),
              startDate: startDateStr,
              endDate: endDateStr,
            }),
            syncSegments(tripIdRef.current, allSegments, segmentTypeMap),
          ]);
        }
        setSaveStatus('saved');
      } catch (error) {
        console.error('Error saving trip:', error);
        setSaveStatus('error');
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [journeyName, startDate, chapters, hasUserInteracted, totalTripDays, segmentTypeMap, settings, homeLocation, outboundTravel, returnTravel, outboundTravelDays, returnTravelDays]);

  // --- HANDLERS ---
  const handleAddChapter = (chapterData: Omit<Chapter, 'id'>, index: number | null = null) => {
    setHasUserInteracted(true);
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      ...chapterData,
    };

    if (index !== null) {
      const newChapters = [...chapters];
      newChapters.splice(index, 0, newChapter);
      setChapters(newChapters);
      setInsertIndex(null);
    } else {
      setChapters([...chapters, newChapter]);
    }
  };

  const handleUpdateChapter = (id: string, updates: Partial<Chapter>) => {
    setHasUserInteracted(true);
    setChapters(chapters.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleDeleteChapter = (index: number) => {
    setHasUserInteracted(true);
    const newChapters = [...chapters];
    newChapters.splice(index, 1);
    setChapters(newChapters);
  };

  const handleMoveChapter = (index: number, direction: number) => {
    setHasUserInteracted(true);
    const newChapters = [...chapters];
    const target = index + direction;
    if (target < 0 || target >= newChapters.length) return;
    [newChapters[index], newChapters[target]] = [newChapters[target], newChapters[index]];
    setChapters(newChapters);
  };

  const handleBack = () => {
    router.back();
  };

  const handleContinueToPlanning = async () => {
    if (!tripIdRef.current || chapters.length === 0) return;
    
    setIsTransitioning(true);
    try {
      // Finalize draft: set default theme, placeholder image, queue AI generation, update status
      const result = await finalizeDraftTrip(tripIdRef.current);
      console.log('Trip finalized:', result);
      
      // Navigate to view1 with the trip ID
      router.push(`/view1/${tripIdRef.current}`);
    } catch (error) {
      console.error('Error transitioning to planning:', error);
      setIsTransitioning(false);
    }
  };

  // Build timeline items - only actual chapters (no home tiles)
  const timelineItems: Chapter[] = [...chapters];

  // Helper to get first destination arrival date (for outbound indicator)
  const getFirstDestinationArrivalDate = (): Date | null => {
    if (!startDate || chapters.length === 0) return null;
    // If starting from home with travel, first destination starts after travel
    if (settings.startFromHome && outboundTravel) {
      // Calculate travel days (round up hours to full days for trip planning)
      const travelHours = outboundTravel.mode === 'flight' 
        ? outboundTravel.durationHours + 6 // Add airport buffer
        : outboundTravel.durationHours;
      const travelDays = Math.ceil(travelHours / 24);
      return addDays(startDate, travelDays);
    }
    return startDate;
  };

  // Helper to get last destination departure date (for return indicator)
  const getLastDestinationDepartureDate = (): Date | null => {
    if (!startDate || chapters.length === 0) return null;
    const arrivalDate = getFirstDestinationArrivalDate();
    if (!arrivalDate) return startDate;
    
    // Calculate total days spent at destinations
    const totalDestinationDays = chapters.reduce((sum, c) => sum + c.days, 0);
    return addDays(arrivalDate, totalDestinationDays - 1);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans pb-32">
      {/* Header */}
      <JourneyHeader 
        journeyName={journeyName} 
        onNameChange={handleNameChange}
        startDate={startDate}
        setStartDate={(date) => {
          setStartDate(date);
          setHasUserInteracted(true);
        }}
        totalDays={totalTripDays}
        saveStatus={saveStatus}
        onBack={handleBack}
        canContinue={chapters.length > 0 && tripIdRef.current !== null && saveStatus !== 'saving'}
        onContinue={handleContinueToPlanning}
        isTransitioning={isTransitioning}
      />

      {/* Compact Settings Bar */}
      <div className="bg-white/50 border-b border-stone-200 px-6 py-2 backdrop-blur-sm sticky top-[81px] z-40">
         <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
            <div className="flex items-center gap-2 text-stone-500">
               <Home size={12} className="text-stone-400" />
               <span className="hidden sm:inline">Home Base:</span> 
               <strong className="text-stone-800">
                 {homeLocation?.name || 'Not set'}
               </strong>
               {!homeLocation && (
                 <button 
                   onClick={() => router.push('/profile')}
                   className="text-stone-400 hover:text-stone-800 transition-colors"
                 >
                   Set up
                 </button>
               )}
            </div>
            <div className="flex items-center gap-4">
               <label className="flex items-center gap-2 cursor-pointer select-none hover:text-stone-800 transition-colors">
                 <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${settings.startFromHome ? 'bg-stone-800 border-stone-800 text-white' : 'bg-white border-stone-300'}`}>
                   {settings.startFromHome && <Check size={8} />}
                 </div>
                 <input 
                   type="checkbox" 
                   className="hidden" 
                   checked={settings.startFromHome} 
                   onChange={(e) => setSettings({...settings, startFromHome: e.target.checked})} 
                 />
                 <span className="text-stone-600">Start from Home</span>
               </label>

               <label className="flex items-center gap-2 cursor-pointer select-none hover:text-stone-800 transition-colors">
                 <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${settings.endAtHome ? 'bg-stone-800 border-stone-800 text-white' : 'bg-white border-stone-300'}`}>
                   {settings.endAtHome && <Check size={8} />}
                 </div>
                 <input 
                   type="checkbox" 
                   className="hidden" 
                   checked={settings.endAtHome} 
                   onChange={(e) => setSettings({...settings, endAtHome: e.target.checked})} 
                 />
                 <span className="text-stone-600">Return Home</span>
               </label>
            </div>
         </div>
      </div>

      {/* Main Grid Canvas */}
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Outbound Travel Indicator */}
          {settings.startFromHome && homeLocation && chapters.length > 0 && (
            <TravelSegmentIndicator
              from={{ 
                name: homeLocation.name, 
                lat: homeLocation.lat ?? undefined, 
                lng: homeLocation.lng ?? undefined 
              }}
              to={{ 
                name: chapters[0].location, 
                lat: chapters[0].lat, 
                lng: chapters[0].lng 
              }}
              type="outbound"
              isCalculating={isCalculatingTravel}
              travelInfo={outboundTravel}
              startDate={startDate}
              arrivalDate={getFirstDestinationArrivalDate()}
            />
          )}

          {timelineItems.length === 0 ? (
             <div className="col-span-full flex flex-col items-center justify-center py-32 text-stone-300 border-2 border-dashed border-stone-200 rounded-3xl">
               <Globe size={64} className="mb-4 text-stone-200" />
               <p className="font-serif text-2xl text-stone-400">Where to first?</p>
               {settings.startFromHome && homeLocation && (
                 <p className="text-sm text-stone-400 mt-2">
                   Add your first destination to see travel time from {homeLocation.name.split(',')[0]}
                 </p>
               )}
             </div>
          ) : (
            (() => {
              // Calculate starting day accounting for outbound travel
              let runningDay = 1;
              if (settings.startFromHome && outboundTravel) {
                const travelHours = outboundTravel.mode === 'flight' 
                  ? outboundTravel.durationHours + 6 
                  : outboundTravel.durationHours;
                runningDay += Math.ceil(travelHours / 24);
              }
              
              const renderedItems: React.ReactNode[] = [];

              timelineItems.forEach((item, idx) => {
                 const currentRunningDay = runningDay;
                 runningDay += item.days;
                 
                 const isFirstChapter = idx === 0;
                 const isLastChapter = idx === chapters.length - 1;

                 renderedItems.push(
                  <JourneyTile 
                    key={item.id}
                    item={item}
                    index={idx}
                    startDate={startDate ? addDays(startDate, currentRunningDay - 1) : null}
                    runningDayCount={currentRunningDay}
                    onUpdate={handleUpdateChapter}
                    onDelete={() => handleDeleteChapter(idx)}
                    onMove={(_, dir) => handleMoveChapter(idx, dir)}
                    onInsert={() => setInsertIndex(idx)}
                    isFirst={isFirstChapter}
                    isLast={isLastChapter}
                  />
                 );

                 if (insertIndex === idx) {
                    renderedItems.push(
                      <AddTile 
                        key={`insert-${idx}`}
                        autoFocus={true}
                        onAdd={(data) => handleAddChapter(data, idx + 1)}
                        onCancel={() => setInsertIndex(null)}
                      />
                    );
                 }
              });
              
              return renderedItems;
            })()
          )}
          
          {/* Return Travel Indicator */}
          {settings.endAtHome && homeLocation && chapters.length > 0 && (
            <TravelSegmentIndicator
              from={{ 
                name: chapters[chapters.length - 1].location, 
                lat: chapters[chapters.length - 1].lat, 
                lng: chapters[chapters.length - 1].lng 
              }}
              to={{ 
                name: homeLocation.name, 
                lat: homeLocation.lat ?? undefined, 
                lng: homeLocation.lng ?? undefined 
              }}
              type="return"
              isCalculating={isCalculatingTravel}
              travelInfo={returnTravel}
              startDate={getLastDestinationDepartureDate()}
              arrivalDate={null}
            />
          )}
          
          {/* The "Add" Button is always a tile in the grid */}
          <AddTile onAdd={(data) => handleAddChapter(data)} />
        </div>
      </div>
    </div>
  );
}

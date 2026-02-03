"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar, 
  Plus,
  Trash2,
  X,
  Check,
  ChevronDown,
  Info,
  HelpCircle,
  ArrowRight,
  ChevronUp,
  Minus,
  Home
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PlaceAutocompleteLive } from './place-autocomplete-live';
import { SEGMENT_TYPES, getSegmentStyle, type SegmentTypeConfig } from '../lib/segment-types';
import { 
  createDraftTrip, 
  updateTripMetadata, 
  syncSegments 
} from '../actions/trip-builder-actions';
import { finalizeTrip } from '../actions/finalize-trip';
import { HandDrawnTooltip } from '@/components/ui/hand-drawn-tooltip';
import { TooltipOverlay } from '@/components/ui/tooltip-overlay';
import { LocationManagerModal } from './location-manager-modal';
import { DateChangeModal } from './date-change-modal';
import { HomeLocationData } from '@/lib/types/home-location';

interface Segment {
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
  start_timezone?: string;
  end_timezone?: string;
  start_timezone_offset?: number;
  end_timezone_offset?: number;
  sameLocation?: boolean;
}

interface TripBuilderClientProps {
  segmentTypeMap: Record<string, string>;
  homeLocation?: HomeLocationData; // User's home location with Google Places data
  initialTrip?: any; // Pre-loaded trip from Journey Architect
  initialSegments?: Segment[]; // Pre-loaded segments
  onUpdate?: (data: any) => void; // Callback for updates
  onComplete?: (tripId: string) => void; // Callback when trip is finalized
}

// Parse date string as local timezone to avoid UTC conversion issues
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];
const formatDateReadable = (dateStr: string) => {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const addDays = (date: Date | string, days: number) => {
  let result: Date;
  if (typeof date === 'string') {
    // Parse string dates in local timezone to avoid UTC conversion
    result = parseLocalDate(date);
  } else {
    result = new Date(date);
  }
  result.setDate(result.getDate() + days);
  return result;
};

// Helper to determine if a segment type should default to same location
const defaultSameLocation = (type: string): boolean => {
  return ['STAY', 'RETREAT', 'TOUR'].includes(type.toUpperCase());
};

export function TripBuilderClient({ 
  segmentTypeMap, 
  homeLocation,
  initialTrip, 
  initialSegments,
  onUpdate,
  onComplete 
}: TripBuilderClientProps) {
  const router = useRouter();
  const [journeyName, setJourneyName] = useState("");
  const [manualSummary, setManualSummary] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [anchor, setAnchor] = useState<'start' | 'end'>('start');
  
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [duration, setDuration] = useState(7);
  
  const calculateEndDate = (start: string, days: number) => formatDate(addDays(new Date(start), days - 1));
  const calculateStartDate = (end: string, days: number) => formatDate(addDays(new Date(end), -(days - 1)));

  const [endDate, setEndDate] = useState(calculateEndDate(startDate, duration));
  const [segments, setSegments] = useState<Segment[]>([]);
  const [openTypeSelectorIndex, setOpenTypeSelectorIndex] = useState<number | null>(null);
  const [typeSelectorPosition, setTypeSelectorPosition] = useState<{ top: number; left: number } | null>(null);
  const typeSelectorRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const startDateInputRef = useRef<HTMLInputElement>(null);

  // Auto-save state
  const [tripId, setTripId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tripIdRef = useRef<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // Home location toggle state
  const [includeHomeStart, setIncludeHomeStart] = useState(true);
  const [includeHomeEnd, setIncludeHomeEnd] = useState(true);
  
  // Location manager modal state
  const [locationManagerState, setLocationManagerState] = useState<{
    isOpen: boolean;
    initialFocusIndex?: number;
    initialFocusField?: 'start_location' | 'end_location';
  }>({
    isOpen: false,
    initialFocusIndex: undefined,
    initialFocusField: undefined
  });
  
  // Date change modal state
  const [dateChangeModal, setDateChangeModal] = useState<{
    isOpen: boolean;
    changeType: 'chapter_increase' | 'chapter_decrease' | 'trip_duration_change';
    daysDelta: number;
    sourceChapterIndex?: number;
    sourceChapterName?: string;
  } | null>(null);
  
  // Initialize from external props (for Journey Architect integration)
  useEffect(() => {
    if (initialTrip) {
      setTripId(initialTrip.id);
      tripIdRef.current = initialTrip.id;
      setJourneyName(initialTrip.title || "");
      setStartDate(formatDate(new Date(initialTrip.startDate)));
      setEndDate(formatDate(new Date(initialTrip.endDate)));
      
      // Calculate duration from dates
      const start = new Date(initialTrip.startDate);
      const end = new Date(initialTrip.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setDuration(days);
    }
  }, [initialTrip]);
  
  useEffect(() => {
    if (initialSegments && initialSegments.length > 0) {
      // Map database segments to UI format
      const mappedSegments = initialSegments.map((seg: any) => ({
        id: seg.id,
        dbId: seg.id,
        type: seg.segmentType?.name || 'Stay',
        name: seg.name,
        days: seg.days || 1,
        start_location: seg.startTitle,
        end_location: seg.endTitle,
        start_image: seg.imageUrl,
        end_image: null,
        sameLocation: defaultSameLocation(seg.segmentType?.name || 'Stay'),
      }));
      setSegments(mappedSegments);
    }
  }, [initialSegments]);

  // Tooltip system state
  const [currentTooltipStep, setCurrentTooltipStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [tourDismissed, setTourDismissed] = useState(false);
  
  // Refs for tooltip targets
  const journeyNameRef = useRef<HTMLInputElement>(null);
  const dateControlsRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const firstChapterRef = useRef<HTMLInputElement>(null);
  const firstTypeRef = useRef<HTMLButtonElement>(null);
  const firstLocationRef = useRef<HTMLDivElement>(null);

  // --- LOGIC ENGINE ---
  const generateSkeleton = (totalDays: number): Segment[] => {
    const mkSeg = (type: string, name: string, days: number, start = "", end = ""): Segment => ({
      id: crypto.randomUUID(),
      type,
      name,
      days,
      start_location: start,
      end_location: end,
      start_image: null,
      end_image: null,
      sameLocation: defaultSameLocation(type),
    });

    if (totalDays === 1) {
      return [mkSeg('STAY', 'The Adventure', 1)];
    } else if (totalDays === 2) {
      return [mkSeg('STAY', 'First Stop', 1), mkSeg('STAY', 'Second Stop', 1)];
    } else {
      const stayDays = totalDays - 2;
      // Use home location for first and last travel segments if available and toggles are enabled
      // Home location data for first segment (start)
      const homeStart = (homeLocation && includeHomeStart) ? homeLocation.name : "";
      const homeStartImage = (homeLocation && includeHomeStart) ? homeLocation.imageUrl : null;
      const homeStartLat = (homeLocation && includeHomeStart) ? homeLocation.lat : undefined;
      const homeStartLng = (homeLocation && includeHomeStart) ? homeLocation.lng : undefined;
      
      // Home location data for last segment (end)
      const homeEnd = (homeLocation && includeHomeEnd) ? homeLocation.name : "";
      const homeEndImage = (homeLocation && includeHomeEnd) ? homeLocation.imageUrl : null;
      const homeEndLat = (homeLocation && includeHomeEnd) ? homeLocation.lat : undefined;
      const homeEndLng = (homeLocation && includeHomeEnd) ? homeLocation.lng : undefined;
      
      return [
        {
          ...mkSeg('TRAVEL', 'Journey Begins', 1, homeStart, ""),
          start_image: homeStartImage,
          start_lat: homeStartLat,
          start_lng: homeStartLng,
        },
        mkSeg('STAY', 'The Adventure', stayDays),
        {
          ...mkSeg('TRAVEL', 'Journey Home', 1, "", homeEnd),
          end_image: homeEndImage,
          end_lat: homeEndLat,
          end_lng: homeEndLng,
        },
      ];
    }
  };

  const adjustSegmentsToDuration = (currentSegments: Segment[], newTotalDays: number): Segment[] => {
    const currentTotal = currentSegments.reduce((sum, s) => sum + s.days, 0);
    const diff = newTotalDays - currentTotal;
    if (diff === 0) return currentSegments;

    let nextSegments = [...currentSegments];

    if (newTotalDays < 3 && currentSegments.length > 2) {
      return generateSkeleton(newTotalDays);
    }
    
    if (diff > 0) {
      const stayIndex = nextSegments.findIndex(s => s.name === 'The Adventure') !== -1 
        ? nextSegments.findIndex(s => s.name === 'The Adventure') 
        : Math.floor(nextSegments.length / 2);
      nextSegments[stayIndex].days += diff;
    } else {
      let daysToRemove = Math.abs(diff);
      while (daysToRemove > 0) {
        let longestIdx = -1;
        let maxDays = 1;
        nextSegments.forEach((seg, idx) => {
          if (seg.days > maxDays) {
            maxDays = seg.days;
            longestIdx = idx;
          }
        });

        if (longestIdx !== -1) {
          nextSegments[longestIdx].days -= 1;
          daysToRemove--;
        } else {
          nextSegments.pop();
          daysToRemove--;
        }
      }
    }
    return nextSegments;
  };

  // Calculate if we have minimum info to enable timeline interaction
  const hasMinimumInfo = journeyName.trim().length > 0;
  const showTimeline = true; // Always show timeline, but gray out when incomplete

  // Generate segments when timeline should be shown
  useEffect(() => {
    if (showTimeline && segments.length === 0) {
      setSegments(generateSkeleton(duration));
    }
  }, [showTimeline, duration]);

  // Load tour state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('tripBuilderTourDismissed');
    if (dismissed === 'true') {
      setTourDismissed(true);
    } else {
      // Start tour on first visit
      setCurrentTooltipStep('welcome');
    }
  }, []);

  // Tooltip progression logic
  useEffect(() => {
    if (tourDismissed) return;

    // Step 1: Welcome - show on initial load
    if (currentTooltipStep === null && !journeyName && completedSteps.size === 0) {
      setCurrentTooltipStep('welcome');
    }

    // Step 2: Show dates tooltip when title is filled
    if (journeyName.trim().length > 0 && !completedSteps.has('welcome') && currentTooltipStep === 'welcome') {
      // User started typing, advance to dates
      setCompletedSteps(new Set([...completedSteps, 'welcome']));
      setCurrentTooltipStep('dates');
    }

    // Step 3: Show timeline celebration when both title and dates are set
    if (showTimeline && completedSteps.has('dates') && !completedSteps.has('timeline')) {
      setCompletedSteps(new Set([...completedSteps, 'dates']));
      setCurrentTooltipStep('timeline');
      // Auto-advance after 5 seconds
      setTimeout(() => {
        setCompletedSteps(prev => new Set([...prev, 'timeline']));
        setCurrentTooltipStep('chapterName');
      }, 5000);
    }

    // Step 4: Show chapter name tooltip when timeline is visible
    if (showTimeline && segments.length > 0 && completedSteps.has('timeline') && !completedSteps.has('chapterName')) {
      const hasRenamedChapter = segments.some(s => 
        !['The Adventure', 'First Stop', 'Second Stop', 'Journey Begins', 'Journey Home', 'New Adventure'].includes(s.name)
      );
      if (hasRenamedChapter) {
        setCompletedSteps(new Set([...completedSteps, 'chapterName']));
        setCurrentTooltipStep('chapterType');
      }
    }

    // Step 5: Show type tooltip after chapter renamed
    if (completedSteps.has('chapterName') && !completedSteps.has('chapterType')) {
      // Check if user has changed any types
      const hasChangedType = segments.some((s, i) => {
        if (i === 0 && s.type !== 'TRAVEL') return true;
        if (i === segments.length - 1 && s.type !== 'TRAVEL') return true;
        return false;
      });
      if (hasChangedType) {
        setCompletedSteps(new Set([...completedSteps, 'chapterType']));
        setCurrentTooltipStep('location');
      }
    }

    // Step 6: Show location tooltip
    if (completedSteps.has('chapterType') && !completedSteps.has('location')) {
      const hasLocation = segments.some(s => s.start_location || s.end_location);
      if (hasLocation) {
        setCompletedSteps(new Set([...completedSteps, 'location']));
        setCurrentTooltipStep('advanced');
      }
    }

    // Step 7: Show advanced features tooltip
    if (completedSteps.has('location') && !completedSteps.has('advanced')) {
      // Auto-advance after showing
      setTimeout(() => {
        setCompletedSteps(new Set([...completedSteps, 'advanced']));
        setCurrentTooltipStep(null);
        setTourDismissed(true);
        localStorage.setItem('tripBuilderTourDismissed', 'true');
      }, 8000);
    }
  }, [journeyName, showTimeline, segments, currentTooltipStep, completedSteps, tourDismissed]);

  const stepOrder = ['welcome', 'dates', 'timeline', 'chapterName', 'chapterType', 'location', 'advanced'];

  const handleNextTooltip = () => {
    if (currentTooltipStep) {
      setCompletedSteps(new Set([...completedSteps, currentTooltipStep]));
    }
    const currentIndex = stepOrder.indexOf(currentTooltipStep || '');
    if (currentIndex < stepOrder.length - 1) {
      setCurrentTooltipStep(stepOrder[currentIndex + 1]);
    } else {
      setCurrentTooltipStep(null);
      setTourDismissed(true);
      localStorage.setItem('tripBuilderTourDismissed', 'true');
    }
  };

  const handlePreviousTooltip = () => {
    const currentIndex = stepOrder.indexOf(currentTooltipStep || '');
    if (currentIndex > 0) {
      setCurrentTooltipStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleCloseTooltip = () => {
    if (currentTooltipStep) {
      setCompletedSteps(new Set([...completedSteps, currentTooltipStep]));
    }
    handleNextTooltip();
  };

  const handleSkipTour = () => {
    setTourDismissed(true);
    setCurrentTooltipStep(null);
    localStorage.setItem('tripBuilderTourDismissed', 'true');
  };

  const getCurrentStepNumber = () => {
    return stepOrder.indexOf(currentTooltipStep || '') + 1;
  };

  // --- LOCATION HELPERS ---
  interface LocationSuggestion {
    title: string;
    description: string;
    targets: Array<{ index: number; field: 'start_location' | 'end_location'; name: string; type: string }>;
    autoSelect?: boolean;
  }

  const generateLocationSuggestions = (
    allSegments: Segment[],
    sourceIndex: number,
    sourceField: 'start_location' | 'end_location',
    value: string
  ): LocationSuggestion[] => {
    const suggestions: LocationSuggestion[] = [];
    
    // Special case: First chapter start location
    if (sourceIndex === 0 && sourceField === 'start_location') {
      const lastIndex = allSegments.length - 1;
      if (lastIndex > 0 && !allSegments[lastIndex].end_location) {
        suggestions.push({
          title: "Round Trip",
          description: "Set this as your return destination",
          targets: [{
            index: lastIndex,
            field: 'end_location',
            name: allSegments[lastIndex].name,
            type: SEGMENT_TYPES[allSegments[lastIndex].type.toUpperCase()]?.label || allSegments[lastIndex].type
          }],
          autoSelect: true
        });
      }
    }
    
    // Find all blank matching locations
    const blankTargets = allSegments
      .map((seg, idx) => ({ seg, idx }))
      .filter(({ seg, idx }) => idx !== sourceIndex && !seg[sourceField]?.trim())
      .map(({ seg, idx }) => ({
        index: idx,
        field: sourceField,
        name: seg.name,
        type: SEGMENT_TYPES[seg.type.toUpperCase()]?.label || seg.type
      }));
      
    if (blankTargets.length > 0) {
      suggestions.push({
        title: `Other ${sourceField === 'start_location' ? 'Starting' : 'Ending'} Locations`,
        description: `Apply to chapters with blank ${sourceField === 'start_location' ? 'start' : 'end'} locations`,
        targets: blankTargets,
        autoSelect: false
      });
    }
    
    return suggestions;
  };

  const findSegmentsWithBlankLocations = (allSegments: Segment[], field: 'start_location' | 'end_location', excludeIndex: number): Array<{ index: number; name: string; type: string }> => {
    return allSegments
      .map((seg, idx) => ({ seg, idx }))
      .filter(({ seg, idx }) => idx !== excludeIndex && !seg[field]?.trim())
      .map(({ seg, idx }) => ({
        index: idx,
        name: seg.name,
        type: SEGMENT_TYPES[seg.type.toUpperCase()]?.label || seg.type
      }));
  };

  const applyLocationToSegments = (selections: Array<{ index: number; field: 'start_location' | 'end_location' }>, value: string, imageUrl: string | null) => {
    const newSegments = [...segments];
    
    selections.forEach(({ index, field }) => {
      const imageField = field === 'start_location' ? 'start_image' : 'end_image';
      newSegments[index][field] = value;
      newSegments[index][imageField] = imageUrl;
      
      // If it's a single location segment type, sync both start and end
      const typeConfig = SEGMENT_TYPES[newSegments[index].type.toUpperCase()];
      if (typeConfig?.singleLocation) {
        const otherField = field === 'start_location' ? 'end_location' : 'start_location';
        const otherImageField = field === 'start_location' ? 'end_image' : 'start_image';
        newSegments[index][otherField] = value;
        newSegments[index][otherImageField] = imageUrl;
      }
    });
    
    setSegments(newSegments);
  };

  const handleLocationTyping = (index: number, field: 'start_location' | 'end_location', value: string, imageUrl: string | null = null) => {
    setHasUserInteracted(true);
    const newSegments = [...segments];
    const segment = newSegments[index];
    const typeConfig = SEGMENT_TYPES[segment.type.toUpperCase()] || SEGMENT_TYPES.STAY;

    segment[field] = value;
    
    const imageField = field === 'start_location' ? 'start_image' : 'end_image';
    
    if (imageUrl) {
      segment[imageField] = imageUrl;
    } else if (value === '') {
      segment[imageField] = null;
    }

    // Single Location Sync
    if (typeConfig.singleLocation) {
      if (field === 'start_location') {
        segment.end_location = value;
        if (imageUrl || value === '') segment.end_image = segment.start_image;
      }
      if (field === 'end_location') {
        segment.start_location = value;
        if (imageUrl || value === '') segment.start_image = segment.end_image;
      }
    }

    setSegments(newSegments);
  };

  const handleLocationSelected = (index: number, field: 'start_location' | 'end_location', value: string, imageUrl: string | null = null) => {
    // Location already updated by typing handler, now show intelligent prompt
    if (value.trim() !== '') {
      const suggestions = generateLocationSuggestions(segments, index, field, value);
      if (suggestions.length > 0) {
        setLocationPromptModal({
          sourceIndex: index,
          sourceSegment: segments[index].name,
          field,
          value,
          imageUrl,
          suggestions
        });
      }
    }
  };

  // --- TYPE SELECTOR ---
  const handleOpenTypeSelector = (index: number, buttonElement: HTMLButtonElement) => {
    if (openTypeSelectorIndex === index) {
      setOpenTypeSelectorIndex(null);
      setTypeSelectorPosition(null);
    } else {
      const rect = buttonElement.getBoundingClientRect();
      setTypeSelectorPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
      setOpenTypeSelectorIndex(index);
    }
  };

  // --- SEGMENT REORDERING ---
  const moveSegmentUp = (index: number) => {
    if (index === 0) return;
    setHasUserInteracted(true);
    const newSegments = [...segments];
    [newSegments[index], newSegments[index - 1]] = [newSegments[index - 1], newSegments[index]];
    setSegments(newSegments);
  };

  const moveSegmentDown = (index: number) => {
    if (index === segments.length - 1) return;
    setHasUserInteracted(true);
    const newSegments = [...segments];
    [newSegments[index], newSegments[index + 1]] = [newSegments[index + 1], newSegments[index]];
    setSegments(newSegments);
  };

  // --- DAY ADJUSTMENT ---
  const adjustSegmentDays = (index: number, delta: number) => {
    setHasUserInteracted(true);
    
    // Show modal asking how to handle the change
    setDateChangeModal({
      isOpen: true,
      changeType: delta > 0 ? 'chapter_increase' : 'chapter_decrease',
      daysDelta: delta,
      sourceChapterIndex: index,
      sourceChapterName: segments[index].name
    });
  };

  // --- DATE CHANGE MODAL HANDLER ---
  const handleDateChangeApply = (action: string, targetChapterIndex?: number) => {
    if (!dateChangeModal) return;
    
    const { daysDelta, sourceChapterIndex } = dateChangeModal;
    const newSegments = [...segments];
    
    if (action === 'adjust_trip_start') {
      // Adjust trip start date
      const newStart = formatDate(addDays(new Date(startDate), -daysDelta));
      setStartDate(newStart);
      setAnchor('start');
      setEndDate(calculateEndDate(newStart, duration + daysDelta));
      setDuration(duration + daysDelta);
      
      // Update the chapter that initiated the change
      if (sourceChapterIndex !== undefined) {
        newSegments[sourceChapterIndex].days += daysDelta;
        setSegments(newSegments);
      }
      
    } else if (action === 'adjust_trip_end') {
      // Adjust trip end date
      const newEnd = formatDate(addDays(new Date(endDate), daysDelta));
      setEndDate(newEnd);
      setAnchor('end');
      setStartDate(calculateStartDate(newEnd, duration + daysDelta));
      setDuration(duration + daysDelta);
      
      // Update the chapter that initiated the change
      if (sourceChapterIndex !== undefined) {
        newSegments[sourceChapterIndex].days += daysDelta;
        setSegments(newSegments);
      }
      
    } else if (action === 'take_from_chapter') {
      // Transfer days between chapters
      if (sourceChapterIndex !== undefined && targetChapterIndex !== undefined) {
        newSegments[sourceChapterIndex].days += daysDelta;
        newSegments[targetChapterIndex].days -= daysDelta;
        setSegments(newSegments);
      }
    }
    
    setDateChangeModal(null);
  };

  // --- CHAPTER DATE CALCULATION ---
  const getChapterDates = (index: number): { start: Date; end: Date } => {
    const daysBefore = segments.slice(0, index).reduce((sum, s) => sum + s.days, 0);
    const chapterStart = addDays(parseLocalDate(startDate), daysBefore);
    const chapterEnd = addDays(chapterStart, segments[index].days - 1);
    return { start: chapterStart, end: chapterEnd };
  };

  const getGeneratedSummary = () => {
    const dateRange = `${formatDateReadable(startDate)} - ${formatDateReadable(endDate)}`;
    const segmentList = segments.map(s => {
      let loc = '';
      if (s.start_location && s.end_location && s.start_location !== s.end_location) {
        loc = ` (${s.start_location} → ${s.end_location})`;
      } else if (s.start_location) {
        loc = ` (${s.start_location})`;
      }
      return `${s.name}${loc}`;
    }).join(' → ');
    return `${duration} Days · ${dateRange}\nJourney Plan: ${segmentList}`;
  };

  // --- AUTO-SAVE LOGIC ---
  useEffect(() => {
    // Don't save on initial mount - only after user interaction and timeline is shown
    if (!hasUserInteracted || !showTimeline) {
      return;
    }

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set saving status
    setSaveStatus('saving');

    // Debounce save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('🔄 Auto-save triggered, tripIdRef.current:', tripIdRef.current);
        
        // Generate summary at save time to avoid stale closures
        const dateRange = `${formatDateReadable(startDate)} - ${formatDateReadable(endDate)}`;
        const segmentList = segments.map(s => {
          let loc = '';
          if (s.start_location && s.end_location && s.start_location !== s.end_location) {
            loc = ` (${s.start_location} → ${s.end_location})`;
          } else if (s.start_location) {
            loc = ` (${s.start_location})`;
          }
          return `${s.name}${loc}`;
        }).join(' → ');
        const generatedSummary = `${duration} Days · ${dateRange}\nJourney Plan: ${segmentList}`;
        
        if (!tripIdRef.current) {
          // First save - create trip
          console.log('📝 Creating new draft trip...');
          const id = await createDraftTrip({
            title: journeyName || "Untitled Journey",
            description: manualSummary || generatedSummary,
            startDate,
            endDate,
          });
          tripIdRef.current = id;
          setTripId(id); // Update state for UI display
          console.log('✅ Created draft trip:', id);
        } else {
          // Subsequent saves - update trip and segments
          console.log('💾 Updating existing trip:', tripIdRef.current);
          const segmentsWithDates = segments.map((seg, idx) => {
            const daysBefore = segments.slice(0, idx).reduce((sum, s) => sum + s.days, 0);
            const segStart = addDays(new Date(startDate), daysBefore);
            const segEnd = addDays(segStart, seg.days - 1);
            
            return {
              ...seg,
              order: idx,
              startTime: segStart.toISOString(),
              endTime: segEnd.toISOString().replace('T00:00:00.000Z', 'T23:59:59.000Z'),
            };
          });

          await Promise.all([
            updateTripMetadata(tripIdRef.current, {
              title: journeyName,
              description: manualSummary || generatedSummary,
              startDate,
              endDate,
            }),
            syncSegments(tripIdRef.current, segmentsWithDates, segmentTypeMap),
          ]);
          console.log('✅ Saved trip updates');
        }
        setSaveStatus('saved');
      } catch (error: any) {
        console.error('❌ Error saving trip:', error);
        setSaveStatus('error');
        // Show user-friendly error message
        console.error('Error details:', error?.message || 'Unknown error');
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyName, manualSummary, startDate, endDate, segments, hasUserInteracted, showTimeline]);

  // --- HANDLERS ---
  const handleEditDatesClick = () => {
    setIsEditingDates(true);
    setTimeout(() => {
      if (startDateInputRef.current) {
        startDateInputRef.current.showPicker?.();
        startDateInputRef.current.focus();
      }
    }, 50);
  };
  
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasUserInteracted(true);
    const newDuration = parseInt(e.target.value, 10);
    setDuration(newDuration);
    if (anchor === 'start') setEndDate(calculateEndDate(startDate, newDuration));
    else setStartDate(calculateStartDate(endDate, newDuration));
    
    let nextSegments;
    const currentTotal = segments.reduce((acc, s) => acc + s.days, 0);
    if ((currentTotal < 3 && newDuration >= 3) || (currentTotal >= 3 && newDuration < 3) || 
        (currentTotal === 1 && newDuration === 2) || (currentTotal === 2 && newDuration === 1)) {
      nextSegments = generateSkeleton(newDuration);
    } else {
      nextSegments = adjustSegmentsToDuration(segments, newDuration);
    }
    setSegments(nextSegments);
  };
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasUserInteracted(true);
    const newStart = e.target.value;
    setStartDate(newStart);
    setAnchor('start');
    setEndDate(calculateEndDate(newStart, duration));
  };
  
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasUserInteracted(true);
    const newEnd = e.target.value;
    setEndDate(newEnd);
    setAnchor('end');
    setStartDate(calculateStartDate(newEnd, duration));
  };
  
  const updateDurationAndDates = (change: number, newStart: string | null = null) => {
    const newDuration = duration + change;
    setDuration(newDuration);
    if (newStart) {
      setStartDate(newStart);
      setEndDate(calculateEndDate(newStart, newDuration));
    } else {
      if (anchor === 'start') setEndDate(calculateEndDate(startDate, newDuration));
      else setStartDate(calculateStartDate(endDate, newDuration));
    }
  };

  // --- LOCATION MANAGER HANDLERS ---
  const openLocationManager = (chapterIndex: number, field: 'start_location' | 'end_location') => {
    setLocationManagerState({
      isOpen: true,
      initialFocusIndex: chapterIndex,
      initialFocusField: field
    });
  };

  const handleLocationManagerSave = (updatedSegments: Segment[]) => {
    setHasUserInteracted(true);
    setSegments(updatedSegments);
  };

  const closeLocationManager = () => {
    setLocationManagerState({
      isOpen: false,
      initialFocusIndex: undefined,
      initialFocusField: undefined
    });
  };
  
  // --- HOME LOCATION TOGGLE HANDLERS ---
  const handleToggleHomeStart = () => {
    setHasUserInteracted(true);
    const newValue = !includeHomeStart;
    setIncludeHomeStart(newValue);
    
    // Update first segment if it exists and is a TRAVEL segment
    if (segments.length > 0 && segments[0].type === 'TRAVEL') {
      const newSegments = [...segments];
      newSegments[0].start_location = newValue ? (homeLocation?.name || "") : "";
      newSegments[0].start_image = newValue ? (homeLocation?.imageUrl || null) : null;
      newSegments[0].start_lat = newValue ? homeLocation?.lat : undefined;
      newSegments[0].start_lng = newValue ? homeLocation?.lng : undefined;
      setSegments(newSegments);
    }
  };

  const handleToggleHomeEnd = () => {
    setHasUserInteracted(true);
    const newValue = !includeHomeEnd;
    setIncludeHomeEnd(newValue);
    
    // Update last segment if it exists and is a TRAVEL segment
    const lastIdx = segments.length - 1;
    if (lastIdx >= 0 && segments[lastIdx].type === 'TRAVEL') {
      const newSegments = [...segments];
      newSegments[lastIdx].end_location = newValue ? (homeLocation?.name || "") : "";
      newSegments[lastIdx].end_image = newValue ? (homeLocation?.imageUrl || null) : null;
      newSegments[lastIdx].end_lat = newValue ? homeLocation?.lat : undefined;
      newSegments[lastIdx].end_lng = newValue ? homeLocation?.lng : undefined;
      setSegments(newSegments);
    }
  };
  
  const handleInsertSegment = (indexBefore: number) => {
    setHasUserInteracted(true);
    const newSegment: Segment = {
      id: crypto.randomUUID(),
      type: 'STAY',
      name: 'New Adventure',
      days: 1,
      start_location: "",
      end_location: "",
      start_image: null,
      end_image: null,
      sameLocation: defaultSameLocation('STAY'),
    };
    const newSegments = [...segments];
    newSegments.splice(indexBefore + 1, 0, newSegment);
    setSegments(newSegments);
    if (indexBefore === -1) {
      const prevStart = parseLocalDate(startDate);
      const newStart = formatDate(addDays(prevStart, -1));
      updateDurationAndDates(1, newStart);
    } else {
      updateDurationAndDates(1);
    }
  };
  
  const handleDeleteSegment = (index: number) => {
    setHasUserInteracted(true);
    if (segments.length <= 1) return;
    const segmentToRemove = segments[index];
    const newSegments = segments.filter((_, i) => i !== index);
    setSegments(newSegments);
    updateDurationAndDates(-segmentToRemove.days);
  };
  
  const handleTypeSelect = (index: number, typeKey: string) => {
    setHasUserInteracted(true);
    const newSegs = [...segments];
    newSegs[index].type = typeKey;
    const typeConfig = SEGMENT_TYPES[typeKey.toUpperCase()];
    if (typeConfig.singleLocation) {
      newSegs[index].end_location = newSegs[index].start_location;
      newSegs[index].end_image = newSegs[index].start_image;
    }
    setSegments(newSegs);
    setOpenTypeSelectorIndex(null);
    setTypeSelectorPosition(null);
  };

  // Global Listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (openTypeSelectorIndex !== null && 
          !target.closest('.type-selector-container') &&
          !target.closest('[data-type-dropdown]')) {
        setOpenTypeSelectorIndex(null);
        setTypeSelectorPosition(null);
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openTypeSelectorIndex !== null) {
        setOpenTypeSelectorIndex(null);
        setTypeSelectorPosition(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openTypeSelectorIndex]);

  // Validate segment types are loaded
  if (!segmentTypeMap || Object.keys(segmentTypeMap).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center p-8">
          <div className="text-xl font-bold text-gray-700 mb-4">Loading Trip Builder...</div>
          <div className="text-gray-500 mb-2">Segment types are being loaded from the database.</div>
          <div className="text-sm text-gray-400">If this persists, run: <code className="bg-gray-100 px-2 py-1 rounded">npx prisma db seed</code></div>
        </div>
      </div>
    );
  }

  // Main UI - always show, timeline appears progressively
  return (
    <div className="min-h-screen pt-20 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="bg-gray-50 text-slate-800 font-sans selection:bg-indigo-100 min-h-full">
          {/* HEADER */}
          <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="px-3 py-2 space-y-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <input
                ref={journeyNameRef}
                type="text"
                value={journeyName}
                onChange={(e) => { setJourneyName(e.target.value); setHasUserInteracted(true); }}
                className="text-lg font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 placeholder-gray-400 w-full"
                placeholder="Journey Name"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGuide(!showGuide)}
                  className={`p-1.5 rounded-md transition-colors ${showGuide ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100 text-gray-500'}`}
                  title="Toggle Guide"
                >
                  <HelpCircle size={18} />
                </button>
                <div className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
                  saveStatus === 'saving' ? 'bg-yellow-100 text-yellow-700' :
                  saveStatus === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {saveStatus === 'saving' ? 'Saving...' :
                   saveStatus === 'error' ? 'Error' :
                   'Draft • Auto-saved'}
                </div>
              </div>
            </div>
            <textarea
              value={manualSummary !== null ? manualSummary : getGeneratedSummary()}
              onChange={(e) => { setManualSummary(e.target.value); setHasUserInteracted(true); }}
              rows={1}
              className="w-full bg-transparent text-gray-600 text-xs resize-none focus:ring-0 border-none p-0 placeholder-gray-300 leading-relaxed"
              placeholder="Describe your Journey..."
            />
          </div>
          
          {/* Guide */}
          {showGuide && (
            <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg flex gap-2 relative animate-in fade-in slide-in-from-top-2">
              <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
              <div className="text-sm text-blue-900 space-y-2">
                <p><span className="font-bold text-blue-700 uppercase tracking-wide text-xs">Level 1: The Journey</span><br/>The master plan for your entire adventure.</p>
                <p><span className="font-bold text-blue-700 uppercase tracking-wide text-xs">Level 2: The Chapter</span><br/>Distinct phases (Stay, Travel, Tour) that break up your journey.</p>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-100/50"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Date Controls */}
          {!isEditingDates ? (
            <div
              ref={dateControlsRef}
              onClick={handleEditDatesClick}
              className="group flex items-center justify-between bg-gray-50 hover:bg-white hover:ring-2 hover:ring-indigo-100 p-2 rounded-lg border border-gray-200 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="bg-white p-1.5 rounded-lg border border-gray-200 text-gray-500 group-hover:text-indigo-600 transition-colors">
                  <Calendar size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Journey Dates</span>
                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <span>{formatDateReadable(startDate)}</span>
                    <span className="text-gray-400">→</span>
                    <span>{formatDateReadable(endDate)}</span>
                    <span className="text-gray-300 mx-1">|</span>
                    <span className="text-gray-500 text-xs font-normal">{duration} Days</span>
                  </div>
                </div>
              </div>
              <div className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">Edit</div>
            </div>
          ) : (
            <div className="relative flex flex-col items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200 ring-2 ring-indigo-500/20 animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditingDates(false); }}
                className="absolute -top-3 -right-3 bg-white p-1 rounded-full shadow border border-gray-200 text-gray-400 hover:text-gray-900 z-10"
                title="Done Editing"
              >
                <Check size={16} />
              </button>
              <div className="flex items-center gap-2 w-full justify-between">
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Start</label>
                  <input
                    ref={startDateInputRef}
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    className="border-none p-0 font-semibold"
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={duration}
                  onChange={handleDurationChange}
                  className="flex-1 mx-4 accent-indigo-600"
                />
                <div className="flex flex-col text-right">
                  <label className="text-[10px] uppercase font-bold text-gray-500">End</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    className="border-none p-0 font-semibold text-right"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN WORKSPACE */}
      <div className="px-3 py-3 flex flex-col gap-3">
        <div className="flex-1">
          {showTimeline && (
            <>
              {!hasMinimumInfo && (
                <div className="text-center py-2 text-xs text-gray-400 italic">
                  Enter a journey name above to start planning
                </div>
              )}
              <div 
                ref={timelineRef}
                className={`transition-opacity ${!hasMinimumInfo ? 'opacity-40 pointer-events-none' : ''}`}
              >
                {/* Add segment button at the top */}
              <div className="relative group my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <button
                    onClick={() => handleInsertSegment(-1)}
                    className="bg-white px-2 py-0.5 text-xs text-gray-400 hover:text-indigo-600 border border-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Add chapter at start"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Vertical segment list */}
              <div className="space-y-1.5">
                {segments.map((segment, index) => {
                  const style = getSegmentStyle(segment.type);
                  const isSingleLocation = style.singleLocation;
                  const bgImage = segment.start_image || segment.end_image;

                  return (
                    <div key={segment.id} className="relative">
                      {/* Segment card */}
                      <div className={`relative group rounded-lg border-2 shadow-sm hover:shadow-md transition-all ${bgImage ? 'border-gray-300' : style.color.replace('text-', 'border-').replace('-900', '-300')}`}>
                        {bgImage && (
                          <div className="absolute inset-0 bg-cover bg-center z-0 rounded-lg overflow-hidden" style={{ backgroundImage: `url(${bgImage})` }}>
                            <div className={`absolute inset-0 ${style.overlayColor || 'bg-white/80'} backdrop-blur-[2px] mix-blend-multiply`}></div>
                          </div>
                        )}

                        <div className={`relative z-10 p-2 ${bgImage ? 'text-white' : ''}`}>
                          {/* Header row - Type, Name, Actions */}
                          <div className="flex items-start gap-2 mb-2">
                            {/* Type selector */}
                            <div className="relative type-selector-container group/typetooltip">
                              <button
                                ref={(el) => {
                                  typeSelectorRefs.current[index] = el;
                                  if (index === 0 && firstTypeRef) {
                                    (firstTypeRef as any).current = el;
                                  }
                                }}
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (typeSelectorRefs.current[index]) {
                                    handleOpenTypeSelector(index, typeSelectorRefs.current[index]!);
                                  }
                                }}
                                className={`p-1.5 rounded transition-colors ${bgImage ? 'hover:bg-white/20' : 'hover:bg-gray-200'}`}
                                title={style.label}
                              >
                                <style.icon size={14} />
                              </button>
                              
                              {/* Tooltip hidden in modal context */}
                            </div>

                            {/* Chapter name */}
                            <input
                              ref={index === 0 ? firstChapterRef : undefined}
                              type="text"
                              value={segment.name}
                              onChange={(e) => { setHasUserInteracted(true); const newSegs = [...segments]; newSegs[index].name = e.target.value; setSegments(newSegs); }}
                              onFocus={(e) => e.target.select()}
                              className={`flex-1 bg-transparent border-none p-0 font-semibold text-sm focus:ring-0 ${bgImage ? 'placeholder-white/50 text-white' : 'placeholder-gray-400 text-gray-900'}`}
                              placeholder="Chapter Name"
                            />

                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteSegment(index)}
                              className={`p-1 rounded transition-colors ${bgImage ? 'hover:bg-red-500/20 text-white' : 'hover:bg-red-50 text-red-600'}`}
                              title="Delete Chapter"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {/* Location inputs */}
                          <div ref={index === 0 ? firstLocationRef : undefined} className="mb-2">
                            {isSingleLocation ? (
                              <div
                                onClick={() => openLocationManager(index, 'start_location')}
                                className={`cursor-pointer px-2 py-1.5 rounded-md border transition-all ${
                                  bgImage 
                                    ? 'border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/20' 
                                    : 'border-gray-200 hover:border-indigo-400 bg-white/50 hover:bg-white'
                                }`}
                              >
                                {segment.start_location ? (
                                  <span className={`text-xs font-medium ${bgImage ? 'text-white' : 'text-gray-900'}`}>
                                    {segment.start_location}
                                  </span>
                                ) : (
                                  <span className={`text-xs ${bgImage ? 'text-white/60' : 'text-gray-400'}`}>
                                    Click to set location
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                <div
                                  onClick={() => openLocationManager(index, 'start_location')}
                                  className={`cursor-pointer px-2 py-1.5 rounded-md border transition-all ${
                                    bgImage 
                                      ? 'border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/20' 
                                      : 'border-gray-200 hover:border-indigo-400 bg-white/50 hover:bg-white'
                                  }`}
                                >
                                  {segment.start_location ? (
                                    <span className={`text-xs font-medium ${bgImage ? 'text-white' : 'text-gray-900'}`}>
                                      From: {segment.start_location}
                                    </span>
                                  ) : (
                                    <span className={`text-xs ${bgImage ? 'text-white/60' : 'text-gray-400'}`}>
                                      Click to set start location
                                    </span>
                                  )}
                                </div>
                                <div
                                  onClick={() => openLocationManager(index, 'end_location')}
                                  className={`cursor-pointer px-2 py-1.5 rounded-md border transition-all ${
                                    bgImage 
                                      ? 'border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/20' 
                                      : 'border-gray-200 hover:border-indigo-400 bg-white/50 hover:bg-white'
                                  }`}
                                >
                                  {segment.end_location ? (
                                    <span className={`text-xs font-medium ${bgImage ? 'text-white' : 'text-gray-900'}`}>
                                      To: {segment.end_location}
                                    </span>
                                  ) : (
                                    <span className={`text-xs ${bgImage ? 'text-white/60' : 'text-gray-400'}`}>
                                      Click to set end location
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Compact footer controls */}
                          <div className={`flex items-center justify-between text-[10px] ${bgImage ? 'bg-white/10' : 'bg-gray-50'} rounded px-1.5 py-0.5`}>
                            {/* Left: Move controls */}
                            <div className="flex gap-0.5">
                              <button
                                onClick={() => moveSegmentUp(index)}
                                disabled={index === 0}
                                className={`p-1 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${bgImage ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
                                title="Move Up"
                              >
                                <ChevronUp size={12} />
                              </button>
                              <button
                                onClick={() => moveSegmentDown(index)}
                                disabled={index === segments.length - 1}
                                className={`p-1 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${bgImage ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
                                title="Move Down"
                              >
                                <ChevronDown size={12} />
                              </button>
                            </div>

                            {/* Center: Day count and dates */}
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => adjustSegmentDays(index, -1)}
                                  disabled={segment.days <= 1}
                                  className={`p-0.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${bgImage ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
                                  title="Decrease days"
                                >
                                  <Minus size={10} />
                                </button>
                                <span className={`font-semibold px-2 min-w-[40px] text-center ${bgImage ? 'text-white' : 'text-gray-900'}`}>
                                  {segment.days}d
                                </span>
                                <button
                                  onClick={() => adjustSegmentDays(index, 1)}
                                  className={`p-0.5 rounded transition-colors ${bgImage ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
                                  title="Increase days"
                                >
                                  <Plus size={10} />
                                </button>
                              </div>
                              <div className={`text-[10px] ${bgImage ? 'text-white/70' : 'text-gray-500'}`}>
                                {(() => {
                                  const dates = getChapterDates(index);
                                  const startStr = dates.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                  const endStr = dates.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                  return segment.days === 1 ? startStr : `${startStr} - ${endStr}`;
                                })()}
                              </div>
                            </div>

                            {/* Right: Segment order indicator */}
                            <div className={`text-[10px] opacity-50 ${bgImage ? 'text-white' : 'text-gray-500'}`}>
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Add segment button between cards */}
                      {index < segments.length - 1 && (
                        <div className="relative group my-1">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <button
                              onClick={() => handleInsertSegment(index)}
                              className="bg-white px-2 py-0.5 text-xs text-gray-400 hover:text-indigo-600 border border-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Add chapter here"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add segment button at the bottom */}
              <div className="relative group my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <button
                    onClick={() => handleInsertSegment(segments.length - 1)}
                    className="bg-white px-2 py-0.5 text-xs text-gray-400 hover:text-indigo-600 border border-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Add chapter at end"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Home Location Toggle */}
              {homeLocation && segments.length >= 3 && (
                <div className="mt-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-indigo-100 p-1.5 rounded-lg">
                      <Home size={16} className="text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-indigo-900">Your Home Base</div>
                      <div className="text-sm font-semibold text-indigo-700">{homeLocation.name}</div>
                    </div>
                  </div>
                  
                  {/* Display image if available */}
                  {homeLocation.imageUrl && (
                    <div className="mb-3">
                      <img 
                        src={homeLocation.imageUrl} 
                        alt={homeLocation.name}
                        className="w-full h-24 object-cover rounded-md"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {/* Start from home toggle */}
                    <div className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-indigo-100">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="includeHomeStart"
                          checked={includeHomeStart}
                          onChange={handleToggleHomeStart}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="includeHomeStart" className="text-sm text-gray-700 cursor-pointer">
                          Start trip from home
                        </label>
                      </div>
                      {includeHomeStart && (
                        <button
                          onClick={handleToggleHomeStart}
                          className="p-1 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove home as starting point"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    
                    {/* Return home toggle */}
                    <div className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-indigo-100">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="includeHomeEnd"
                          checked={includeHomeEnd}
                          onChange={handleToggleHomeEnd}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="includeHomeEnd" className="text-sm text-gray-700 cursor-pointer">
                          Return home at end
                        </label>
                      </div>
                      {includeHomeEnd && (
                        <button
                          onClick={handleToggleHomeEnd}
                          className="p-1 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove home as ending point"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              </div>
            </>
          )}
          
          {/* Continue Journey Button - Outside grayed area, always accessible */}
          {showTimeline && tripId && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={async () => {
                  try {
                    // Update status and trigger image generation
                    await finalizeTrip(tripId);
                    
                    // Use callback if provided, otherwise navigate
                    if (onComplete) {
                      onComplete(tripId);
                    } else {
                      router.push(`/exp?tripId=${tripId}`);
                    }
                  } catch (error) {
                    console.error("Failed to finalize trip:", error);
                    // Still navigate/callback even if finalization fails
                    if (onComplete) {
                      onComplete(tripId);
                    } else {
                      router.push(`/exp?tripId=${tripId}`);
                    }
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
              >
                Continue to Journey Planning
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Type Selector Dropdown Portal */}
      {openTypeSelectorIndex !== null && typeSelectorPosition && createPortal(
        <div 
          data-type-dropdown
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden text-gray-800"
          style={{
            top: `${typeSelectorPosition.top}px`,
            left: `${typeSelectorPosition.left}px`,
            width: '280px',
            zIndex: 9999
          }}
        >
          {Object.entries(SEGMENT_TYPES).map(([key, type]) => (
            <button
              key={key}
              onClick={(e) => { e.stopPropagation(); handleTypeSelect(openTypeSelectorIndex, key); }}
              className="w-full flex flex-col gap-1 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-2">
                <type.icon size={16} className="flex-shrink-0" />
                <span className="font-semibold text-sm text-gray-900">{type.label}</span>
              </div>
              <div className="text-xs text-gray-600 leading-relaxed">
                {type.description}
              </div>
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Date Change Modal */}
      {dateChangeModal && (
        <DateChangeModal
          isOpen={dateChangeModal.isOpen}
          onClose={() => setDateChangeModal(null)}
          changeType={dateChangeModal.changeType}
          daysDelta={dateChangeModal.daysDelta}
          sourceChapterIndex={dateChangeModal.sourceChapterIndex}
          sourceChapterName={dateChangeModal.sourceChapterName}
          chapters={segments.map((seg, idx) => ({ name: seg.name, days: seg.days, index: idx }))}
          currentTripStart={startDate}
          currentTripEnd={endDate}
          onApply={handleDateChangeApply}
        />
      )}

      {/* Location Manager Modal */}
      <LocationManagerModal
        isOpen={locationManagerState.isOpen}
        onClose={closeLocationManager}
        segments={segments}
        onSave={handleLocationManagerSave}
        initialFocusIndex={locationManagerState.initialFocusIndex}
        initialFocusField={locationManagerState.initialFocusField}
      />

      {/* Tooltip System */}
      {!tourDismissed && currentTooltipStep && (
        <>
          {currentTooltipStep === 'welcome' && journeyNameRef.current && (
            <>
              <TooltipOverlay 
                show={true} 
                targetRef={journeyNameRef}
                onBackdropClick={handleCloseTooltip}
              />
              <HandDrawnTooltip
                content="Welcome! Let's begin by giving your journey a name. This will be the title of your entire journey."
                targetRef={journeyNameRef}
                position="bottom"
                onClose={handleCloseTooltip}
                show={true}
                showSkip={true}
                onSkipAll={handleSkipTour}
                onNext={handleNextTooltip}
                showNext={true}
                showPrevious={false}
                currentStep={getCurrentStepNumber()}
                totalSteps={stepOrder.length}
              />
            </>
          )}

          {currentTooltipStep === 'dates' && dateControlsRef.current && (
            <>
              <TooltipOverlay 
                show={true} 
                targetRef={dateControlsRef}
                onBackdropClick={handleCloseTooltip}
              />
              <HandDrawnTooltip
                content="Now, select your travel dates. You can adjust the duration using the slider or by changing the start and end dates."
                targetRef={dateControlsRef}
                position="top"
                onClose={handleCloseTooltip}
                show={true}
                showSkip={true}
                onSkipAll={handleSkipTour}
                onNext={handleNextTooltip}
                onPrevious={handlePreviousTooltip}
                showNext={true}
                showPrevious={true}
                currentStep={getCurrentStepNumber()}
                totalSteps={stepOrder.length}
              />
            </>
          )}

          {currentTooltipStep === 'timeline' && timelineRef.current && (
            <>
              <TooltipOverlay 
                show={true} 
                targetRef={timelineRef}
                onBackdropClick={handleCloseTooltip}
              />
              <HandDrawnTooltip
                content="Perfect! Here's your journey timeline. We're creating the outline for your journey with chapters. You'll be able to add specific moments—like hotel reservations and activities—later."
                targetRef={timelineRef}
                position="top"
                onClose={handleCloseTooltip}
                show={true}
                showSkip={true}
                onSkipAll={handleSkipTour}
                onNext={handleNextTooltip}
                onPrevious={handlePreviousTooltip}
                showNext={true}
                showPrevious={true}
                currentStep={getCurrentStepNumber()}
                totalSteps={stepOrder.length}
              />
            </>
          )}

          {currentTooltipStep === 'chapterName' && firstChapterRef.current && (
            <>
              <TooltipOverlay 
                show={true} 
                targetRef={firstChapterRef}
                onBackdropClick={handleCloseTooltip}
              />
              <HandDrawnTooltip
                content="Click here to rename your chapters. Give each phase of your journey a meaningful name that reflects what you'll be doing."
                targetRef={firstChapterRef}
                position="top"
                onClose={handleCloseTooltip}
                show={true}
                showSkip={true}
                onSkipAll={handleSkipTour}
                onNext={handleNextTooltip}
                onPrevious={handlePreviousTooltip}
                showNext={true}
                showPrevious={true}
                currentStep={getCurrentStepNumber()}
                totalSteps={stepOrder.length}
              />
            </>
          )}

          {currentTooltipStep === 'chapterType' && firstTypeRef.current && (
            <>
              <TooltipOverlay 
                show={true} 
                targetRef={firstTypeRef}
                onBackdropClick={handleCloseTooltip}
              />
              <HandDrawnTooltip
                content="Use this dropdown to set the chapter type: Stay (for time in one location), Travel (for transit days), or Tour (for multi-stop exploration)."
                targetRef={firstTypeRef}
                position="bottom"
                onClose={handleCloseTooltip}
                show={true}
                showSkip={true}
                onSkipAll={handleSkipTour}
                onNext={handleNextTooltip}
                onPrevious={handlePreviousTooltip}
                showNext={true}
                showPrevious={true}
                currentStep={getCurrentStepNumber()}
                totalSteps={stepOrder.length}
              />
            </>
          )}

          {currentTooltipStep === 'location' && firstLocationRef.current && (
            <>
              <TooltipOverlay 
                show={true} 
                targetRef={firstLocationRef}
                onBackdropClick={handleCloseTooltip}
              />
              <HandDrawnTooltip
                content="Add locations to your chapters. This helps us understand your journey's geography and will make it easier to add specific moments later."
                targetRef={firstLocationRef}
                position="top"
                onClose={handleCloseTooltip}
                show={true}
                showSkip={true}
                onSkipAll={handleSkipTour}
                onNext={handleNextTooltip}
                onPrevious={handlePreviousTooltip}
                showNext={true}
                showPrevious={true}
                currentStep={getCurrentStepNumber()}
                totalSteps={stepOrder.length}
              />
            </>
          )}

          {currentTooltipStep === 'advanced' && timelineRef.current && (
            <>
              <TooltipOverlay 
                show={true} 
                targetRef={timelineRef}
                onBackdropClick={handleCloseTooltip}
              />
              <HandDrawnTooltip
                content="You can use the Up/Down buttons to reorder chapters, click the + buttons to add new chapters, or use the +/- buttons to adjust the number of days in each chapter. Your journey outline is flexible and easy to customize."
                targetRef={timelineRef}
                position="bottom"
                onClose={handleCloseTooltip}
                show={true}
                showSkip={true}
                onSkipAll={handleSkipTour}
                onNext={handleNextTooltip}
                onPrevious={handlePreviousTooltip}
                showNext={false}
                showPrevious={true}
                currentStep={getCurrentStepNumber()}
                totalSteps={stepOrder.length}
              />
            </>
          )}
        </>
      )}
        </div>
      </div>
    </div>
  );
}

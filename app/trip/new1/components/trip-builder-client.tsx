"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Plus,
  Trash2,
  X,
  Check,
  ChevronDown,
  Info,
  HelpCircle
} from 'lucide-react';
import { PlaceAutocompleteLive } from './place-autocomplete-live';
import { SEGMENT_TYPES, getSegmentStyle, type SegmentTypeConfig } from '../lib/segment-types';
import { 
  createDraftTrip, 
  updateTripMetadata, 
  syncSegments 
} from '../actions/trip-builder-actions';

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
}

interface TripBuilderClientProps {
  segmentTypeMap: Record<string, string>;
}

const formatDate = (date: Date) => date.toISOString().split('T')[0];
const formatDateReadable = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const addDays = (date: Date | string, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export function TripBuilderClient({ segmentTypeMap }: TripBuilderClientProps) {
  const [journeyName, setJourneyName] = useState("Summer Adventure");
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
  const startDateInputRef = useRef<HTMLInputElement>(null);

  // Auto-save state
  const [tripId, setTripId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

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
    });

    if (totalDays === 1) {
      return [mkSeg('STAY', 'Main Stay', 1)];
    } else if (totalDays === 2) {
      return [mkSeg('STAY', 'Chapter 1', 1), mkSeg('STAY', 'Chapter 2', 1)];
    } else {
      const stayDays = totalDays - 2;
      return [
        mkSeg('TRAVEL', 'Travel Out', 1),
        mkSeg('STAY', 'Main Stay', stayDays),
        mkSeg('TRAVEL', 'Travel Back', 1),
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
      const stayIndex = nextSegments.findIndex(s => s.name === 'Main Stay') !== -1 
        ? nextSegments.findIndex(s => s.name === 'Main Stay') 
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

  useEffect(() => {
    setSegments(generateSkeleton(duration));
  }, []);

  // --- LOCATION PROPAGATION ---
  const propagateLocations = (newSegments: Segment[], changedIndex: number): Segment[] => {
    // Round Trip Sync
    if (changedIndex === 0) {
      const firstSeg = newSegments[0];
      const lastIndex = newSegments.length - 1;
      if (lastIndex > 0) {
        newSegments[lastIndex].end_location = firstSeg.start_location;
        newSegments[lastIndex].end_image = firstSeg.start_image;

        if (SEGMENT_TYPES[newSegments[lastIndex].type.toUpperCase()]?.singleLocation) {
          newSegments[lastIndex].start_location = firstSeg.start_location;
          newSegments[lastIndex].start_image = firstSeg.start_image;
        }
      }
    }

    // Cascade Forward
    for (let i = changedIndex; i < newSegments.length - 1; i++) {
      const current = newSegments[i];
      const next = newSegments[i + 1];

      if (current.end_location) {
        next.start_location = current.end_location;
        next.start_image = current.end_image;

        if (SEGMENT_TYPES[next.type.toUpperCase()]?.singleLocation) {
          next.end_location = next.start_location;
          next.end_image = next.start_image;
        }
      }
    }
    return newSegments;
  };

  const handleLocationChange = (index: number, field: 'start_location' | 'end_location', value: string, imageUrl: string | null = null) => {
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

    const propagatedSegments = propagateLocations(newSegments, index);
    setSegments(propagatedSegments);
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
    // Don't save on initial mount - only after user interaction
    if (!hasUserInteracted) {
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
        if (!tripId) {
          // First save - create trip
          const id = await createDraftTrip({
            title: journeyName || "Untitled Trip",
            description: manualSummary || getGeneratedSummary(),
            startDate,
            endDate,
          });
          setTripId(id);
          console.log('✅ Created draft trip:', id);
        } else {
          // Subsequent saves - update trip and segments
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
            updateTripMetadata(tripId, {
              title: journeyName,
              description: manualSummary || getGeneratedSummary(),
              startDate,
              endDate,
            }),
            syncSegments(tripId, segmentsWithDates, segmentTypeMap),
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
  }, [journeyName, manualSummary, startDate, endDate, segments, tripId, segmentTypeMap, hasUserInteracted]);

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
  
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (openTypeSelectorIndex !== null) return;
    e.dataTransfer.setData("segmentIdx", index.toString());
  };
  
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    setHasUserInteracted(true);
    const sourceIdx = parseInt(e.dataTransfer.getData("segmentIdx"));
    if (isNaN(sourceIdx) || sourceIdx === targetIndex) return;
    const newSegs = [...segments];
    const [moved] = newSegs.splice(sourceIdx, 1);
    newSegs.splice(targetIndex, 0, moved);
    const reconnectedSegs = propagateLocations(newSegs, 0);
    setSegments(reconnectedSegs);
  };
  
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const ribbonRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState<any>(null);
  
  const handleResizeStartInternal = (e: React.MouseEvent, index: number) => {
    if (index >= segments.length - 1) return;
    e.preventDefault();
    setIsResizing({
      type: 'internal',
      index,
      startX: e.clientX,
      initialLeftDays: segments[index].days,
      initialRightDays: segments[index + 1].days,
      initialDuration: duration,
    });
  };
  
  const handleResizeStartOuterStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing({
      type: 'start',
      startX: e.clientX,
      initialDuration: duration,
      initialSegmentDays: segments[0].days,
      initialStartDate: new Date(startDate),
    });
  };
  
  const handleResizeStartOuterEnd = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing({
      type: 'end',
      startX: e.clientX,
      initialDuration: duration,
      initialSegmentDays: segments[segments.length - 1].days,
    });
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
  
  const handleInsertSegment = (indexBefore: number) => {
    setHasUserInteracted(true);
    const prevSeg = indexBefore >= 0 ? segments[indexBefore] : null;
    let startLoc = "", endLoc = "", startImg: string | null = null, endImg: string | null = null;
    if (prevSeg) {
      startLoc = prevSeg.end_location || "";
      startImg = prevSeg.end_image || null;
      endLoc = startLoc;
      endImg = startImg;
    }
    const newSegment: Segment = {
      id: crypto.randomUUID(),
      type: 'STAY',
      name: 'New Chapter',
      days: 1,
      start_location: startLoc,
      end_location: endLoc,
      start_image: startImg,
      end_image: endImg,
    };
    const newSegments = [...segments];
    newSegments.splice(indexBefore + 1, 0, newSegment);
    const propagated = propagateLocations(newSegments, indexBefore + 1);
    setSegments(propagated);
    if (indexBefore === -1) {
      const prevStart = new Date(startDate);
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
    const reconnected = propagateLocations(newSegments, Math.max(0, index - 1));
    setSegments(reconnected);
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
    const propagated = propagateLocations(newSegs, index);
    setSegments(propagated);
    setOpenTypeSelectorIndex(null);
  };

  // Global Listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !ribbonRef.current) return;
      const ribbonWidth = ribbonRef.current.offsetWidth;
      const pixelsPerDay = ribbonWidth / (isResizing.initialDuration || duration);
      const deltaPixels = e.clientX - isResizing.startX;
      const deltaDays = Math.round(deltaPixels / pixelsPerDay);
      
      if (isResizing.type === 'internal') {
        const { index, initialLeftDays, initialRightDays } = isResizing;
        let newLeftDays = initialLeftDays + deltaDays;
        let newRightDays = initialRightDays - deltaDays;
        if (newLeftDays < 1) { newLeftDays = 1; newRightDays = (initialLeftDays + initialRightDays) - 1; }
        if (newRightDays < 1) { newRightDays = 1; newLeftDays = (initialLeftDays + initialRightDays) - 1; }
        if (newLeftDays !== segments[index].days) {
          const newSegs = [...segments];
          newSegs[index].days = newLeftDays;
          newSegs[index + 1].days = newRightDays;
          setSegments(newSegs);
        }
      } else if (isResizing.type === 'start') {
        const { initialSegmentDays, initialDuration, initialStartDate } = isResizing;
        const changeInDays = -deltaDays;
        let newFirstSegDays = initialSegmentDays + changeInDays;
        if (newFirstSegDays < 1) newFirstSegDays = 1;
        const validChange = newFirstSegDays - initialSegmentDays;
        if (validChange !== 0 || segments[0].days !== newFirstSegDays) {
          const newSegs = [...segments];
          newSegs[0].days = newFirstSegDays;
          setSegments(newSegs);
          const newDuration = initialDuration + validChange;
          setDuration(newDuration);
          const newStartObj = addDays(initialStartDate, -validChange);
          const newStartStr = formatDate(newStartObj);
          setStartDate(newStartStr);
          setEndDate(calculateEndDate(newStartStr, newDuration));
        }
      } else if (isResizing.type === 'end') {
        const { initialSegmentDays, initialDuration } = isResizing;
        let newLastSegDays = initialSegmentDays + deltaDays;
        if (newLastSegDays < 1) newLastSegDays = 1;
        const validChange = newLastSegDays - initialSegmentDays;
        if (validChange !== 0 || segments[segments.length - 1].days !== newLastSegDays) {
          const newSegs = [...segments];
          newSegs[segments.length - 1].days = newLastSegDays;
          setSegments(newSegs);
          const newDuration = initialDuration + validChange;
          setDuration(newDuration);
          if (anchor === 'start') setEndDate(calculateEndDate(startDate, newDuration));
          else setEndDate(calculateEndDate(startDate, newDuration));
        }
      }
    };
    
    const handleMouseUp = () => { setIsResizing(null); };
    const handleClickOutside = (e: MouseEvent) => {
      if (openTypeSelectorIndex !== null && !(e.target as Element).closest('.type-selector-container')) {
        setOpenTypeSelectorIndex(null);
      }
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isResizing, duration, segments, startDate, anchor, openTypeSelectorIndex]);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans selection:bg-indigo-100">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={journeyName}
                onChange={(e) => { setJourneyName(e.target.value); setHasUserInteracted(true); }}
                className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 placeholder-gray-400 w-full"
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
              rows={2}
              className="w-full bg-transparent text-gray-600 text-sm resize-none focus:ring-0 border-none p-0 placeholder-gray-300 leading-relaxed"
              placeholder="Describe your Journey..."
            />
          </div>
          
          {/* Guide */}
          {showGuide && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-4 relative animate-in fade-in slide-in-from-top-2">
              <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
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
              onClick={handleEditDatesClick}
              className="group flex items-center justify-between bg-gray-50 hover:bg-white hover:ring-2 hover:ring-indigo-100 p-4 rounded-xl border border-gray-200 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg border border-gray-200 text-gray-500 group-hover:text-indigo-600 transition-colors">
                  <Calendar size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Journey Dates</span>
                  <div className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span>{formatDateReadable(startDate)}</span>
                    <span className="text-gray-400">→</span>
                    <span>{formatDateReadable(endDate)}</span>
                    <span className="text-gray-300 mx-1">|</span>
                    <span className="text-gray-500 text-base font-normal">{duration} Days</span>
                  </div>
                </div>
              </div>
              <div className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">Click to Edit</div>
            </div>
          ) : (
            <div className="relative flex flex-col md:flex-row items-center gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200 ring-2 ring-indigo-500/20 animate-in fade-in zoom-in-95 duration-200">
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
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Journey Timeline</h3>
            <div className="text-xs text-gray-400">{segments.length} Chapters</div>
          </div>

          <div className="relative mx-4 h-48 select-none mb-12">
            <div
              className="absolute left-0 top-0 bottom-0 w-4 -ml-4 z-30 cursor-col-resize flex flex-col items-center justify-center group/outer"
              onMouseDown={handleResizeStartOuterStart}
            >
              <div className="w-1 h-full bg-gray-200 rounded-l-md group-hover/outer:bg-indigo-400 transition-colors"></div>
              <button
                onClick={(e) => { e.stopPropagation(); handleInsertSegment(-1); }}
                className="absolute -top-3 w-6 h-6 bg-white border border-indigo-200 text-indigo-600 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover/outer:opacity-100 hover:bg-indigo-50 hover:scale-110 transition-all z-30"
                title="Add Start Chapter"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>

            <div ref={ribbonRef} className="relative h-full flex">
              <div className="absolute inset-0 bg-gray-100 rounded-xl overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 flex">
                  {Array.from({ length: duration }).map((_, i) => (
                    <div key={i} className="flex-1 border-r border-gray-200/50 last:border-0"></div>
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 border border-gray-200 rounded-xl pointer-events-none z-10"></div>

              {segments.map((segment, index) => {
                const style = getSegmentStyle(segment.type);
                const widthPct = (segment.days / duration) * 100;
                const isSingleLocation = style.singleLocation;
                const bgImage = segment.start_image || segment.end_image;

                return (
                  <React.Fragment key={segment.id}>
                    <div
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      style={{ width: `${widthPct}%` }}
                      className={`relative group h-full flex flex-col transition-all duration-200 first:rounded-l-xl last:rounded-r-xl overflow-visible ${isResizing ? '' : 'hover:brightness-95'}`}
                    >
                      {bgImage && (
                        <div className="absolute inset-0 bg-cover bg-center z-0 transition-opacity duration-500" style={{ backgroundImage: `url(${bgImage})` }}>
                          <div className={`absolute inset-0 ${style.overlayColor || 'bg-white/80'} backdrop-blur-[2px] mix-blend-multiply`}></div>
                        </div>
                      )}

                      <div className={`relative h-full w-full p-3 flex flex-col justify-between ${bgImage ? 'text-white' : style.color} border-r border-white/20 first:rounded-l-xl last:rounded-r-xl z-10`}>
                        <div className="flex justify-between items-start">
                          <div className="relative type-selector-container">
                            <button
                              onClick={(e) => { e.stopPropagation(); setOpenTypeSelectorIndex(openTypeSelectorIndex === index ? null : index); }}
                              className="flex items-center gap-1 hover:bg-black/10 p-1 -ml-1 rounded transition-colors group/type"
                            >
                              <style.icon size={14} className="opacity-70 group-hover/type:opacity-100" />
                              <ChevronDown size={10} className="opacity-50 group-hover/type:opacity-100" />
                            </button>
                            {openTypeSelectorIndex === index && (
                              <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden text-gray-800">
                                {Object.entries(SEGMENT_TYPES).map(([key, type]) => (
                                  <button
                                    key={key}
                                    onClick={(e) => { e.stopPropagation(); handleTypeSelect(index, key); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 text-sm"
                                  >
                                    <type.icon size={14} />
                                    <span className="font-medium text-gray-700">{type.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDeleteSegment(index)}
                              className="p-1 hover:bg-red-100/20 hover:text-red-500 rounded text-inherit"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={segment.name}
                          onChange={(e) => { setHasUserInteracted(true); const newSegs = [...segments]; newSegs[index].name = e.target.value; setSegments(newSegs); }}
                          className={`w-full bg-transparent border-none p-0 font-bold text-base focus:ring-0 my-1 ${bgImage ? 'placeholder-white/50 text-white drop-shadow-md' : 'placeholder-black/20'}`}
                          placeholder="Chapter Name"
                        />
                        
                        <div className="flex flex-col gap-2 mt-auto">
                          {isSingleLocation ? (
                            <PlaceAutocompleteLive
                              value={segment.start_location}
                              onChange={(val, img) => handleLocationChange(index, 'start_location', val, img)}
                              placeholder="Where to?"
                              className="text-gray-800"
                            />
                          ) : (
                            <div className="flex flex-col gap-1">
                              <PlaceAutocompleteLive
                                value={segment.start_location}
                                onChange={(val, img) => handleLocationChange(index, 'start_location', val, img)}
                                placeholder="From"
                                className="text-gray-800"
                              />
                              <PlaceAutocompleteLive
                                value={segment.end_location}
                                onChange={(val, img) => handleLocationChange(index, 'end_location', val, img)}
                                placeholder="To"
                                className="text-gray-800"
                              />
                            </div>
                          )}
                          <div className="flex items-center justify-end">
                            <span className={`text-[10px] font-bold uppercase opacity-60 ${bgImage ? 'text-white' : ''}`}>
                              {segment.days} Day{segment.days > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < segments.length - 1 && (
                      <div
                        className="w-4 -ml-2 hover:ml-0 hover:mr-0 z-40 cursor-col-resize flex items-center justify-center group/handle absolute h-full hover:bg-indigo-500/10 transition-colors"
                        style={{ left: `${(segments.slice(0, index + 1).reduce((sum, s) => sum + s.days, 0) / duration) * 100}%` }}
                        onMouseDown={(e) => handleResizeStartInternal(e, index)}
                      >
                        <div className="w-1 h-8 bg-black/10 rounded-full group-hover/handle:bg-indigo-500 group-hover/handle:scale-y-125 transition-all shadow-sm"></div>
                        <button
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => { e.stopPropagation(); handleInsertSegment(index); }}
                          className="absolute -top-3 z-50 w-6 h-6 bg-white border border-indigo-200 text-indigo-600 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover/handle:opacity-100 hover:bg-indigo-50 hover:scale-110 transition-all transform"
                          title="Insert Chapter"
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div
              className="absolute right-0 top-0 bottom-0 w-4 -mr-4 z-30 cursor-col-resize flex flex-col items-center justify-center group/outer"
              onMouseDown={handleResizeStartOuterEnd}
            >
              <div className="w-1 h-full bg-gray-200 rounded-r-md group-hover/outer:bg-indigo-400 transition-colors"></div>
              <button
                onClick={(e) => { e.stopPropagation(); handleInsertSegment(segments.length - 1); }}
                className="absolute -top-3 w-6 h-6 bg-white border border-indigo-200 text-indigo-600 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover/outer:opacity-100 hover:bg-indigo-50 hover:scale-110 transition-all z-30"
                title="Add End Chapter"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* DATA MODEL PREVIEW */}
      <div className="max-w-6xl mx-auto px-4 pb-12 mt-12 border-t border-gray-200 pt-8">
        <div className="bg-gray-900 rounded-xl p-6 shadow-2xl overflow-hidden">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Live Data Model (JSON)</h3>
          <pre className="font-mono text-xs text-emerald-400 overflow-x-auto">
            {JSON.stringify({
              tripId,
              journey: {
                name: journeyName,
                description: manualSummary || getGeneratedSummary(),
                start_date: startDate,
                end_date: endDate,
                duration_days: duration,
                chapters: segments.map((s, i) => {
                  const daysBefore = segments.slice(0, i).reduce((sum, seg) => sum + seg.days, 0);
                  const segStart = addDays(new Date(startDate), daysBefore);
                  const segEnd = addDays(segStart, s.days - 1);
                  return {
                    id: s.id,
                    dbId: s.dbId,
                    name: s.name,
                    days: s.days,
                    type_id: s.type,
                    locations: { start: s.start_location, end: s.end_location },
                    images: { start: s.start_image, end: s.end_image },
                    order_index: i,
                    start_datetime: segStart.toISOString(),
                    end_datetime: segEnd.toISOString().replace('T00:00:00.000Z', 'T23:59:59.000Z')
                  };
                })
              }
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

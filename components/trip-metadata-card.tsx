"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Check, Plus, Minus, X } from "lucide-react";
import { DatePopover } from "./ui/date-popover";
import { PartTile } from "./part-tile";
import { HorizontalSegmentBlock } from "./horizontal-segment-block";
import { SegmentEditModal } from "./segment-edit-modal";
import { Toast } from "./ui/toast";
import { TripDayDashes } from "./trip-day-dashes";
import { SegmentDivider } from "./segment-divider";
import { TripStructureMap } from "./trip-structure-map";
import { addDays, startOfDay, format } from "date-fns";

interface InMemorySegment {
  tempId: string;
  name: string;
  segmentType: string;
  startLocation: string;
  endLocation: string;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  order: number;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  startTimeZoneId?: string;
  startTimeZoneName?: string;
  endTimeZoneId?: string;
  endTimeZoneName?: string;
}

interface TripMetadataCardProps {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  segments: InMemorySegment[];
  onUpdate: (updates: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    imageUrl?: string | null;
  }) => void;
  onSegmentsUpdate: (segments: InMemorySegment[]) => void;
}

// Helper functions
const getDefaultStartDate = () => {
  const date = addDays(new Date(), 7); // 7 days from now
  return date.toISOString().split("T")[0];
};

const getDefaultEndDate = (start: string, days: number = 7) => {
  if (!start) return "";
  const startDate = new Date(start);
  const endDate = addDays(startDate, days);
  return endDate.toISOString().split("T")[0];
};

const calculateDays = (start: string, end: string): number => {
  if (!start || !end) return 7;
  const startDt = new Date(start);
  const endDt = new Date(end);
  const days = Math.ceil((endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
};

const calculateEndDate = (start: string, days: number): string => {
  if (!start) return "";
  const startDt = new Date(start);
  const endDt = addDays(startDt, days);
  return endDt.toISOString().split("T")[0];
};

const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const getSmartPartName = (
  index: number, 
  totalParts: number, 
  segment?: InMemorySegment
): string => {
  // Try to use location information first
  if (segment?.startLocation && segment?.endLocation) {
    if (segment.startLocation === segment.endLocation) {
      // Stay in one place
      return segment.startLocation;
    } else {
      // Travel between places
      return `${segment.startLocation} → ${segment.endLocation}`;
    }
  }
  
  // Fallback to generic naming
  if (totalParts === 1 || totalParts === 2) {
    return `Part ${index + 1}`;
  }
  
  // For 3+ parts without locations
  if (index === 0) {
    return "Outbound Travel";
  } else if (index === totalParts - 1) {
    return "Return Travel";
  } else if (totalParts === 3) {
    return "Main Stay";
  } else {
    return `Stay Part ${index}`;
  }
};

const getSmartSegmentType = (index: number, totalParts: number): string => {
  if (totalParts === 1 || totalParts === 2) {
    return "Stay"; // Single or two parts default to stay
  }
  
  // For 3+ parts: Travel → Stay → Travel
  if (index === 0 || index === totalParts - 1) {
    return "Travel"; // Outbound/Return travel
  } else {
    return "Stay"; // Middle parts are stays
  }
};

export function TripMetadataCard({
  title,
  description,
  startDate,
  endDate,
  imageUrl,
  segments,
  onUpdate,
  onSegmentsUpdate,
}: TripMetadataCardProps) {
  // Initialize with smart defaults
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description);
  const [editStart, setEditStart] = useState(startDate || getDefaultStartDate());
  const [editEnd, setEditEnd] = useState(endDate || getDefaultEndDate(editStart, 7));
  const [duration, setDuration] = useState(() => calculateDays(editStart, editEnd));
  const [extendedRange, setExtendedRange] = useState(false);
  const [numParts, setNumParts] = useState(segments.length || 1);

  // Individual editing flags
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);

  // Progressive disclosure state
  const [hasInteractedWithDates, setHasInteractedWithDates] = useState(false);

  // Modal state for segment editing
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<Array<{id: string; message: string; type: "success" | "error" | "warning" | "info"}>>([]);

  // Hover state for map synchronization
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);

  // Ref for timeline container to measure width
  const timelineRef = useRef<HTMLDivElement>(null);

  const maxDuration = extendedRange ? 90 : 30;
  const totalTripDays = calculateDays(editStart, editEnd);

  // Sync smart defaults to parent on mount if empty
  useEffect(() => {
    if (!startDate && !endDate) {
      const defaultStart = getDefaultStartDate();
      const defaultEnd = getDefaultEndDate(defaultStart, 7);
      onUpdate({ startDate: defaultStart, endDate: defaultEnd });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize with smart defaults based on trip duration
  useEffect(() => {
    if (segments.length === 0 && editStart && editEnd) {
      const tripDuration = calculateDays(editStart, editEnd);
      const defaultNumParts = tripDuration >= 4 ? 3 : 1;
      
      // Create initial segments with smart defaults
      const initialSegments: InMemorySegment[] = [];
      
      if (defaultNumParts === 1) {
        // Single part spanning entire trip
        initialSegments.push({
          tempId: generateTempId(),
          name: "Part 1",
          segmentType: "Stay",
          startLocation: "",
          endLocation: "",
          startTime: editStart,
          endTime: editEnd,
          notes: null,
          order: 0,
        });
      } else {
        // 3 parts: Outbound (1 day) + Main Stay (remaining - 1) + Return (1 day)
        const mainStayDuration = tripDuration - 2;
        
        // Part 1: Outbound Travel (1 day)
        initialSegments.push({
          tempId: generateTempId(),
          name: "Outbound Travel",
          segmentType: "Travel",
          startLocation: "",
          endLocation: "",
          startTime: editStart,
          endTime: addDays(new Date(editStart), 1).toISOString().split("T")[0],
          notes: null,
          order: 0,
        });
        
        // Part 2: Main Stay (remaining days - 1)
        const mainStayStart = addDays(new Date(editStart), 1).toISOString().split("T")[0];
        const mainStayEnd = addDays(new Date(mainStayStart), mainStayDuration).toISOString().split("T")[0];
        initialSegments.push({
          tempId: generateTempId(),
          name: "Main Stay",
          segmentType: "Stay",
          startLocation: "",
          endLocation: "",
          startTime: mainStayStart,
          endTime: mainStayEnd,
          notes: null,
          order: 1,
        });
        
        // Part 3: Return Travel (1 day)
        initialSegments.push({
          tempId: generateTempId(),
          name: "Return Travel",
          segmentType: "Travel",
          startLocation: "",
          endLocation: "",
          startTime: mainStayEnd,
          endTime: editEnd,
          notes: null,
          order: 2,
        });
      }
      
      onSegmentsUpdate(initialSegments);
      setNumParts(defaultNumParts);
    }
  }, [editStart, editEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync slider with segments length
  useEffect(() => {
    if (segments.length > 0 && segments.length !== numParts) {
      setNumParts(segments.length);
    }
  }, [segments.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync props to local state
  useEffect(() => {
    setEditTitle(title);
  }, [title]);

  useEffect(() => {
    setEditDescription(description);
  }, [description]);

  useEffect(() => {
    if (startDate) setEditStart(startDate);
    if (endDate) setEditEnd(endDate);
    if (startDate && endDate) {
      setDuration(calculateDays(startDate, endDate));
    }
  }, [startDate, endDate]);

  // Immediate update handlers
  const handleTitleChange = (newTitle: string) => {
    setEditTitle(newTitle);
    onUpdate({ title: newTitle });
  };

  const handleTitleBlur = () => {
    setEditingTitle(false);
  };

  const handleDescriptionChange = (newDescription: string) => {
    setEditDescription(newDescription);
    onUpdate({ description: newDescription });
  };

  const handleDescriptionBlur = () => {
    setEditingDescription(false);
  };

  const handleStartDateChange = (newStart: string) => {
    setHasInteractedWithDates(true);
    setEditStart(newStart);
    const newEnd = calculateEndDate(newStart, duration);
    setEditEnd(newEnd);
    onUpdate({ startDate: newStart, endDate: newEnd });
  };

  // Helper function to adjust segments when duration changes
  const adjustSegmentsForDurationChange = (newDuration: number, newEndDate: string) => {
    const newSegments = [...segments];
    const segmentCount = newSegments.length;
    
    if (segmentCount === 0) return; // No segments to adjust
    
    if (segmentCount === 1) {
      // Single segment: adjust to span entire trip
      newSegments[0].endTime = newEndDate;
    } 
    else if (segmentCount === 2) {
      // Two segments: adjust last segment
      const lastSegment = newSegments[1];
      const proposedDays = calculateDays(lastSegment.startTime, newEndDate);
      
      if (proposedDays < 1) {
        // Last segment would be too small, remove it
        const singleSegment = newSegments[0];
        singleSegment.endTime = newEndDate;
        onSegmentsUpdate([singleSegment]);
        setNumParts(1);
        showToast("Removed last segment - trip now has 1 part", "info");
        return;
      }
      
      lastSegment.endTime = newEndDate;
    } 
    else {
      // 3+ segments: distribute among middle segments
      const firstSegmentDays = calculateDays(newSegments[0].startTime, newSegments[0].endTime);
      const lastSegmentDays = calculateDays(newSegments[segmentCount - 1].startTime, newSegments[segmentCount - 1].endTime);
      
      // Calculate how many days should be in middle segments
      const middleDaysAvailable = newDuration - firstSegmentDays - lastSegmentDays;
      const middleSegmentCount = segmentCount - 2;
      
      if (middleDaysAvailable < middleSegmentCount) {
        showToast("Cannot shrink - each segment must be at least 1 day", "warning");
        return;
      }
      
      // Distribute days among middle segments
      const daysPerMiddleSegment = Math.floor(middleDaysAvailable / middleSegmentCount);
      const remainderDays = middleDaysAvailable % middleSegmentCount;
      
      // Rebuild segment dates
      let currentDate = newSegments[0].endTime!; // Start after first segment
      
      for (let i = 1; i < segmentCount - 1; i++) {
        const segmentDays = daysPerMiddleSegment + (i - 1 < remainderDays ? 1 : 0);
        newSegments[i].startTime = currentDate;
        currentDate = addDays(new Date(currentDate), segmentDays).toISOString().split("T")[0];
        newSegments[i].endTime = currentDate;
      }
      
      // Adjust last segment
      newSegments[segmentCount - 1].startTime = currentDate;
      newSegments[segmentCount - 1].endTime = newEndDate;
    }
    
    onSegmentsUpdate(newSegments);
  };

  const handleDurationChange = (days: number) => {
    setHasInteractedWithDates(true);
    setDuration(days);
    const newEnd = calculateEndDate(editStart, days);
    setEditEnd(newEnd);
    onUpdate({ startDate: editStart, endDate: newEnd });
    
    // Adjust existing segments if any exist
    if (segments.length > 0) {
      adjustSegmentsForDurationChange(days, newEnd);
    }
  };

  const handleEndDateChange = (newEnd: string) => {
    setHasInteractedWithDates(true);
    setEditEnd(newEnd);
    const days = calculateDays(editStart, newEnd);
    setDuration(days);
    onUpdate({ startDate: editStart, endDate: newEnd });
  };

  // Parts management handlers with smart naming
  const handlePartsCountChange = (count: number) => {
    setNumParts(count);
    
    const totalDays = calculateDays(editStart, editEnd);
    
    const newSegments: InMemorySegment[] = [];
    
    if (count === 1) {
      // Single part spanning entire trip
      const existingSegment = segments[0];
      newSegments.push({
        tempId: existingSegment?.tempId || generateTempId(),
        name: "Part 1",
        segmentType: existingSegment?.segmentType || "Stay",
        startLocation: existingSegment?.startLocation || "",
        endLocation: existingSegment?.endLocation || "",
        startTime: editStart,
        endTime: editEnd,
        notes: existingSegment?.notes || null,
        order: 0,
      });
    } else if (count === 2) {
      // Two parts - split evenly, generic naming
      const daysPerPart = Math.floor(totalDays / 2);
      const remainderDays = totalDays % 2;
      
      for (let i = 0; i < 2; i++) {
        const partStartDate = i === 0 ? editStart : newSegments[i - 1].endTime!;
        const partDuration = daysPerPart + (i < remainderDays ? 1 : 0);
        const partEndDate = addDays(new Date(partStartDate), partDuration).toISOString().split("T")[0];
        
        const existingSegment = segments[i];
        newSegments.push({
          tempId: existingSegment?.tempId || generateTempId(),
          name: `Part ${i + 1}`,
          segmentType: existingSegment?.segmentType || "Stay",
          startLocation: existingSegment?.startLocation || "",
          endLocation: existingSegment?.endLocation || "",
          startTime: partStartDate,
          endTime: partEndDate,
          notes: existingSegment?.notes || null,
          order: i,
        });
      }
    } else {
      // 3+ parts: Outbound (1 day) + Stays (distributed) + Return (1 day)
      const middlePartsDuration = totalDays - 2; // Reserve 1 day each for outbound/return
      const numMiddleParts = count - 2;
      const daysPerMiddlePart = Math.floor(middlePartsDuration / numMiddleParts);
      const remainderDays = middlePartsDuration % numMiddleParts;
      
      for (let i = 0; i < count; i++) {
        const partType = getSmartSegmentType(i, count);
        
        let partStartDate: string;
        let partDuration: number;
        
        if (i === 0) {
          // Outbound: 1 day
          partStartDate = editStart;
          partDuration = 1;
        } else if (i === count - 1) {
          // Return: 1 day (ends at trip end)
          partStartDate = newSegments[i - 1].endTime!;
          partDuration = calculateDays(partStartDate, editEnd);
        } else {
          // Middle stays: distributed duration
          partStartDate = newSegments[i - 1].endTime!;
          partDuration = daysPerMiddlePart + (i - 1 < remainderDays ? 1 : 0);
        }
        
        const partEndDate = i === count - 1 
          ? editEnd 
          : addDays(new Date(partStartDate), partDuration).toISOString().split("T")[0];
        
        const existingSegment = segments[i];
        const newSegment = {
          tempId: existingSegment?.tempId || generateTempId(),
          name: "",
          segmentType: existingSegment?.segmentType || partType,
          startLocation: existingSegment?.startLocation || "",
          endLocation: existingSegment?.endLocation || "",
          startTime: partStartDate,
          endTime: partEndDate,
          notes: existingSegment?.notes || null,
          order: i,
        };
        
        // Generate smart name based on locations
        newSegment.name = getSmartPartName(i, count, existingSegment || newSegment);
        
        newSegments.push(newSegment);
      }
    }
    
    onSegmentsUpdate(newSegments);
  };

  const handlePartUpdate = (index: number, updates: Partial<InMemorySegment>) => {
    const updatedSegments = [...segments];
    updatedSegments[index] = {
      ...updatedSegments[index],
      ...updates,
    };
    
    // Auto-populate locations for other segments based on the logic:
    // - If first segment has both startLocation and endLocation set
    // - Middle segment(s) start where first ends, and end in same location
    // - Last segment starts where middle ends, returns to first segment's start
    // IMPORTANT: Also copy coordinates (lat/lng) along with location names
    if (segments.length >= 3) {
      const firstSegment = index === 0 ? updatedSegments[0] : segments[0];
      
      // Check if first segment has both locations set
      if (firstSegment.startLocation && firstSegment.endLocation) {
        // Update middle segments (all segments between first and last)
        for (let i = 1; i < updatedSegments.length - 1; i++) {
          // Middle segments start where previous segment ends
          if (i === 1) {
            updatedSegments[i].startLocation = firstSegment.endLocation;
            // Copy coordinates from first segment's end
            updatedSegments[i].startLat = firstSegment.endLat;
            updatedSegments[i].startLng = firstSegment.endLng;
            updatedSegments[i].startTimeZoneId = firstSegment.endTimeZoneId;
            updatedSegments[i].startTimeZoneName = firstSegment.endTimeZoneName;
          } else {
            updatedSegments[i].startLocation = updatedSegments[i - 1].endLocation;
            // Copy coordinates from previous segment's end
            updatedSegments[i].startLat = updatedSegments[i - 1].endLat;
            updatedSegments[i].startLng = updatedSegments[i - 1].endLng;
            updatedSegments[i].startTimeZoneId = updatedSegments[i - 1].endTimeZoneId;
            updatedSegments[i].startTimeZoneName = updatedSegments[i - 1].endTimeZoneName;
          }
          // Middle segments end in the same location they start (unless manually set)
          if (!updatedSegments[i].endLocation || index === 0 || index === i - 1) {
            updatedSegments[i].endLocation = updatedSegments[i].startLocation;
            // Copy coordinates for end location
            updatedSegments[i].endLat = updatedSegments[i].startLat;
            updatedSegments[i].endLng = updatedSegments[i].startLng;
            updatedSegments[i].endTimeZoneId = updatedSegments[i].startTimeZoneId;
            updatedSegments[i].endTimeZoneName = updatedSegments[i].startTimeZoneName;
          }
        }
        
        // Update last segment
        const lastIndex = updatedSegments.length - 1;
        const secondToLastSegment = updatedSegments[lastIndex - 1];
        updatedSegments[lastIndex].startLocation = secondToLastSegment.endLocation;
        // Copy coordinates from second-to-last segment's end
        updatedSegments[lastIndex].startLat = secondToLastSegment.endLat;
        updatedSegments[lastIndex].startLng = secondToLastSegment.endLng;
        updatedSegments[lastIndex].startTimeZoneId = secondToLastSegment.endTimeZoneId;
        updatedSegments[lastIndex].startTimeZoneName = secondToLastSegment.endTimeZoneName;
        
        updatedSegments[lastIndex].endLocation = firstSegment.startLocation;
        // Copy coordinates from first segment's start
        updatedSegments[lastIndex].endLat = firstSegment.startLat;
        updatedSegments[lastIndex].endLng = firstSegment.startLng;
        updatedSegments[lastIndex].endTimeZoneId = firstSegment.startTimeZoneId;
        updatedSegments[lastIndex].endTimeZoneName = firstSegment.startTimeZoneName;
      }
    } else if (segments.length === 2) {
      // For 2 segments: second segment starts where first ends
      if (index === 0 && updatedSegments[0].endLocation) {
        updatedSegments[1].startLocation = updatedSegments[0].endLocation;
        // Copy coordinates from first segment's end
        updatedSegments[1].startLat = updatedSegments[0].endLat;
        updatedSegments[1].startLng = updatedSegments[0].endLng;
        updatedSegments[1].startTimeZoneId = updatedSegments[0].endTimeZoneId;
        updatedSegments[1].startTimeZoneName = updatedSegments[0].endTimeZoneName;
        
        // Second segment returns to start
        if (updatedSegments[0].startLocation) {
          updatedSegments[1].endLocation = updatedSegments[0].startLocation;
          // Copy coordinates from first segment's start
          updatedSegments[1].endLat = updatedSegments[0].startLat;
          updatedSegments[1].endLng = updatedSegments[0].startLng;
          updatedSegments[1].endTimeZoneId = updatedSegments[0].startTimeZoneId;
          updatedSegments[1].endTimeZoneName = updatedSegments[0].startTimeZoneName;
        }
      }
    }
    
    onSegmentsUpdate(updatedSegments);
  };

  // Handle divider drag for day-based resizing
  const handleDividerDrag = (dividerIndex: number, targetDayIndex: number) => {
    // dividerIndex = 0 means between segment[0] and segment[1]
    const newSegments = [...segments];
    
    // Calculate new boundary date
    const newBoundaryDate = addDays(new Date(editStart), targetDayIndex).toISOString().split("T")[0];
    
    // Validate: ensure both segments have at least 1 day
    const leftSegmentDays = calculateDays(newSegments[dividerIndex].startTime, newBoundaryDate);
    const rightSegmentDays = calculateDays(newBoundaryDate, newSegments[dividerIndex + 1].endTime);
    
    if (leftSegmentDays < 1 || rightSegmentDays < 1) {
      return; // Don't update if invalid
    }
    
    // Update segment boundaries
    newSegments[dividerIndex].endTime = newBoundaryDate;
    newSegments[dividerIndex + 1].startTime = newBoundaryDate;
    
    onSegmentsUpdate(newSegments);
  };

  const showToast = (message: string, type: "success" | "error" | "warning" | "info") => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleAddSegmentBetween = (afterIndex: number) => {
    const newSegments = [...segments];
    const prevSegment = newSegments[afterIndex];
    const nextSegment = newSegments[afterIndex + 1];
    
    // Calculate days in each segment
    const prevDays = calculateDays(prevSegment.startTime, prevSegment.endTime);
    const nextDays = calculateDays(nextSegment.startTime, nextSegment.endTime);
    
    // Need at least 2 days total to split
    if (prevDays + nextDays < 3) {
      showToast("Not enough space to add segment. Each segment needs at least 1 day.", "warning");
      return;
    }
    
    // Take 1 day from the larger segment
    let splitFromPrev = prevDays > nextDays;
    if (prevDays === 1) splitFromPrev = false;
    if (nextDays === 1) splitFromPrev = true;
    
    if (splitFromPrev) {
      // Split from previous segment
      const newPrevEnd = addDays(new Date(prevSegment.startTime!), prevDays - 1).toISOString().split("T")[0];
      const newSegmentEnd = prevSegment.endTime;
      
      prevSegment.endTime = newPrevEnd;
      
      const newSegment: InMemorySegment = {
        tempId: generateTempId(),
        name: `Part ${afterIndex + 2}`,
        segmentType: "Stay",
        startLocation: "",
        endLocation: "",
        startTime: newPrevEnd,
        endTime: newSegmentEnd,
        notes: null,
        order: afterIndex + 1,
      };
      
      nextSegment.startTime = newSegmentEnd;
      newSegments.splice(afterIndex + 1, 0, newSegment);
    } else {
      // Split from next segment
      const newSegmentStart = nextSegment.startTime;
      const newNextStart = addDays(new Date(nextSegment.startTime!), 1).toISOString().split("T")[0];
      
      const newSegment: InMemorySegment = {
        tempId: generateTempId(),
        name: `Part ${afterIndex + 2}`,
        segmentType: "Stay",
        startLocation: "",
        endLocation: "",
        startTime: newSegmentStart,
        endTime: newNextStart,
        notes: null,
        order: afterIndex + 1,
      };
      
      nextSegment.startTime = newNextStart;
      newSegments.splice(afterIndex + 1, 0, newSegment);
    }
    
    // Update order for all segments
    newSegments.forEach((seg, idx) => {
      seg.order = idx;
    });
    
    // Update slider
    setNumParts(newSegments.length);
    
    onSegmentsUpdate(newSegments);
    showToast(`Added new segment between ${prevSegment.name} and ${nextSegment.name}`, "success");
  };

  const handleSwapSegment = (segmentIndex: number, direction: 'left' | 'right') => {
    const newSegments = [...segments];
    const targetIndex = direction === 'left' ? segmentIndex - 1 : segmentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= segments.length) return;
    
    // Swap segments
    [newSegments[segmentIndex], newSegments[targetIndex]] = 
      [newSegments[targetIndex], newSegments[segmentIndex]];
    
    // Swap dates to maintain timeline continuity
    const temp = {
      startTime: newSegments[segmentIndex].startTime,
      endTime: newSegments[segmentIndex].endTime,
    };
    
    newSegments[segmentIndex].startTime = newSegments[targetIndex].startTime;
    newSegments[segmentIndex].endTime = newSegments[targetIndex].endTime;
    newSegments[targetIndex].startTime = temp.startTime;
    newSegments[targetIndex].endTime = temp.endTime;
    
    // Update order
    newSegments.forEach((seg, idx) => {
      seg.order = idx;
    });
    
    onSegmentsUpdate(newSegments);
    showToast(
      `Swapped ${newSegments[targetIndex].name} with ${newSegments[segmentIndex].name}`,
      "success"
    );
  };

  const handleAddDayToStart = () => {
    const newStart = addDays(new Date(editStart), -1).toISOString().split("T")[0];
    setEditStart(newStart);
    onUpdate({ startDate: newStart });
    
    // Extend first segment
    const newSegments = [...segments];
    newSegments[0].startTime = newStart;
    onSegmentsUpdate(newSegments);
    
    showToast("Added 1 day to trip start", "success");
  };

  const handleRemoveDayFromStart = () => {
    const totalDays = calculateDays(editStart, editEnd);
    
    // Check if removing would make trip shorter than number of parts
    if (totalDays - 1 < segments.length) {
      const confirmed = confirm(
        `Removing this day would make your trip (${totalDays - 1} days) shorter than the number of parts (${segments.length}). Would you like to remove one part?`
      );
      
      if (!confirmed) return;
      
      // Remove last segment and adjust slider
      const newSegments = segments.slice(0, -1);
      
      // Extend the new last segment to fill the gap
      if (newSegments.length > 0) {
        newSegments[newSegments.length - 1].endTime = editEnd;
      }
      
      onSegmentsUpdate(newSegments);
      setNumParts(newSegments.length);
      showToast(`Removed last part. Trip now has ${newSegments.length} parts.`, "info");
      return;
    }
    
    const firstSegment = segments[0];
    const firstSegmentDays = calculateDays(firstSegment.startTime, firstSegment.endTime);
    
    if (firstSegmentDays <= 1) {
      showToast("Cannot remove day - first segment is already 1 day", "warning");
      return;
    }
    
    const newStart = addDays(new Date(editStart), 1).toISOString().split("T")[0];
    setEditStart(newStart);
    onUpdate({ startDate: newStart });
    
    // Shrink first segment
    const newSegments = [...segments];
    newSegments[0].startTime = newStart;
    onSegmentsUpdate(newSegments);
    
    showToast("Removed 1 day from trip start", "success");
  };

  const handleAddDayToEnd = () => {
    const newEnd = addDays(new Date(editEnd), 1).toISOString().split("T")[0];
    setEditEnd(newEnd);
    onUpdate({ endDate: newEnd });
    
    // Extend last segment
    const newSegments = [...segments];
    newSegments[newSegments.length - 1].endTime = newEnd;
    onSegmentsUpdate(newSegments);
    
    showToast("Added 1 day to trip end", "success");
  };

  const handleRemoveDayFromEnd = () => {
    const totalDays = calculateDays(editStart, editEnd);
    
    // Check if removing would make trip shorter than number of parts
    if (totalDays - 1 < segments.length) {
      const confirmed = confirm(
        `Removing this day would make your trip (${totalDays - 1} days) shorter than the number of parts (${segments.length}). Would you like to remove one part?`
      );
      
      if (!confirmed) return;
      
      // Remove last segment and adjust slider
      const newSegments = segments.slice(0, -1);
      
      // Adjust the new last segment
      if (newSegments.length > 0) {
        const newEnd = addDays(new Date(editEnd), -1).toISOString().split("T")[0];
        newSegments[newSegments.length - 1].endTime = newEnd;
        setEditEnd(newEnd);
        onUpdate({ endDate: newEnd });
      }
      
      onSegmentsUpdate(newSegments);
      setNumParts(newSegments.length);
      showToast(`Removed last part. Trip now has ${newSegments.length} parts.`, "info");
      return;
    }
    
    const lastSegment = segments[segments.length - 1];
    const lastSegmentDays = calculateDays(lastSegment.startTime, lastSegment.endTime);
    
    if (lastSegmentDays <= 1) {
      showToast("Cannot remove day - last segment is already 1 day", "warning");
      return;
    }
    
    const newEnd = addDays(new Date(editEnd), -1).toISOString().split("T")[0];
    setEditEnd(newEnd);
    onUpdate({ endDate: newEnd });
    
    // Shrink last segment
    const newSegments = [...segments];
    newSegments[newSegments.length - 1].endTime = newEnd;
    onSegmentsUpdate(newSegments);
    
    showToast("Removed 1 day from trip end", "success");
  };

  // Completion status
  const isEmpty = !title && !startDate && !endDate;
  const isComplete = title && startDate && endDate;
  
  // Progressive disclosure flags
  const hasTypedTitle = editTitle.length > 2;
  const showDates = hasTypedTitle;
  const showTimeline = hasInteractedWithDates;

  return (
    <div
      className={`relative rounded-lg p-4 shadow-sm border-2 transition-all ${
        isEmpty
          ? "bg-slate-50 border-slate-200"
          : isComplete
          ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300"
          : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
      }`}
    >
      {/* Completion Badge */}
      {isComplete && (
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm">
          <Check className="h-4 w-4" />
        </div>
      )}

      <div className="space-y-3">
        {/* Title and Dates - Horizontal Layout */}
        <div className={`flex flex-col ${showDates ? 'md:flex-row md:gap-4' : ''} gap-3`}>
          {/* Title Field - Left Side - 50% */}
          <div className={showDates ? 'md:w-1/2' : 'w-full'}>
            {editingTitle ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleBlur();
                  if (e.key === "Escape") {
                    setEditTitle(title);
                    setEditingTitle(false);
                  }
                }}
                className="w-full text-lg font-semibold border-b border-blue-400 focus:outline-none focus:border-blue-600 pb-1 bg-transparent"
                placeholder="Trip title..."
                autoFocus
              />
            ) : (
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-white/50 rounded px-2 py-1 -mx-2 transition-colors group"
                onClick={() => setEditingTitle(true)}
              >
                <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-slate-900 flex-1">
                  {title || <span className="text-slate-400 italic">Add a trip title...</span>}
                </h3>
                <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  click to edit
                </span>
              </div>
            )}
          </div>

          {/* Dates Section - Right Side - 50% (conditionally shown) */}
          {showDates && (
            <div className="bg-white/50 rounded-lg p-3 border border-blue-200 md:w-1/2">
              <div className="flex flex-col md:grid md:grid-cols-3 gap-3 items-center">
                {/* Start Date - Left */}
                <div className="w-full">
                  <label className="text-xs font-medium text-slate-600 block mb-1.5">
                    Start Date
                  </label>
                  <DatePopover
                    value={editStart}
                    onChange={handleStartDateChange}
                    label="Select start date"
                    minDate={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full justify-start"
                  />
                </div>

                {/* Duration Slider - Center */}
                <div className="w-full flex flex-col items-center">
                  <div className="text-center mb-1.5">
                    <span className="text-xl font-bold text-blue-600">{duration}</span>
                    <span className="text-sm text-slate-600 ml-1">days</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={maxDuration}
                    value={duration}
                    onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    style={{
                      background: `linear-gradient(to right, rgb(37, 99, 235) 0%, rgb(37, 99, 235) ${(duration / maxDuration) * 100}%, rgb(226, 232, 240) ${(duration / maxDuration) * 100}%, rgb(226, 232, 240) 100%)`,
                    }}
                  />
                  <div className="flex justify-between w-full text-xs text-slate-400 mt-1">
                    <span>1</span>
                    <span>{maxDuration}</span>
                  </div>
                </div>

                {/* End Date - Right */}
                <div className="w-full">
                  <label className="text-xs font-medium text-slate-600 block mb-1.5">
                    End Date
                  </label>
                  <DatePopover
                    value={editEnd}
                    onChange={handleEndDateChange}
                    label="Select end date"
                    minDate={editStart}
                    className="w-full justify-start"
                  />
                </div>
              </div>

              {/* Extend Range Option */}
              {!extendedRange && duration >= 30 && (
                <button
                  onClick={() => setExtendedRange(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2 block"
                >
                  + Need more than 30 days?
                </button>
              )}

              {extendedRange && (
                <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-600" />
                  <span>Extended range enabled (up to 90 days)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timeline Section - Conditionally shown after date interaction */}
        {showTimeline && editStart && editEnd && (
          <div className="border-t border-blue-200 pt-3 mt-3">
            {/* Horizontal Timeline - Desktop */}
            <div className="hidden md:block">
              {/* Timeline */}
              <div className="relative">
                <div className="w-full relative">
                  {/* Plus buttons layer - absolute positioned above */}
                  <div className="absolute -top-8 left-0 right-0 h-6 flex">
                    {segments.map((segment, index) => {
                      if (index >= segments.length - 1 || segments.length >= 10) return null;
                      
                      const leftOffset = segments.slice(0, index + 1).reduce((sum, seg) => {
                        return sum + (calculateDays(seg.startTime, seg.endTime) / totalTripDays) * 100;
                      }, 0);
                      
                      return (
                        <button
                          key={`plus-${segment.tempId}`}
                          onClick={() => handleAddSegmentBetween(index)}
                          className="absolute w-6 h-6 -translate-x-1/2 bg-white border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded-full flex items-center justify-center transition-all group shadow-sm z-10"
                          style={{ left: `${leftOffset}%` }}
                          title="Add segment"
                        >
                          <Plus className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Timeline container with segments and dividers */}
                  <div className="flex flex-col gap-2">
                    <div 
                      ref={timelineRef}
                      className="flex gap-0 rounded-lg overflow-visible border-2 border-slate-200"
                    >
                      {segments.map((segment, index) => {
                        const segmentDays = calculateDays(segment.startTime, segment.endTime);
                        const widthPercent = (segmentDays / totalTripDays) * 100;
                        
                        return (
                          <React.Fragment key={segment.tempId}>
                            <HorizontalSegmentBlock
                              segment={segment}
                              widthPercent={widthPercent}
                              segmentNumber={index + 1}
                              onUpdate={(updates) => handlePartUpdate(index, updates)}
                              onContentClick={() => setEditingSegmentId(segment.tempId)}
                              isHovered={hoveredSegmentId === segment.tempId}
                              onMouseEnter={() => setHoveredSegmentId(segment.tempId)}
                              onMouseLeave={() => setHoveredSegmentId(null)}
                            />
                            {index < segments.length - 1 && (
                              <SegmentDivider
                                dividerIndex={index}
                                totalDays={totalTripDays}
                                startDate={editStart}
                                onDrag={handleDividerDrag}
                                timelineRef={timelineRef}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                    
                    {/* Day dashes below segments */}
                    <TripDayDashes
                      totalDays={totalTripDays}
                      segments={segments}
                      startDate={editStart}
                    />
                  </div>
                  
                  {/* Date labels below day dashes */}
                  <div className="flex justify-between items-center text-xs text-slate-600 mt-2 font-medium">
                    <div className="flex flex-col">
                      <span className="text-slate-900">{format(new Date(editStart), "EEE, MMM d")}</span>
                      <span className="text-slate-400">Start</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-slate-900">{format(new Date(editEnd), "EEE, MMM d")}</span>
                      <span className="text-slate-400">End</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vertical Part Tiles - Mobile */}
            <div className="md:hidden space-y-1.5">
              {segments.map((segment, index) => (
                <PartTile
                  key={segment.tempId}
                  part={segment}
                  partNumber={index + 1}
                  onUpdate={(updates) => handlePartUpdate(index, updates)}
                  isHovered={hoveredSegmentId === segment.tempId}
                  onMouseEnter={() => setHoveredSegmentId(segment.tempId)}
                  onMouseLeave={() => setHoveredSegmentId(null)}
                />
              ))}
            </div>

            {/* Interactive Map */}
            <div className="mt-4">
              <TripStructureMap
                segments={segments}
                hoveredSegmentId={hoveredSegmentId}
                onSegmentHover={setHoveredSegmentId}
                height="400px"
              />
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Segment Edit Modal */}
      {editingSegmentId && (
        <SegmentEditModal
          segment={segments.find(s => s.tempId === editingSegmentId)!}
          segmentNumber={segments.findIndex(s => s.tempId === editingSegmentId) + 1}
          isOpen={true}
          onClose={() => setEditingSegmentId(null)}
          onUpdate={(updates) => {
            const index = segments.findIndex(s => s.tempId === editingSegmentId);
            handlePartUpdate(index, updates);
          }}
        />
      )}
    </div>
  );
}

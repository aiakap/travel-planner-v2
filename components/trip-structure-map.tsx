"use client";

import {
  GoogleMap,
  InfoWindow,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { MapPin } from "lucide-react";

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

interface RouteGroup {
  type: 'bidirectional' | 'unidirectional' | 'pin';
  segments: InMemorySegment[];
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
}

interface TripStructureMapProps {
  segments: InMemorySegment[];
  hoveredSegmentId: string | null;
  onSegmentHover: (segmentId: string | null) => void;
  height?: string;
}

const containerStyle = { width: "100%", height: "100%" };

// Segment type colors matching timeline
const segmentTypeMapColors: Record<string, string> = {
  Travel: "#3b82f6",      // blue-500
  Stay: "#6366f1",        // indigo-500
  Tour: "#a855f7",        // purple-500
  Retreat: "#14b8a6",     // teal-500
  "Road Trip": "#f97316", // orange-500
};

// Helper to parse YYYY-MM-DD or ISO date string to Date (avoiding timezone issues)
const parseLocalDate = (dateStr: string): Date => {
  // If it's a YYYY-MM-DD format, parse as local date
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  // Otherwise parse as-is (ISO string)
  return new Date(dateStr);
};

const calculateDays = (start: string | null, end: string | null): number => {
  if (!start || !end) return 1;
  const startDt = parseLocalDate(start);
  const endDt = parseLocalDate(end);
  const days = Math.ceil((endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
};

const formatDateRange = (start: string | null, end: string | null): string => {
  if (!start || !end) return "";
  const startDate = parseLocalDate(start);
  const endDate = parseLocalDate(end);
  return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`;
};

// Get color for segment type
const getSegmentColor = (segmentType: string): string => {
  return segmentTypeMapColors[segmentType] || segmentTypeMapColors.Stay;
};

// Group segments into route groups (bidirectional, unidirectional, or pins)
const groupRoutes = (segments: InMemorySegment[]): RouteGroup[] => {
  const groups: RouteGroup[] = [];
  const processed = new Set<string>();
  
  segments.forEach((segment) => {
    if (processed.has(segment.tempId)) return;
    
    // Check if it's a pin (same location)
    if (segment.startLat === segment.endLat && segment.startLng === segment.endLng) {
      groups.push({
        type: 'pin',
        segments: [segment],
        startLat: segment.startLat!,
        startLng: segment.startLng!,
        endLat: segment.endLat!,
        endLng: segment.endLng!,
        color: getSegmentColor(segment.segmentType),
      });
      processed.add(segment.tempId);
      return;
    }
    
    // Look for reverse route (bidirectional)
    const reverseSegment = segments.find(
      (s) =>
        !processed.has(s.tempId) &&
        s.tempId !== segment.tempId &&
        Math.abs(s.startLat! - segment.endLat!) < 0.001 &&
        Math.abs(s.startLng! - segment.endLng!) < 0.001 &&
        Math.abs(s.endLat! - segment.startLat!) < 0.001 &&
        Math.abs(s.endLng! - segment.startLng!) < 0.001
    );
    
    if (reverseSegment) {
      // Bidirectional route found
      groups.push({
        type: 'bidirectional',
        segments: [segment, reverseSegment],
        startLat: segment.startLat!,
        startLng: segment.startLng!,
        endLat: segment.endLat!,
        endLng: segment.endLng!,
        color: getSegmentColor(segment.segmentType),
      });
      processed.add(segment.tempId);
      processed.add(reverseSegment.tempId);
    } else {
      // Unidirectional route
      groups.push({
        type: 'unidirectional',
        segments: [segment],
        startLat: segment.startLat!,
        startLng: segment.startLng!,
        endLat: segment.endLat!,
        endLng: segment.endLng!,
        color: getSegmentColor(segment.segmentType),
      });
      processed.add(segment.tempId);
    }
  });
  
  return groups;
};

export function TripStructureMap({
  segments,
  hoveredSegmentId,
  onSegmentHover,
  height = "400px",
}: TripStructureMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [activeInfoWindow, setActiveInfoWindow] = useState<string | null>(null);
  const [infoWindowPosition, setInfoWindowPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
  });

  // Filter segments with location data
  const segmentsWithLocations = useMemo(() => {
    return segments.filter(
      (seg) =>
        seg.startLat !== undefined &&
        seg.startLng !== undefined &&
        seg.endLat !== undefined &&
        seg.endLng !== undefined
    );
  }, [segments]);

  // Group routes for bidirectional detection
  const routeGroups = useMemo(() => {
    return groupRoutes(segmentsWithLocations);
  }, [segmentsWithLocations]);

  // Calculate center and bounds
  const { center, hasLocations } = useMemo(() => {
    if (segmentsWithLocations.length === 0) {
      return { center: { lat: 0, lng: 0 }, hasLocations: false };
    }

    const firstSegment = segmentsWithLocations[0];
    return {
      center: { lat: firstSegment.startLat!, lng: firstSegment.startLng! },
      hasLocations: true,
    };
  }, [segmentsWithLocations]);

  // Auto-fit bounds when segments change
  useEffect(() => {
    if (!mapInstance || segmentsWithLocations.length === 0) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    segmentsWithLocations.forEach((segment) => {
      bounds.extend({ lat: segment.startLat!, lng: segment.startLng! });
      bounds.extend({ lat: segment.endLat!, lng: segment.endLng! });
    });
    mapInstance.fitBounds(bounds);
  }, [mapInstance, segmentsWithLocations]);

  if (!apiKey) {
    return (
      <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg flex items-center justify-center" style={{ height }}>
        <p className="text-slate-500 text-sm">Missing Google Maps API key</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg flex items-center justify-center" style={{ height }}>
        <p className="text-slate-500 text-sm">Error loading maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg flex items-center justify-center" style={{ height }}>
        <p className="text-slate-500 text-sm">Loading map...</p>
      </div>
    );
  }

  if (!hasLocations) {
    return (
      <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-lg flex flex-col items-center justify-center gap-3 p-6" style={{ height }}>
        <MapPin className="h-12 w-12 text-slate-300" />
        <p className="text-slate-500 text-sm font-medium">Add locations to segments to see them on the map</p>
        <p className="text-slate-400 text-xs">Click on a segment above to edit and add locations</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border-2 border-slate-200 shadow-sm" style={{ height }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        zoom={8}
        center={center}
        onLoad={(map) => setMapInstance(map)}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {routeGroups.map((group, groupIndex) => {
          // Check if any segment in this group is hovered
          const isHovered = group.segments.some(seg => seg.tempId === hoveredSegmentId);
          const groupKey = group.segments.map(s => s.tempId).join('-');

          if (group.type === 'pin') {
            // Render single pin for same location
            const segment = group.segments[0];
            const segmentNumber = segment.order + 1;
            
            return (
              <div key={groupKey}>
                <Marker
                  position={{ lat: group.startLat, lng: group.startLng }}
                  title={segment.name || `Part ${segmentNumber}`}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: group.color,
                    fillOpacity: isHovered ? 1 : 0.8,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                    scale: isHovered ? 12 : 10,
                  }}
                  label={{
                    text: segmentNumber.toString(),
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                  onClick={() => setActiveInfoWindow(groupKey)}
                  onMouseOver={() => onSegmentHover(segment.tempId)}
                  onMouseOut={() => onSegmentHover(null)}
                />
                {activeInfoWindow === groupKey && (
                  <InfoWindow
                    position={{ lat: group.startLat, lng: group.startLng }}
                    onCloseClick={() => setActiveInfoWindow(null)}
                  >
                    <div className="text-sm max-w-xs">
                      <div className="font-semibold text-slate-900 mb-1">
                        {segment.name || `Part ${segmentNumber}`}
                      </div>
                      <div className="text-xs text-slate-600 mb-2">
                        Type: {segment.segmentType}
                      </div>
                      <div className="text-xs text-slate-700 mb-1">
                        {segment.startLocation}
                      </div>
                      <div className="text-xs text-slate-600">
                        Duration: {calculateDays(segment.startTime, segment.endTime)} days
                      </div>
                      <div className="text-xs text-slate-600">
                        {formatDateRange(segment.startTime, segment.endTime)}
                      </div>
                      {segment.notes && (
                        <div className="text-xs text-slate-500 mt-2 italic">
                          {segment.notes}
                        </div>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </div>
            );
          } else if (group.type === 'bidirectional') {
            // Render bidirectional route with arrows at both ends
            return (
              <div key={groupKey}>
                {/* Bidirectional polyline with dual arrows */}
                <Polyline
                  path={[
                    { lat: group.startLat, lng: group.startLng },
                    { lat: group.endLat, lng: group.endLng },
                  ]}
                  options={{
                    strokeColor: group.color,
                    strokeOpacity: isHovered ? 1 : 0.7,
                    strokeWeight: isHovered ? 5 : 3,
                    geodesic: true,
                    icons: [
                      {
                        icon: {
                          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                          scale: 4,
                          fillColor: group.color,
                          fillOpacity: 1,
                          strokeColor: "#ffffff",
                          strokeWeight: 1,
                        },
                        offset: "0%",
                      },
                      {
                        icon: {
                          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                          scale: 4,
                          fillColor: group.color,
                          fillOpacity: 1,
                          strokeColor: "#ffffff",
                          strokeWeight: 1,
                        },
                        offset: "100%",
                      },
                    ],
                  }}
                  onMouseOver={(e: google.maps.MapMouseEvent) => {
                    onSegmentHover(group.segments[0].tempId);
                    if (e.latLng) {
                      setInfoWindowPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                      setActiveInfoWindow(groupKey);
                    }
                  }}
                  onMouseOut={() => {
                    onSegmentHover(null);
                    setActiveInfoWindow(null);
                    setInfoWindowPosition(null);
                  }}
                  onClick={(e: google.maps.MapMouseEvent) => {
                    if (e.latLng) {
                      setInfoWindowPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                      setActiveInfoWindow(groupKey);
                    }
                  }}
                />
                
                {/* Start marker */}
                <Marker
                  position={{ lat: group.startLat, lng: group.startLng }}
                  title={`${group.segments[0].startLocation}`}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: group.color,
                    fillOpacity: isHovered ? 1 : 0.8,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                    scale: isHovered ? 10 : 8,
                  }}
                  label={{
                    text: "⇄",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                  onClick={() => setActiveInfoWindow(groupKey)}
                  onMouseOver={() => onSegmentHover(group.segments[0].tempId)}
                  onMouseOut={() => onSegmentHover(null)}
                />
                
                {/* End marker */}
                <Marker
                  position={{ lat: group.endLat, lng: group.endLng }}
                  title={`${group.segments[0].endLocation}`}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: group.color,
                    fillOpacity: isHovered ? 1 : 0.8,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                    scale: isHovered ? 10 : 8,
                  }}
                  label={{
                    text: "⇄",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                  onClick={() => setActiveInfoWindow(groupKey)}
                  onMouseOver={() => onSegmentHover(group.segments[0].tempId)}
                  onMouseOut={() => onSegmentHover(null)}
                />
                
                {/* Info window for bidirectional route */}
                {activeInfoWindow === groupKey && infoWindowPosition && (
                  <InfoWindow
                    position={infoWindowPosition}
                    onCloseClick={() => {
                      setActiveInfoWindow(null);
                      setInfoWindowPosition(null);
                    }}
                  >
                    <div className="text-xs max-w-[240px]">
                      <div className="font-semibold text-slate-900 mb-1.5 text-[11px]">
                        Round Trip
                      </div>
                      {group.segments.map((seg, idx) => {
                        const segmentNumber = seg.order + 1;
                        return (
                          <div key={seg.tempId} className={idx > 0 ? "mt-1.5 pt-1.5 border-t border-slate-200" : ""}>
                            <div className="font-medium text-slate-800 text-[11px]">
                              Part {segmentNumber}: {seg.startLocation} → {seg.endLocation}
                            </div>
                            <div className="text-slate-600 text-[10px]">
                              {formatDateRange(seg.startTime, seg.endTime)} ({calculateDays(seg.startTime, seg.endTime)}d)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </InfoWindow>
                )}
              </div>
            );
          } else {
            // Render unidirectional route
            const segment = group.segments[0];
            const segmentNumber = segment.order + 1;
            
            return (
              <div key={groupKey}>
                {/* Unidirectional polyline */}
                <Polyline
                  path={[
                    { lat: group.startLat, lng: group.startLng },
                    { lat: group.endLat, lng: group.endLng },
                  ]}
                  options={{
                    strokeColor: group.color,
                    strokeOpacity: isHovered ? 1 : 0.7,
                    strokeWeight: isHovered ? 4 : 3,
                    geodesic: true,
                    icons: [
                      {
                        icon: {
                          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                          scale: 3,
                          fillColor: group.color,
                          fillOpacity: 1,
                          strokeColor: "#ffffff",
                          strokeWeight: 1,
                        },
                        offset: "100%",
                      },
                    ],
                  }}
                  onMouseOver={() => onSegmentHover(segment.tempId)}
                  onMouseOut={() => onSegmentHover(null)}
                  onClick={() => setActiveInfoWindow(groupKey)}
                />
                
                {/* Start marker */}
                <Marker
                  position={{ lat: group.startLat, lng: group.startLng }}
                  title={`Start: ${segment.startLocation}`}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: group.color,
                    fillOpacity: isHovered ? 1 : 0.8,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                    scale: isHovered ? 10 : 8,
                  }}
                  label={{
                    text: "S",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                  onClick={() => setActiveInfoWindow(groupKey)}
                  onMouseOver={() => onSegmentHover(segment.tempId)}
                  onMouseOut={() => onSegmentHover(null)}
                />
                
                {/* End marker */}
                <Marker
                  position={{ lat: group.endLat, lng: group.endLng }}
                  title={`End: ${segment.endLocation}`}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: group.color,
                    fillOpacity: isHovered ? 1 : 0.8,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                    scale: isHovered ? 10 : 8,
                  }}
                  label={{
                    text: "E",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                  onClick={() => setActiveInfoWindow(groupKey)}
                  onMouseOver={() => onSegmentHover(segment.tempId)}
                  onMouseOut={() => onSegmentHover(null)}
                />
                
                {/* Info window for unidirectional route */}
                {activeInfoWindow === groupKey && (
                  <InfoWindow
                    position={{
                      lat: (group.startLat + group.endLat) / 2,
                      lng: (group.startLng + group.endLng) / 2,
                    }}
                    onCloseClick={() => setActiveInfoWindow(null)}
                  >
                    <div className="text-sm max-w-xs">
                      <div className="font-semibold text-slate-900 mb-1">
                        {segment.name || `Part ${segmentNumber}`}
                      </div>
                      <div className="text-xs text-slate-600 mb-2">
                        Type: {segment.segmentType}
                      </div>
                      <div className="text-xs text-slate-700 mb-1">
                        {segment.startLocation} → {segment.endLocation}
                      </div>
                      <div className="text-xs text-slate-600">
                        Duration: {calculateDays(segment.startTime, segment.endTime)} days
                      </div>
                      <div className="text-xs text-slate-600">
                        {formatDateRange(segment.startTime, segment.endTime)}
                      </div>
                      {segment.notes && (
                        <div className="text-xs text-slate-500 mt-2 italic">
                          {segment.notes}
                        </div>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </div>
            );
          }
        })}
      </GoogleMap>
    </div>
  );
}

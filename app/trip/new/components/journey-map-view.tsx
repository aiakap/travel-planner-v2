"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

interface Segment {
  id: string;
  type: string;
  name: string;
  start_location: string;
  end_location: string;
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
}

interface JourneyMapViewProps {
  segments: Segment[];
  focusedIndex?: number;
  onMarkerClick?: (index: number) => void;
}

interface MarkerData {
  position: google.maps.LatLngLiteral;
  segmentIndex: number;
  color: string;
  type: 'start' | 'end' | 'both';
}

interface MarkerGroup {
  position: google.maps.LatLngLiteral;
  chapters: Array<{
    index: number;
    label: string;
    color: string;
    type: 'start' | 'end' | 'both';
    name: string;
  }>;
  count: number;
  blendedColor: string;
}

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '400px',
};

const defaultCenter = {
  lat: 20,
  lng: 0,
};

// Generate gradient color for chapter index
const getChapterColor = (index: number, total: number): string => {
  const hue = (index / Math.max(total - 1, 1)) * 300;
  return `hsl(${hue}, 70%, 50%)`;
};

// Convert HSL to RGB for blending
const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
};

// Blend multiple colors
const blendColors = (colors: string[]): string => {
  if (colors.length === 0) return '#4F46E5';
  if (colors.length === 1) return colors[0];
  
  let totalR = 0, totalG = 0, totalB = 0;
  
  colors.forEach(color => {
    // Parse HSL
    const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const [r, g, b] = hslToRgb(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
      totalR += r;
      totalG += g;
      totalB += b;
    }
  });
  
  const avgR = Math.round(totalR / colors.length);
  const avgG = Math.round(totalG / colors.length);
  const avgB = Math.round(totalB / colors.length);
  
  return `rgb(${avgR}, ${avgG}, ${avgB})`;
};

export function JourneyMapView({ segments, focusedIndex, onMarkerClick }: JourneyMapViewProps) {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [selectedGroup, setSelectedGroup] = useState<MarkerGroup | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  // Calculate map center and bounds
  useEffect(() => {
    if (!mapInstance || segments.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    let hasValidCoordinates = false;

    segments.forEach((segment) => {
      if (segment.start_lat && segment.start_lng) {
        bounds.extend({ lat: segment.start_lat, lng: segment.start_lng });
        hasValidCoordinates = true;
      }
      if (segment.end_lat && segment.end_lng && 
          (segment.start_lat !== segment.end_lat || segment.start_lng !== segment.end_lng)) {
        bounds.extend({ lat: segment.end_lat, lng: segment.end_lng });
        hasValidCoordinates = true;
      }
    });

    if (hasValidCoordinates) {
      mapInstance.fitBounds(bounds);
      
      // Add padding to bounds
      const padding = { top: 50, right: 50, bottom: 50, left: 50 };
      mapInstance.fitBounds(bounds, padding);
    }
  }, [mapInstance, segments]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMapInstance(null);
  }, []);

  if (loadError) {
    return (
      <div className="w-full h-full min-h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MapPin size={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Unable to load map</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full min-h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  // Build markers and polylines
  const markers: MarkerData[] = [];
  const polylines: Array<{ path: google.maps.LatLngLiteral[]; color: string }> = [];

  segments.forEach((segment, index) => {
    const color = getChapterColor(index, segments.length);
    
    // Determine marker type
    const isSameLocation = segment.start_lat === segment.end_lat && segment.start_lng === segment.end_lng;
    
    // Add start marker
    if (segment.start_lat && segment.start_lng) {
      markers.push({
        position: { lat: segment.start_lat, lng: segment.start_lng },
        segmentIndex: index,
        color,
        type: isSameLocation ? 'both' : 'start',
      });
    }

    // Add end marker if different from start
    if (segment.end_lat && segment.end_lng && !isSameLocation) {
      markers.push({
        position: { lat: segment.end_lat, lng: segment.end_lng },
        segmentIndex: index,
        color,
        type: 'end',
      });
    }

    // Add polyline connecting start to end
    if (segment.start_lat && segment.start_lng && segment.end_lat && segment.end_lng && !isSameLocation) {
      polylines.push({
        path: [
          { lat: segment.start_lat, lng: segment.start_lng },
          { lat: segment.end_lat, lng: segment.end_lng },
        ],
        color,
      });
    }

    // Add polyline connecting to next segment
    if (index < segments.length - 1) {
      const nextSegment = segments[index + 1];
      const nextColor = getChapterColor(index + 1, segments.length);
      if (segment.end_lat && segment.end_lng && nextSegment.start_lat && nextSegment.start_lng) {
        // Only draw connection if they're different locations
        if (segment.end_lat !== nextSegment.start_lat || segment.end_lng !== nextSegment.start_lng) {
          polylines.push({
            path: [
              { lat: segment.end_lat, lng: segment.end_lng },
              { lat: nextSegment.start_lat, lng: nextSegment.start_lng },
            ],
            color: '#9CA3AF', // Gray for transitions
          });
        }
      }
    }
  });

  // Group markers by position
  const markerGroups = new Map<string, MarkerGroup>();
  
  markers.forEach(marker => {
    const key = `${marker.position.lat.toFixed(6)},${marker.position.lng.toFixed(6)}`;
    if (!markerGroups.has(key)) {
      markerGroups.set(key, {
        position: marker.position,
        chapters: [],
        count: 0,
        blendedColor: marker.color,
      });
    }
    const group = markerGroups.get(key)!;
    group.chapters.push({
      index: marker.segmentIndex,
      label: `${marker.segmentIndex + 1}`,
      color: marker.color,
      type: marker.type,
      name: segments[marker.segmentIndex].name,
    });
    group.count++;
  });

  // Calculate blended colors for groups
  markerGroups.forEach(group => {
    const colors = group.chapters.map(ch => ch.color);
    group.blendedColor = blendColors(colors);
  });

  const groupsArray = Array.from(markerGroups.values());

  if (groupsArray.length === 0) {
    return (
      <div className="w-full h-full min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
        <div className="text-center text-gray-400">
          <MapPin size={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">Add locations to see your journey on the map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-gray-200">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={4}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        }}
      >
        {/* Draw polylines */}
        {polylines.map((polyline, index) => (
          <Polyline
            key={`polyline-${index}`}
            path={polyline.path}
            options={{
              strokeColor: polyline.color,
              strokeOpacity: 0.8,
              strokeWeight: 3,
              geodesic: true,
            }}
          />
        ))}

        {/* Draw grouped markers */}
        {groupsArray.map((group, index) => {
          const isSingleChapter = group.count === 1;
          const firstChapter = group.chapters[0];
          
          return (
            <React.Fragment key={`marker-group-${index}`}>
              <Marker
                position={group.position}
                label={isSingleChapter ? {
                  text: firstChapter.label,
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                } : undefined}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: group.blendedColor,
                  fillOpacity: 1,
                  strokeColor: 'white',
                  strokeWeight: 3,
                  scale: 20,
                }}
                onClick={() => {
                  setSelectedGroup(group);
                  if (isSingleChapter) {
                    onMarkerClick?.(firstChapter.index);
                  }
                }}
                options={{
                  zIndex: focusedIndex !== undefined && group.chapters.some(ch => ch.index === focusedIndex) ? 1000 : 100,
                }}
              />
              
              {/* Badge for overlapping markers */}
              {!isSingleChapter && (
                <OverlayView
                  position={group.position}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div 
                    className="relative"
                    style={{
                      transform: 'translate(12px, -12px)',
                    }}
                  >
                    <div className="bg-white border-2 border-gray-300 rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                      <span className="text-xs font-bold text-gray-700">{group.count}</span>
                    </div>
                  </div>
                </OverlayView>
              )}
            </React.Fragment>
          );
        })}

        {/* Info window for overlapping markers */}
        {selectedGroup && selectedGroup.count > 1 && (
          <InfoWindow
            position={selectedGroup.position}
            onCloseClick={() => setSelectedGroup(null)}
          >
            <div className="p-2">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                {selectedGroup.count} chapters at this location
              </div>
              <div className="space-y-1">
                {selectedGroup.chapters.map((chapter) => (
                  <div 
                    key={chapter.index}
                    className="text-xs text-gray-600 hover:text-indigo-600 cursor-pointer"
                    onClick={() => {
                      onMarkerClick?.(chapter.index);
                      setSelectedGroup(null);
                    }}
                  >
                    <span className="font-medium">Chapter {chapter.label}</span>
                    {' - '}
                    <span>{chapter.name}</span>
                    {' '}
                    <span className="text-gray-400">
                      ({chapter.type === 'both' ? 'Start & End' : chapter.type === 'start' ? 'Start' : 'End'})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

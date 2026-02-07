"use server";

import { prisma } from "@/lib/prisma";
import { pgDateToString } from "@/lib/utils/local-time";

export type TransportMode = "DRIVE" | "WALK" | "TRANSIT" | "BICYCLE";

interface RouteWaypoint {
  location: {
    lat: number;
    lng: number;
  };
  name: string;
  reservationId?: number;
}

interface RouteSegment {
  from: RouteWaypoint;
  to: RouteWaypoint;
  distance: {
    meters: number;
    text: string;
  };
  duration: {
    seconds: number;
    text: string;
  };
  steps?: Array<{
    instruction: string;
    distance: { meters: number; text: string };
    duration: { seconds: number; text: string };
  }>;
}

export interface OptimizedRoute {
  waypoints: RouteWaypoint[];
  segments: RouteSegment[];
  totalDistance: {
    meters: number;
    text: string;
  };
  totalDuration: {
    seconds: number;
    text: string;
  };
  optimized: boolean;
  originalOrder?: number[];
  suggestedOrder?: number[];
}

export interface DisplayRoute {
  path: Array<{ lat: number; lng: number }>;
  distance: {
    meters: number;
    text: string;
  };
  duration: {
    seconds: number;
    text: string;
  };
  encodedPolyline?: string;
}

/**
 * Get API key for Routes API
 */
function getApiKey(): string | undefined {
  return process.env.GOOGLE_ROUTES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
}

/**
 * Calculate route between multiple waypoints using Routes API
 * Uses the new Routes API (Compute Routes) for better performance
 */
export async function calculateRoute(
  waypoints: RouteWaypoint[],
  transportMode: TransportMode = "DRIVE",
  optimize: boolean = false
): Promise<OptimizedRoute | null> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.error("Google Routes API key not configured");
    return null;
  }

  if (waypoints.length < 2) {
    console.error("Need at least 2 waypoints to calculate route");
    return null;
  }

  try {
    // Use Routes API v2 (Compute Routes)
    const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
    
    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude: waypoints[0].location.lat,
            longitude: waypoints[0].location.lng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: waypoints[waypoints.length - 1].location.lat,
            longitude: waypoints[waypoints.length - 1].location.lng,
          },
        },
      },
      intermediates: waypoints.slice(1, -1).map(wp => ({
        location: {
          latLng: {
            latitude: wp.location.lat,
            longitude: wp.location.lng,
          },
        },
      })),
      travelMode: transportMode,
      routingPreference: "TRAFFIC_AWARE",
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: false,
      },
      languageCode: "en-US",
      units: "IMPERIAL",
    };

    // Add optimization if requested
    if (optimize && waypoints.length > 2) {
      (requestBody.routeModifiers as any).optimizeWaypointOrder = true;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.legs,routes.optimizedIntermediateWaypointIndex",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Routes API error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      console.error("No routes found");
      return null;
    }

    const route = data.routes[0];
    const legs = route.legs || [];

    // Build segments from legs
    const segments: RouteSegment[] = legs.map((leg: any, index: number) => ({
      from: waypoints[index],
      to: waypoints[index + 1],
      distance: {
        meters: leg.distanceMeters || 0,
        text: formatDistance(leg.distanceMeters || 0),
      },
      duration: {
        seconds: parseInt(leg.duration?.replace("s", "") || "0"),
        text: formatDuration(parseInt(leg.duration?.replace("s", "") || "0")),
      },
      steps: leg.steps?.map((step: any) => ({
        instruction: step.navigationInstruction?.instructions || "",
        distance: {
          meters: step.distanceMeters || 0,
          text: formatDistance(step.distanceMeters || 0),
        },
        duration: {
          seconds: parseInt(step.duration?.replace("s", "") || "0"),
          text: formatDuration(parseInt(step.duration?.replace("s", "") || "0")),
        },
      })),
    }));

    // Calculate totals
    const totalDistance = segments.reduce((sum, seg) => sum + seg.distance.meters, 0);
    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration.seconds, 0);

    // Handle optimized order if present
    const optimizedIndices = route.optimizedIntermediateWaypointIndex;
    let suggestedOrder: number[] | undefined;
    
    if (optimize && optimizedIndices && optimizedIndices.length > 0) {
      // Build the suggested order: [0, ...optimized intermediates, last]
      suggestedOrder = [0, ...optimizedIndices.map((i: number) => i + 1), waypoints.length - 1];
    }

    return {
      waypoints: suggestedOrder 
        ? suggestedOrder.map(i => waypoints[i])
        : waypoints,
      segments,
      totalDistance: {
        meters: totalDistance,
        text: formatDistance(totalDistance),
      },
      totalDuration: {
        seconds: totalDuration,
        text: formatDuration(totalDuration),
      },
      optimized: !!suggestedOrder,
      originalOrder: suggestedOrder ? waypoints.map((_, i) => i) : undefined,
      suggestedOrder,
    };
  } catch (error) {
    console.error("Error calculating route:", error);
    return null;
  }
}

/**
 * Get optimized route for a day's reservations
 */
export async function optimizeDayRoute(
  tripId: string,
  day: number,
  transportMode: TransportMode = "WALK"
): Promise<OptimizedRoute | null> {
  try {
    // Get trip with segments and reservations
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        segments: {
          include: {
            reservations: {
              where: {
                startTime: { not: null },
              },
              orderBy: { startTime: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!trip) {
      console.error("Trip not found");
      return null;
    }

    // Calculate the target date string for this day (YYYY-MM-DD format)
    const tripStartDate = new Date(trip.startDate);
    const targetDate = new Date(tripStartDate);
    targetDate.setDate(targetDate.getDate() + day - 1);
    
    // Format target date as YYYY-MM-DD for wall date comparison
    const targetDateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

    // Get all reservations for this day that have location data (using wall dates)
    const dayReservations = trip.segments
      .flatMap((seg) => seg.reservations)
      .filter((res) => {
        if (!res.latitude || !res.longitude) return false;
        
        // Prefer wall_start_date for date comparison
        if (res.wall_start_date) {
          const wallDateStr = pgDateToString(res.wall_start_date);
          return wallDateStr === targetDateStr;
        }
        // Fallback to startTime for backwards compatibility
        if (!res.startTime) return false;
        const resDate = new Date(res.startTime);
        return (
          resDate.getUTCFullYear() === targetDate.getFullYear() &&
          resDate.getUTCMonth() === targetDate.getMonth() &&
          resDate.getUTCDate() === targetDate.getDate()
        );
      })
      .sort((a, b) => {
        // Use UTC startTime for sorting (correct use of UTC fields)
        return (a.startTime?.getTime() ?? 0) - (b.startTime?.getTime() ?? 0);
      });

    if (dayReservations.length < 2) {
      console.log("Need at least 2 reservations with locations to optimize");
      return null;
    }

    // Convert reservations to waypoints
    const waypoints = dayReservations.map((res) => ({
      location: {
        lat: res.latitude!,
        lng: res.longitude!,
      },
      name: res.vendor,
      reservationId: res.id,
    })) as RouteWaypoint[];

    // Calculate optimized route
    return await calculateRoute(waypoints, transportMode, true);
  } catch (error) {
    console.error("Error optimizing day route:", error);
    return null;
  }
}

/**
 * Calculate travel time between two reservations
 */
export async function getTravelTime(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  transportMode: TransportMode = "WALK"
): Promise<{ duration: number; distance: number; durationText: string; distanceText: string } | null> {
  const waypoints: RouteWaypoint[] = [
    {
      location: { lat: fromLat, lng: fromLng },
      name: "Start",
    },
    {
      location: { lat: toLat, lng: toLng },
      name: "End",
    },
  ];

  const route = await calculateRoute(waypoints, transportMode, false);
  
  if (!route || route.segments.length === 0) {
    return null;
  }

  return {
    duration: route.totalDuration.seconds,
    distance: route.totalDistance.meters,
    durationText: route.totalDuration.text,
    distanceText: route.totalDistance.text,
  };
}

/**
 * Get a display route between two points with the full polyline path
 * This is optimized for map display, returning the actual road path
 */
export async function getDisplayRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  transportMode: TransportMode = "DRIVE"
): Promise<DisplayRoute | null> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.error("Google Routes API key not configured");
    return null;
  }

  try {
    const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
    
    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude: originLat,
            longitude: originLng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destLat,
            longitude: destLng,
          },
        },
      },
      travelMode: transportMode,
      routingPreference: transportMode === "DRIVE" ? "TRAFFIC_AWARE" : undefined,
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: false,
      },
      languageCode: "en-US",
      units: "IMPERIAL",
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Routes API error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      console.error("No routes found");
      return null;
    }

    const route = data.routes[0];
    const encodedPolyline = route.polyline?.encodedPolyline;
    
    // Decode the polyline to get lat/lng path
    const path = encodedPolyline ? decodePolyline(encodedPolyline) : [];
    
    // Parse duration (comes as "1234s" string)
    const durationSeconds = parseInt(route.duration?.replace("s", "") || "0");
    
    return {
      path,
      distance: {
        meters: route.distanceMeters || 0,
        text: formatDistance(route.distanceMeters || 0),
      },
      duration: {
        seconds: durationSeconds,
        text: formatDuration(durationSeconds),
      },
      encodedPolyline,
    };
  } catch (error) {
    console.error("Error getting display route:", error);
    return null;
  }
}

/**
 * Decode a Google encoded polyline string into an array of lat/lng coordinates
 * Based on the Google Polyline Algorithm
 * @see https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    // Decode latitude
    let shift = 0;
    let result = 0;
    let byte: number;
    
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    // Decode longitude
    shift = 0;
    result = 0;
    
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

/**
 * Format distance in meters to human-readable text
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const miles = meters * 0.000621371;
  return `${miles.toFixed(1)} mi`;
}

/**
 * Format duration in seconds to human-readable text
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

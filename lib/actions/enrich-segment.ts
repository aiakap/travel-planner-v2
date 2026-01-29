"use server";

import { prisma } from "@/lib/prisma";
import { getSegmentTimeZones } from "./timezone";

interface EnrichmentOptions {
  geocode?: boolean;
  timezone?: boolean;
  image?: boolean;
  airportCode?: string; // Optional: use airport code instead of city name for start location
}

/**
 * Enrich a segment with coordinates, timezones, and images
 * Runs asynchronously after segment creation for better UX
 * 
 * This is a "write fast, enrich later" pattern:
 * - Segments are created immediately without coordinates
 * - This function fills in missing data in the background
 * - Failures don't break the original operation
 */
export async function enrichSegment(
  segmentId: string,
  options: EnrichmentOptions = { geocode: true, timezone: true, image: false }
) {
  try {
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
    });

    if (!segment) {
      console.error(`[Enrichment] Segment ${segmentId} not found`);
      return null;
    }

    const updates: any = {};

    // Phase 1: Geocoding
    if (options.geocode && (!segment.startLat || !segment.endLat)) {
      console.log(`[Enrichment] Geocoding segment ${segmentId}:`, {
        start: options.airportCode || segment.startTitle,
        end: segment.endTitle,
      });

      const startGeo = await geocodeLocation(
        options.airportCode || segment.startTitle
      );
      const endGeo = await geocodeLocation(segment.endTitle);

      if (startGeo) {
        updates.startLat = startGeo.lat;
        updates.startLng = startGeo.lng;
        updates.startTitle = startGeo.formatted; // Use formatted address
      } else {
        console.warn(`[Enrichment] Failed to geocode start location: ${segment.startTitle}`);
      }

      if (endGeo) {
        updates.endLat = endGeo.lat;
        updates.endLng = endGeo.lng;
        updates.endTitle = endGeo.formatted;
      } else {
        console.warn(`[Enrichment] Failed to geocode end location: ${segment.endTitle}`);
      }
    }

    // Phase 2: Timezones (requires coordinates)
    if (
      options.timezone &&
      updates.startLat &&
      updates.endLat &&
      segment.startTime &&
      segment.endTime
    ) {
      console.log(`[Enrichment] Fetching timezones for segment ${segmentId}`);

      const timezones = await getSegmentTimeZones(
        updates.startLat,
        updates.startLng,
        updates.endLat,
        updates.endLng,
        segment.startTime,
        segment.endTime
      );

      if (timezones.start && timezones.end) {
        updates.startTimeZoneId = timezones.start.timeZoneId;
        updates.startTimeZoneName = timezones.start.timeZoneName;
        updates.endTimeZoneId = timezones.end.timeZoneId;
        updates.endTimeZoneName = timezones.end.timeZoneName;
      } else {
        console.warn(`[Enrichment] Failed to fetch timezones for segment ${segmentId}`);
      }
    }

    // Phase 3: Images (future enhancement)
    // if (options.image && !segment.imageUrl) {
    //   updates.imageUrl = await fetchSegmentImage(segment);
    // }

    // Update segment with enriched data
    if (Object.keys(updates).length > 0) {
      await prisma.segment.update({
        where: { id: segmentId },
        data: updates,
      });

      console.log(`[Enrichment] Segment ${segmentId} enriched successfully:`, {
        fields: Object.keys(updates),
      });

      return updates;
    } else {
      console.log(`[Enrichment] No updates needed for segment ${segmentId}`);
      return null;
    }
  } catch (error) {
    console.error(`[Enrichment] Error enriching segment ${segmentId}:`, error);
    // Don't throw - enrichment failures shouldn't break the caller
    return null;
  }
}

/**
 * Geocode a location using Google Maps Geocoding API
 * Returns coordinates and formatted address
 */
async function geocodeLocation(location: string): Promise<{
  lat: number;
  lng: number;
  formatted: string;
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("[Enrichment] Google Maps API key not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        location
      )}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === "OK" && data.results[0]) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted: result.formatted_address,
      };
    } else {
      console.warn(`[Enrichment] Geocoding failed for "${location}":`, data.status);
      return null;
    }
  } catch (error) {
    console.error(`[Enrichment] Geocoding error for "${location}":`, error);
    return null;
  }
}

/**
 * Batch enrich multiple segments
 * Useful for enriching all segments in a trip at once
 */
export async function enrichSegments(
  segmentIds: string[],
  options: EnrichmentOptions = { geocode: true, timezone: true, image: false }
) {
  console.log(`[Enrichment] Batch enriching ${segmentIds.length} segments`);

  const results = await Promise.allSettled(
    segmentIds.map((id) => enrichSegment(id, options))
  );

  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`[Enrichment] Batch complete: ${successful} succeeded, ${failed} failed`);

  return results;
}

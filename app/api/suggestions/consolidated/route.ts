/**
 * Consolidated Suggestions API Endpoint
 * Fetches place suggestions from multiple APIs, consolidates them,
 * and returns enriched, deduplicated results
 */

import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

import type {
  PlaceConcept,
  PlaceCategory,
  ConsolidatedPlace,
  ConsolidatedSuggestionsRequest,
  ConsolidatedSuggestionsResponse,
} from "@/lib/types/consolidated-place";

import { apiResolutionService } from "@/lib/services/api-resolution-service";
import { consolidationService } from "@/lib/ai/consolidate-places";
import { getCacheManager, consolidatedSuggestionsKey } from "@/lib/cache";
import { getAPIStatus } from "@/lib/api-clients";

// ============================================================================
// Debug Logging System
// ============================================================================

const DEBUG_ENABLED = process.env.NODE_ENV === "development" || process.env.CONSOLIDATED_API_DEBUG === "true";
const LOG_FILE_PATH = path.join(process.cwd(), ".cursor", "consolidated-api-test.log");

interface DebugLog {
  timestamp: string;
  requestId: string;
  stage: string;
  message: string;
  data?: any;
  durationMs?: number;
}

const debugLogs: DebugLog[] = [];
let currentRequestId = "";

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function debug(stage: string, message: string, data?: any, durationMs?: number) {
  if (!DEBUG_ENABLED) return;
  
  const log: DebugLog = {
    timestamp: new Date().toISOString(),
    requestId: currentRequestId,
    stage,
    message,
    data: data ? (typeof data === "object" ? JSON.stringify(data, null, 2).substring(0, 2000) : data) : undefined,
    durationMs,
  };
  
  debugLogs.push(log);
  
  // Console output with formatting
  const prefix = `[${log.timestamp}] [${stage}]`;
  const duration = durationMs !== undefined ? ` (${durationMs}ms)` : "";
  console.log(`${prefix} ${message}${duration}`);
  if (data) {
    console.log(`  Data: ${typeof data === "object" ? JSON.stringify(data, null, 2).substring(0, 500) : data}`);
  }
}

function writeLogsToFile(requestSummary: string) {
  if (!DEBUG_ENABLED) return;
  
  try {
    // Ensure .cursor directory exists
    const dir = path.dirname(LOG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const logEntry = `
${"=".repeat(80)}
${requestSummary}
${"=".repeat(80)}
${debugLogs.filter(l => l.requestId === currentRequestId).map(l => 
  `[${l.timestamp}] [${l.stage}] ${l.message}${l.durationMs !== undefined ? ` (${l.durationMs}ms)` : ""}${l.data ? `\n  ${l.data.substring(0, 500)}` : ""}`
).join("\n")}

`;
    
    fs.appendFileSync(LOG_FILE_PATH, logEntry);
    console.log(`[DEBUG] Logs written to ${LOG_FILE_PATH}`);
  } catch (err) {
    console.error("[DEBUG] Failed to write logs to file:", err);
  }
}

// ============================================================================
// Request Schema
// ============================================================================

const RequestSchema = z.object({
  query: z.string().min(1).max(500),
  location: z
    .object({
      city: z.string().optional(),
      country: z.string().optional(),
      coordinates: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .optional(),
    })
    .optional(),
  categories: z
    .array(
      z.enum([
        "restaurant",
        "hotel",
        "attraction",
        "activity",
        "transport",
        "shopping",
        "nightlife",
        "cafe",
        "bar",
      ])
    )
    .optional(),
  limit: z.number().min(1).max(20).optional().default(10),
  tripContext: z
    .object({
      tripId: z.string().optional(),
      segmentId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    .optional(),
  options: z
    .object({
      includeWeather: z.boolean().optional().default(true),
      includePricing: z.boolean().optional().default(true),
      skipCache: z.boolean().optional().default(false),
      useAI: z.boolean().optional().default(true),
    })
    .optional(),
});

// ============================================================================
// AI Place Concept Generation Schema
// ============================================================================

const PlaceConceptSchema = z.object({
  name: z.string().describe("The name of the place"),
  category: z
    .enum([
      "restaurant",
      "hotel",
      "attraction",
      "activity",
      "transport",
      "shopping",
      "nightlife",
      "cafe",
      "bar",
    ])
    .describe("The category of the place"),
  searchHint: z
    .string()
    .describe("Additional context for searching (e.g., 'French bistro', 'luxury hotel'). Always provide a hint."),
});

const PlaceConceptsSchema = z.object({
  places: z
    .array(PlaceConceptSchema)
    .describe("List of place concepts to search for"),
});

// ============================================================================
// AI Place Concept Generation
// ============================================================================

async function generatePlaceConcepts(
  query: string,
  location?: ConsolidatedSuggestionsRequest["location"],
  categories?: PlaceCategory[],
  limit: number = 10
): Promise<PlaceConcept[]> {
  const locationContext = location?.city
    ? `${location.city}${location.country ? ", " + location.country : ""}`
    : "the specified location";

  const categoryFilter = categories?.length
    ? `Focus on these categories: ${categories.join(", ")}.`
    : "";

  debug("AI_GENERATION", `Starting concept generation for query: "${query}"`, {
    locationContext,
    categories,
    limit,
  });

  try {
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: PlaceConceptsSchema,
      prompt: `You are a travel recommendation expert. Based on the user's query, suggest ${limit} specific places.

User Query: "${query}"
Location: ${locationContext}
${categoryFilter}

Generate ${limit} specific, real place recommendations. Include:
- Restaurants, cafes, and bars (if relevant to the query)
- Hotels and accommodations (if the query mentions staying)
- Attractions and activities (sightseeing, tours, experiences)
- Shopping locations (if mentioned)

For each place, provide:
1. The exact name of a real place
2. The appropriate category
3. A search hint to help find the place (type of cuisine, style, etc.)

Be specific with real place names, not generic descriptions.`,
    });

    const concepts = result.object.places.map((p) => ({
      name: p.name,
      category: p.category,
      searchHint: p.searchHint,
      location,
    }));

    debug("AI_GENERATION", `Generated ${concepts.length} place concepts`, {
      places: concepts.map((c) => `${c.name} (${c.category})`),
    });

    return concepts;
  } catch (error) {
    debug("AI_GENERATION", `ERROR: ${error instanceof Error ? error.message : "Unknown error"}`, {
      error: error instanceof Error ? error.stack : error,
    });
    console.error("[ConsolidatedSuggestions] AI generation error:", error);
    // Return empty array on error
    return [];
  }
}

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  currentRequestId = generateRequestId();

  debug("REQUEST", "=== Consolidated API Request Started ===");

  try {
    // Parse and validate request
    const body = await request.json();
    const validationResult = RequestSchema.safeParse(body);

    if (!validationResult.success) {
      debug("VALIDATION", "Request validation failed", {
        errors: validationResult.error.errors,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const req = validationResult.data;
    const cacheManager = getCacheManager();
    const apiStatus = getAPIStatus();

    debug("REQUEST", "Request validated successfully", {
      query: req.query,
      location: req.location ? `${req.location.city || "unknown"}, ${req.location.country || "unknown"}` : "none",
      categories: req.categories || "all",
      limit: req.limit,
      options: req.options,
    });

    debug("API_STATUS", "Current API configuration", {
      google: apiStatus.google ? "configured" : "not configured",
      yelp: apiStatus.yelp ? "configured" : "not configured",
      amadeus: apiStatus.amadeus ? "configured" : "not configured",
      weather: apiStatus.weather ? "configured" : "not configured",
    });

    // Check cache first (unless skipCache is true)
    const cacheKey = consolidatedSuggestionsKey(
      req.query,
      req.location?.city
    );

    if (!req.options?.skipCache) {
      const cacheCheckStart = Date.now();
      const cached = await cacheManager.get<ConsolidatedSuggestionsResponse>(
        cacheKey
      );
      const cacheCheckTime = Date.now() - cacheCheckStart;
      
      if (cached) {
        debug("CACHE", "Cache HIT - returning cached response", {
          cacheKey,
          resultsCount: cached.data.suggestions?.length || 0,
        }, cacheCheckTime);
        
        const response = {
          ...cached.data,
          meta: {
            ...cached.data.meta,
            cacheHit: true,
          },
        };
        
        writeLogsToFile(`CACHE HIT: "${req.query}" in ${req.location?.city || "unknown"}`);
        return NextResponse.json(response);
      }
      
      debug("CACHE", "Cache MISS - proceeding with API calls", { cacheKey }, cacheCheckTime);
    } else {
      debug("CACHE", "Cache skipped by request option");
    }

    // Stage 1: Generate place concepts
    debug("STAGE_1", "Starting AI concept generation...");
    const aiStartTime = Date.now();
    const concepts = await generatePlaceConcepts(
      req.query,
      req.location,
      req.categories,
      req.limit
    );
    const aiTime = Date.now() - aiStartTime;
    debug("STAGE_1", `AI generation complete: ${concepts.length} concepts`, {
      conceptNames: concepts.map(c => c.name),
    }, aiTime);

    if (concepts.length === 0) {
      debug("RESULT", "No concepts generated - returning empty response", null, Date.now() - startTime);
      writeLogsToFile(`EMPTY: "${req.query}" - no concepts generated`);
      return NextResponse.json({
        success: true,
        suggestions: [],
        meta: {
          query: req.query,
          totalResults: 0,
          sourcesQueried: [],
          timing: {
            total: Date.now() - startTime,
            aiGeneration: aiTime,
          },
          cacheHit: false,
        },
      });
    }

    // Stage 2: Resolve across APIs
    debug("STAGE_2", "Starting API resolution...", {
      conceptCount: concepts.length,
      includeGoogle: true,
      includeYelp: true,
      includeAmadeus: req.options?.includePricing !== false,
      includeWeather: req.options?.includeWeather !== false,
    });
    
    const apiStartTime = Date.now();
    const resolutionResult = await apiResolutionService.resolveAll(concepts, {
      includeGoogle: true,
      includeYelp: true,
      includeAmadeus: req.options?.includePricing !== false,
      includeWeather: req.options?.includeWeather !== false,
      weatherCoordinates: req.location?.coordinates,
      weatherDates: req.tripContext?.startDate && req.tripContext?.endDate
        ? { start: req.tripContext.startDate, end: req.tripContext.endDate }
        : undefined,
      tripContext: req.tripContext?.startDate && req.tripContext?.endDate
        ? {
            checkInDate: req.tripContext.startDate,
            checkOutDate: req.tripContext.endDate,
            adults: 2,
          }
        : undefined,
    });
    const apiTime = Date.now() - apiStartTime;
    
    debug("STAGE_2", "API resolution complete", {
      googleResults: resolutionResult.results.google?.size || 0,
      yelpResults: resolutionResult.results.yelp?.size || 0,
      amadeusResults: resolutionResult.results.amadeus?.size || 0,
      weatherResult: resolutionResult.results.weather ? "available" : "none",
      errors: resolutionResult.results.errors?.length || 0,
      timing: resolutionResult.timing,
    }, apiTime);

    // Stage 3: Consolidate results
    debug("STAGE_3", "Starting consolidation...");
    const consolidationStartTime = Date.now();
    const consolidationResult = await consolidationService.consolidate(
      concepts,
      resolutionResult.results,
      {
        useAI: req.options?.useAI !== false,
        includeDescriptions: true,
        maxDescriptionLength: 200,
      }
    );
    const consolidationTime = Date.now() - consolidationStartTime;
    
    debug("STAGE_3", "Consolidation complete", {
      inputConcepts: concepts.length,
      outputPlaces: consolidationResult.places.length,
      placeNames: consolidationResult.places.map(p => p.canonicalName),
    }, consolidationTime);

    // Build response
    const sourcesQueried: string[] = [];
    if (apiStatus.google) sourcesQueried.push("google");
    if (apiStatus.yelp) sourcesQueried.push("yelp");
    if (apiStatus.amadeus && req.options?.includePricing !== false)
      sourcesQueried.push("amadeus");
    if (apiStatus.weather && req.options?.includeWeather !== false)
      sourcesQueried.push("weather");

    const totalTime = Date.now() - startTime;
    const response: ConsolidatedSuggestionsResponse = {
      success: true,
      suggestions: consolidationResult.places,
      meta: {
        query: req.query,
        totalResults: consolidationResult.places.length,
        sourcesQueried,
        timing: {
          total: totalTime,
          aiGeneration: aiTime,
          apiResolution: apiTime,
          consolidation: consolidationTime,
        },
        cacheHit: false,
      },
    };

    debug("RESULT", "=== Request Complete ===", {
      success: true,
      totalResults: consolidationResult.places.length,
      totalTime,
      breakdown: {
        aiGeneration: aiTime,
        apiResolution: apiTime,
        consolidation: consolidationTime,
      },
    }, totalTime);

    // Cache the result
    if (!req.options?.skipCache) {
      await cacheManager.set(cacheKey, response);
      debug("CACHE", "Response cached", { cacheKey });
    }

    writeLogsToFile(`SUCCESS: "${req.query}" in ${req.location?.city || "unknown"} - ${consolidationResult.places.length} results in ${totalTime}ms`);
    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const totalTime = Date.now() - startTime;
    
    debug("ERROR", `Request failed: ${errorMessage}`, {
      error: error instanceof Error ? error.stack : error,
    }, totalTime);
    
    writeLogsToFile(`ERROR: ${errorMessage}`);
    console.error("[ConsolidatedSuggestions] Error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET Handler for simple queries
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const city = searchParams.get("city");
  const country = searchParams.get("country");
  const limit = searchParams.get("limit");
  const categories = searchParams.get("categories");

  if (!query) {
    return NextResponse.json(
      { success: false, error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  // Convert to POST body format
  const body: ConsolidatedSuggestionsRequest = {
    query,
    location: city ? { city, country: country || undefined } : undefined,
    categories: categories
      ? (categories.split(",") as PlaceCategory[])
      : undefined,
    limit: limit ? parseInt(limit) : 10,
  };

  // Create a mock request and call POST handler
  const mockRequest = new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return POST(mockRequest as NextRequest);
}

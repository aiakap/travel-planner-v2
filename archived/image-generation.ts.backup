import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import type { UploadedFileData } from "uploadthing/types";

// Image provider configuration
type ImageProvider = 'dalle' | 'imagen';
const IMAGE_PROVIDER: ImageProvider = (process.env.IMAGE_PROVIDER as ImageProvider) || 'imagen';

// Type definitions
interface ImagePrompt {
  id: string;
  name: string;
  prompt: string;
  category: string;
  style: string | null;
  lightness: string | null;
}

interface GeneratedImageResult {
  imageUrl: string;
  promptId: string;
  promptName: string;
}

// Main entry point for generating images (now returns queue ID instead of immediate result)
export async function generateAndUploadImage(
  entity: any,
  entityType: "trip" | "segment" | "reservation",
  specificPromptId?: string
): Promise<GeneratedImageResult> {
  console.warn("generateAndUploadImage is deprecated. Use queueImageGeneration instead.");
  return await generateAndUploadImageImmediate(entity, entityType, specificPromptId);
}

// Immediate generation (for manual triggers, not for auto-generation)
export async function generateAndUploadImageImmediate(
  entity: any,
  entityType: "trip" | "segment" | "reservation",
  specificPromptId?: string
): Promise<GeneratedImageResult> {
  // 1. Select prompt theme - either specific one or AI picks best
  const selectionResult = await selectBestPromptForContent(entity, entityType);
  const selectedPrompt = selectionResult.prompt;

  // 2. Build complete prompt with all entity data
  const fullPrompt = buildContextualPrompt(selectedPrompt, entity, entityType);

  // 3. Generate image based on configured provider
  let imageSource: string;
  if (IMAGE_PROVIDER === 'imagen') {
    imageSource = await generateImageWithImagen(fullPrompt);
  } else {
    imageSource = await generateImageWithDALLE(fullPrompt);
  }

  // 4. Upload to UploadThing for permanent storage
  const permanentUrl = await uploadImageToStorage(
    imageSource,
    `${entityType}-${entity.id || Date.now()}`
  );

  return {
    imageUrl: permanentUrl,
    promptId: selectedPrompt.id,
    promptName: selectedPrompt.name,
  };
}

// Helper functions to select prompts for specific entity types
export async function selectBestPromptForTrip(trip: any, specificPromptId?: string): Promise<PromptSelectionResult> {
  if (specificPromptId) {
    const prompt = await prisma.imagePrompt.findUnique({
      where: { id: specificPromptId, category: "trip" },
    });
    if (!prompt) throw new Error("Prompt not found");
    const availablePrompts = await prisma.imagePrompt.findMany({
      where: { category: "trip" },
    });
    return {
      prompt,
      reasoning: "Manually selected by user",
      availablePrompts,
    };
  }
  return await selectBestPromptForContent(trip, "trip");
}

export async function selectBestPromptForSegment(segment: any): Promise<PromptSelectionResult> {
  return await selectBestPromptForContent(segment, "segment");
}

export async function selectBestPromptForReservation(reservation: any): Promise<PromptSelectionResult> {
  return await selectBestPromptForContent(reservation, "reservation");
}

// Extended type for prompt selection with reasoning
interface PromptSelectionResult {
  prompt: ImagePrompt;
  reasoning?: string;
  availablePrompts: ImagePrompt[];
}

// AI analyzes trip/segment/reservation data to pick best theme
async function selectBestPromptForContent(
  entity: any,
  entityType: "trip" | "segment" | "reservation"
): Promise<PromptSelectionResult> {
  // Fetch all prompts for this category from database
  const availablePrompts = await prisma.imagePrompt.findMany({
    where: { category: entityType },
  });

  if (availablePrompts.length === 0) {
    throw new Error(`No prompts available for category: ${entityType}`);
  }

  // Build analysis context with ALL entity data
  const analysisContext = buildAnalysisContext(entity, entityType);

  // Use OpenAI to select best matching prompt
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a travel imagery expert. Analyze the travel details and select the most appropriate visual style.

Consider:
- Destination type (urban/nature/beach/mountains)
- Travel dates and season
- Activity type and character
- Number of destinations (multi-city trips work well with scrapbook collage)
- Trip sentiment (personal/family trips suit nostalgic scrapbook style)

Available styles:
- Retro Gouache: Classic mid-century poster aesthetic
- Golden Hour: Dramatic lighting and silhouettes
- Map Journey: Artistic cartography
- Travel Scrapbook: Nostalgic collage with layered memories (great for multi-destination or personal trips)

Return JSON: {"promptName": "exact name from list", "reasoning": "1-2 sentence explanation why this style fits best"}`,
        },
        {
          role: "user",
          content: `Travel Details:\n${analysisContext}\n\nAvailable Styles:\n${availablePrompts.map((p) => p.name).join("\n")}\n\nSelect the single best matching style:`,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0].message.content?.trim();
    if (responseText) {
      try {
        const response = JSON.parse(responseText);
        const selectedName = response.promptName;
        const reasoning = response.reasoning;
        const selectedPrompt = availablePrompts.find((p) => p.name === selectedName);

        if (selectedPrompt) {
          return {
            prompt: selectedPrompt,
            reasoning,
            availablePrompts,
          };
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
      }
    }

    // Fallback to first available prompt
    return {
      prompt: availablePrompts[0],
      reasoning: "Fallback selection (AI response parse failed)",
      availablePrompts,
    };
  } catch (error) {
    console.error("Error selecting prompt with AI:", error);
    // Fallback to first available prompt
    return {
      prompt: availablePrompts[0],
      reasoning: "Fallback selection (AI call failed)",
      availablePrompts,
    };
  }
}

// Build analysis context for AI prompt selection
function buildAnalysisContext(
  entity: any,
  entityType: "trip" | "segment" | "reservation"
): string {
  if (entityType === "trip") {
    const segments = entity.segments || [];
    const firstSegment = segments[0];
    return `Type: Trip
Title: ${entity.title}
Description: ${entity.description}
Dates: ${formatDate(entity.startDate)} to ${formatDate(entity.endDate)}
Season: ${getSeason(entity.startDate)}
Duration: ${getDurationInDays(entity.startDate, entity.endDate)} days
${firstSegment ? `Primary Location: ${firstSegment.startTitle}` : ""}
${firstSegment ? `Coordinates: ${firstSegment.startLat}, ${firstSegment.startLng}` : ""}`;
  } else if (entityType === "segment") {
    return `Type: Segment/Journey
Name: ${entity.name}
Transportation: ${entity.segmentType?.name || "Unknown"}
From: ${entity.startTitle}
To: ${entity.endTitle}
${entity.startTime ? `Departure: ${formatDateTime(entity.startTime)}` : ""}
${entity.endTime ? `Arrival: ${formatDateTime(entity.endTime)}` : ""}
Notes: ${entity.notes || "No notes"}`;
  } else {
    return `Type: Reservation
Name: ${entity.name}
Category: ${entity.reservationType?.category?.name || "Unknown"}
Type: ${entity.reservationType?.name || "Unknown"}
Location: ${entity.location || "Unknown"}
${entity.startTime ? `Time: ${formatDateTime(entity.startTime)}` : ""}
Notes: ${entity.notes || "No notes"}`;
  }
}

// Scrapbook-specific helper functions
function extractDestinations(segments: any[]): string {
  if (!segments || segments.length === 0) return "various destinations";
  const allLocations = segments.map((s: any) => s.startTitle).filter(Boolean);
  const uniqueLocations = [...new Set(allLocations)];
  return uniqueLocations.slice(0, 3).join(", ") + (uniqueLocations.length > 3 ? ` and ${uniqueLocations.length - 3} more` : "");
}

function extractTripCharacter(segments: any[]): string {
  if (!segments || segments.length === 0) return "vacation";
  
  const types = segments.map((s: any) => s.segmentType?.name).filter(Boolean);
  
  if (types.includes("STAY") && types.includes("ROAD_TRIP")) return "road trip adventure";
  if (types.includes("RETREAT")) return "retreat experience";
  if (types.includes("TOUR")) return "guided tour";
  if (types.includes("ROAD_TRIP")) return "road trip";
  if (types.filter((t: string) => t === "STAY").length > 1) return "multi-city tour";
  
  // Infer from location names
  const locations = segments.map((s: any) => s.startTitle?.toLowerCase() || "").filter(Boolean);
  const locationText = locations.join(" ");
  
  if (locationText.includes("beach") || locationText.includes("coast") || locationText.includes("island")) return "beach vacation";
  if (locationText.includes("mountain") || locationText.includes("alps") || locationText.includes("peak")) return "mountain adventure";
  if (locationText.includes("city") || locations.length > 2) return "city exploration";
  
  return "journey";
}

function formatDateRange(startDate: Date | null | undefined, endDate: Date | null | undefined): string {
  if (!startDate || !endDate) return "Dates TBD";
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const endDay = end.getDate();
  const year = start.getFullYear();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

function extractTransportationIcon(segmentType: string | null | undefined): string {
  if (!segmentType) return "journey icon";
  
  const type = segmentType.toLowerCase();
  if (type.includes("flight") || type.includes("air")) return "airplane silhouette";
  if (type.includes("train") || type.includes("rail")) return "train icon";
  if (type.includes("car") || type.includes("drive") || type.includes("road")) return "car icon";
  if (type.includes("boat") || type.includes("ferry") || type.includes("cruise")) return "ship icon";
  if (type.includes("bus")) return "bus icon";
  
  return "journey icon";
}

function formatSegmentRoute(entity: any): string {
  const from = entity.startTitle || "Origin";
  const to = entity.endTitle || "Destination";
  return `${from} → ${to}`;
}

function formatReservationTime(entity: any): string {
  if (!entity.startTime) return "Time TBD";
  
  const date = new Date(entity.startTime);
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  
  return `${time}, ${dateStr}`;
}

function extractReservationIcon(entity: any): string {
  const category = entity.reservationType?.category?.name?.toLowerCase() || "";
  const type = entity.reservationType?.name?.toLowerCase() || "";
  
  if (category.includes("lodging") || type.includes("hotel") || type.includes("stay")) {
    return "bed icon";
  }
  if (category.includes("dining") || type.includes("restaurant") || type.includes("food")) {
    return "fork and knife icon";
  }
  if (type.includes("museum")) return "museum column icon";
  if (type.includes("theater") || type.includes("show")) return "theater mask icon";
  if (type.includes("tour")) return "guide flag icon";
  if (type.includes("hike") || type.includes("outdoor")) return "hiking boot icon";
  if (type.includes("beach")) return "beach umbrella icon";
  if (type.includes("spa")) return "spa leaf icon";
  
  return "activity icon";
}

function buildScrapbookPromptForTrip(template: string, entity: any): string {
  const segments = entity.segments || [];
  const destinations = extractDestinations(segments);
  const tripCharacter = extractTripCharacter(segments);
  const dateRange = formatDateRange(entity.startDate, entity.endDate);
  const duration = getDurationInDays(entity.startDate, entity.endDate);
  
  return template
    .replace(/\[destinations\]/g, destinations)
    .replace(/Journey dates/g, dateRange)
    .replace(/Journey title/g, entity.title || "Untitled Journey")
    .replace(/Journey duration/g, `${duration} day${duration !== 1 ? "s" : ""}`)
    .replace(/\[journey character\]/g, tripCharacter)
    + `\n\nTRAVEL CONTEXT TO VISUALIZE:
Journey: ${entity.title}
Dates: ${dateRange}
Duration: ${duration} days
Destinations: ${destinations}
Character: ${tripCharacter}`;
}

function buildScrapbookPromptForSegment(template: string, entity: any): string {
  const transportIcon = extractTransportationIcon(entity.segmentType?.name);
  const route = formatSegmentRoute(entity);
  const departureTime = entity.startTime ? formatDateTime(entity.startTime) : "Departure TBD";
  const arrivalTime = entity.endTime ? formatDateTime(entity.endTime) : "Arrival TBD";
  const duration = entity.startTime && entity.endTime ? getDuration(entity.startTime, entity.endTime) : "Duration TBD";
  
  return template
    .replace(/Chapter name\/description/g, entity.name || "Chapter")
    .replace(/Departure city → Arrival city/g, route)
    .replace(/Departure and arrival times/g, `${departureTime} → ${arrivalTime}`)
    .replace(/Chapter duration/g, duration)
    .replace(/transportation mode \(.*?\)/g, transportIcon)
    + `\n\nTRAVEL CONTEXT TO VISUALIZE:
Chapter: ${entity.name}
Route: ${route}
Transportation: ${entity.segmentType?.name || "Travel"}
Departure: ${departureTime}
Arrival: ${arrivalTime}
Duration: ${duration}
Icon: ${transportIcon}`;
}

function buildScrapbookPromptForReservation(template: string, entity: any): string {
  const icon = extractReservationIcon(entity);
  const time = formatReservationTime(entity);
  const duration = entity.startTime && entity.endTime ? getDuration(entity.startTime, entity.endTime) : "";
  const venue = entity.location || "Venue TBD";
  
  return template
    .replace(/Moment name/g, entity.name || "Moment")
    .replace(/Venue or provider name/g, venue)
    .replace(/Date and time of moment/g, time)
    .replace(/Duration \(if applicable\)/g, duration || "Duration varies")
    .replace(/moment type:.*?\)/g, `moment type: ${icon}`)
    + `\n\nTRAVEL CONTEXT TO VISUALIZE:
Moment: ${entity.name}
Type: ${entity.reservationType?.name || "Activity"}
Venue: ${venue}
Time: ${time}
${duration ? `Duration: ${duration}` : ""}
Icon: ${icon}`;
}

// Combine template + actual entity data (exported for queue processor)
export function buildContextualPrompt(
  promptTemplate: ImagePrompt,
  entity: any,
  entityType: "trip" | "segment" | "reservation"
): string {
  const template = promptTemplate.prompt;
  const isScrapbook = promptTemplate.style === "scrapbook_collage";

  // Special handling for scrapbook prompts
  if (isScrapbook) {
    if (entityType === "trip") {
      return buildScrapbookPromptForTrip(template, entity);
    } else if (entityType === "segment") {
      return buildScrapbookPromptForSegment(template, entity);
    } else {
      return buildScrapbookPromptForReservation(template, entity);
    }
  }

  // Build the TRAVEL CONTEXT section with actual data (for non-scrapbook prompts)
  let travelContext = "";

  if (entityType === "trip") {
    const segments = entity.segments || [];
    const allLocations = segments.map((s: any) => s.startTitle).filter(Boolean);
    const uniqueLocations = [...new Set(allLocations)];
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    
    // Build chapter summary
    const chapterSummary = segments.map((s: any, i: number) => 
      `Chapter ${i + 1}: ${s.name} (${s.days} days in ${s.startTitle || 'TBD'})`
    ).join("; ");
    
    travelContext = `
TRIP OVERVIEW:
Title: ${entity.title}
Description: ${entity.description}
Travel Dates: ${formatDate(entity.startDate)} to ${formatDate(entity.endDate)}
Season: ${getSeason(entity.startDate)}
Duration: ${getDurationInDays(entity.startDate, entity.endDate)} days
Number of Chapters: ${segments.length}

JOURNEY STRUCTURE:
${chapterSummary}

LOCATIONS VISITED:
Primary Destinations: ${uniqueLocations.slice(0, 5).join(", ")}${uniqueLocations.length > 5 ? ` and ${uniqueLocations.length - 5} more` : ""}
Journey Type: ${firstSegment?.startTitle === lastSegment?.endTitle ? "Round-trip" : "One-way journey"}
Starting Point: ${firstSegment?.startTitle || "Unknown"}
Ending Point: ${lastSegment?.endTitle || "Unknown"}

GEOGRAPHIC CONTEXT:
Primary Region: ${firstSegment ? getRegionFromCoordinates(firstSegment.startLat, firstSegment.startLng) : "Unknown"}
Coordinates: ${firstSegment ? `${firstSegment.startLat}, ${firstSegment.startLng}` : "N/A"}
${segments.length > 1 ? `Multi-destination journey covering ${segments.length} locations` : "Single-destination trip"}

TRIP CHARACTER:
${segments.some((s: any) => s.segmentType?.name === "STAY") ? "Includes extended stays" : ""}
${segments.some((s: any) => s.segmentType?.name === "TRAVEL") ? "Includes travel segments" : ""}
${segments.some((s: any) => s.segmentType?.name === "TOUR") ? "Includes guided tours" : ""}
${segments.some((s: any) => s.segmentType?.name === "ROAD_TRIP") ? "Includes road trip adventures" : ""}
${segments.some((s: any) => s.segmentType?.name === "RETREAT") ? "Includes retreat experiences" : ""}
`;
  } else if (entityType === "segment") {
    travelContext = `
Journey Name: ${entity.name}
Notes: ${entity.notes || "No additional notes"}
Transportation Type: ${entity.segmentType?.name || "Travel"}
From: ${entity.startTitle} (coordinates: ${entity.startLat}, ${entity.startLng})
To: ${entity.endTitle} (coordinates: ${entity.endLat}, ${entity.endLng})
${entity.startTime ? `Departure: ${formatDateTime(entity.startTime)}` : ""}
${entity.endTime ? `Arrival: ${formatDateTime(entity.endTime)}` : ""}
${entity.startTime && entity.endTime ? `Journey Duration: ${getDuration(entity.startTime, entity.endTime)}` : ""}
${entity.startTime ? `Season: ${getSeason(entity.startTime)}` : ""}
${entity.startTime ? `Time of Day: ${getTimeOfDay(entity.startTime)}` : ""}
Distance: ${calculateDistance(entity.startLat, entity.startLng, entity.endLat, entity.endLng).toFixed(0)} km
Geographic Context: ${getGeographicContext(entity.startLat, entity.startLng, entity.endLat, entity.endLng)}`;
  } else {
    travelContext = `
Reservation: ${entity.name}
Type: ${entity.reservationType?.name || "Activity"} (${entity.reservationType?.category?.name || "General"})
Specific Location: ${entity.location || "Destination"}
Notes: ${entity.notes || "No additional notes"}
${entity.startTime ? `Scheduled Time: ${formatDateTime(entity.startTime)}${entity.endTime ? ` to ${formatDateTime(entity.endTime)}` : ""}` : ""}
${entity.startTime && entity.endTime ? `Duration: ${getDuration(entity.startTime, entity.endTime)}` : ""}
${entity.startTime ? `Time of Day: ${getTimeOfDay(entity.startTime)}` : ""}
${entity.startTime ? `Season: ${getSeason(entity.startTime)}` : ""}
${entity.segment ? `Geographic Area: ${entity.segment.startTitle}` : ""}
${entity.segment ? `Coordinates: ${entity.segment.startLat}, ${entity.segment.startLng}` : ""}
${entity.segment ? `Regional Context: ${getRegionFromCoordinates(entity.segment.startLat, entity.segment.startLng)}` : ""}`;
  }

  // Replace the placeholder in template with actual data
  return (
    template.replace("TRAVEL CONTEXT TO VISUALIZE:", `TRAVEL CONTEXT TO VISUALIZE:\n${travelContext}`) +
    travelContext
  );
}

// Generate image using Google Vertex AI Imagen (exported for queue processor)
export async function generateImageWithImagen(prompt: string): Promise<string> {
  const { getVertexAIClient } = await import("@/image-generator/lib/vertex-ai-client");
  
  // Add explicit NO TEXT instruction
  const finalPrompt = `${prompt}

CRITICAL: Do not include any text, words, letters, labels, signs, or typography in the image. No readable characters of any kind.`;

  const client = getVertexAIClient();
  const filename = `trip-${Date.now()}.png`;
  
  const result = await client.generateImage(
    {
      prompt: finalPrompt,
      aspectRatio: "9:16", // Vertical format for mobile
      addWatermark: false,
      safetySetting: "block_few"
    },
    filename
  );

  if (!result.success || !result.imagePath) {
    throw new Error(result.error?.message || "Image generation failed");
  }

  // Return the local file path for upload
  return result.imagePath;
}

// Generate image using OpenAI DALL-E 3 (exported for queue processor)
export async function generateImageWithDALLE(prompt: string): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  // Add explicit NO TEXT instruction to every prompt
  const finalPrompt = `${prompt}

CRITICAL: Do not include any text, words, letters, labels, signs, or typography in the image. No readable characters of any kind.`;

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: finalPrompt,
    n: 1,
    size: "1024x1792", // Vertical format (9:16 ratio) - good for mobile
    quality: "standard", // Standard quality: 2x faster, 50% cheaper than HD
    style: "natural", // Let our prompts control the style
  });

  const imageUrl = response.data?.[0]?.url;

  if (!imageUrl) {
    throw new Error("No image URL returned from DALL-E");
  }

  return imageUrl;
}

// Upload image to UploadThing for permanent storage (exported for queue processor)
// Handles both URLs (DALL-E) and local file paths (Imagen)
export async function uploadImageToStorage(
  imageSource: string,
  fileName: string
): Promise<string> {
  let buffer: Buffer;
  
  // Check if it's a local file path or URL
  if (imageSource.startsWith('http')) {
    // Download from URL (DALL-E case)
    const response = await fetch(imageSource);
    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    // Read from local file system (Imagen case)
    const fs = await import('fs/promises');
    buffer = await fs.readFile(imageSource);
  }

  // Convert buffer to File-like object
  const file = new File([buffer], `generated-${fileName}-${Date.now()}.png`, {
    type: "image/png",
  });

  // Upload using UploadThing for permanent storage
  const { utapi } = await import("./upload-thing-server");
  
  const uploadResults = await utapi.uploadFiles([file]);

  if (!uploadResults || uploadResults.length === 0) {
    throw new Error("No files uploaded to UploadThing");
  }

  const firstResult = uploadResults[0];
  if (!firstResult) {
    throw new Error("Upload result was null or undefined");
  }

  // Check for error in result
  if (firstResult.error) {
    throw new Error(`UploadThing error: ${JSON.stringify(firstResult.error)}`);
  }

  // Success case - get the URL from the data
  if (!firstResult.data?.url) {
    throw new Error("No URL returned from UploadThing");
  }

  return firstResult.data.url;
}

// Helper functions
function getSeason(date: Date | null | undefined): string {
  if (!date) return "Year-round";
  const actualDate = date instanceof Date ? date : new Date(date);
  const month = actualDate.getMonth();
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Autumn";
  return "Winter";
}

function getTimeOfDay(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

function getRegionFromCoordinates(lat: number, lng: number): string {
  // Basic continental detection
  if (lat > 23.5 && lng > -25 && lng < 60) return "Europe";
  if (lat > 10 && lng > 60 && lng < 150) return "Asia";
  if (lat > -35 && lat < 37 && lng > -20 && lng < 60) return "Africa";
  if (lat > 25 && lng > -130 && lng < -60) return "North America";
  if (lat < 12 && lat > -56 && lng > -82 && lng < -34) return "South America";
  if (lat < -10 && lng > 110 && lng < 180) return "Oceania";
  return "Unknown";
}

function getGeographicContext(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): string {
  const distance = calculateDistance(startLat, startLng, endLat, endLng);
  const description: string[] = [];

  if (distance > 1000) description.push("international journey");
  else if (distance > 300) description.push("regional journey");
  else description.push("local journey");

  if (Math.abs(startLat - endLat) > 10) description.push("crossing climate zones");

  return description.join(", ");
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "TBD";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "TBD";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDurationInDays(startDate: Date | null | undefined, endDate: Date | null | undefined): number {
  if (!startDate || !endDate) return 0;
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDuration(startTime: Date, endTime: Date): string {
  const diff = new Date(endTime).getTime() - new Date(startTime).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} day${days !== 1 ? "s" : ""}${remainingHours > 0 ? ` ${remainingHours} hour${remainingHours !== 1 ? "s" : ""}` : ""}`;
  }

  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""}${minutes > 0 ? ` ${minutes} minute${minutes !== 1 ? "s" : ""}` : ""}`;
  }

  return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}

// Image generation logging functions
export async function logImageGeneration(data: {
  entityType: "trip" | "segment" | "reservation";
  entityId: string;
  entityName?: string;
  promptId?: string;
  promptName?: string;
  promptStyle?: string;
  fullPrompt: string;
  aiReasoning?: string;
  selectionReason?: string;
  availablePrompts?: string[];
  callerFunction?: string;
  callerSource?: string;
  userId?: string;
  status: "success" | "failed" | "in_progress";
  imageUrl?: string;
  errorMessage?: string;
  generationTimeMs?: number;
  imageProvider?: string;
}) {
  return await prisma.imageGenerationLog.create({
    data: {
      ...data,
      availablePrompts: data.availablePrompts ? JSON.stringify(data.availablePrompts) : null,
    },
  });
}

export async function updateImageGenerationLog(
  logId: string,
  updates: {
    status?: "success" | "failed" | "in_progress";
    imageUrl?: string;
    errorMessage?: string;
    generationTimeMs?: number;
  }
) {
  return await prisma.imageGenerationLog.update({
    where: { id: logId },
    data: updates,
  });
}

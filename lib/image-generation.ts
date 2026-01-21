import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import type { UploadedFileData } from "uploadthing/types";

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
  let selectedPrompt: ImagePrompt;
  if (specificPromptId) {
    const prompt = await prisma.imagePrompt.findUnique({
      where: { id: specificPromptId, category: entityType },
    });
    if (!prompt) throw new Error("Invalid prompt ID");
    selectedPrompt = prompt;
  } else {
    selectedPrompt = await selectBestPromptForContent(entity, entityType);
  }

  // 2. Build complete prompt with all entity data
  const fullPrompt = buildContextualPrompt(selectedPrompt, entity, entityType);

  // 3. Generate image with DALL-E (returns URL directly)
  const imageUrl = await generateImageWithDALLE(fullPrompt);

  // 4. Download and upload to UploadThing for permanent storage
  const permanentUrl = await uploadImageToStorage(
    imageUrl,
    `${entityType}-${entity.id || Date.now()}`
  );

  return {
    imageUrl: permanentUrl,
    promptId: selectedPrompt.id,
    promptName: selectedPrompt.name,
  };
}

// Helper functions to select prompts for specific entity types
export async function selectBestPromptForTrip(trip: any, specificPromptId?: string) {
  if (specificPromptId) {
    const prompt = await prisma.imagePrompt.findUnique({
      where: { id: specificPromptId, category: "trip" },
    });
    if (!prompt) throw new Error("Prompt not found");
    return prompt;
  }
  const content = `Title: ${trip.title}\nDescription: ${trip.description || ""}`;
  return await selectBestPromptForContent(content, "trip");
}

export async function selectBestPromptForSegment(segment: any) {
  const content = `Name: ${segment.name}\nFrom: ${segment.startTitle}\nTo: ${segment.endTitle}\nNotes: ${segment.notes || ""}`;
  return await selectBestPromptForContent(content, "segment");
}

export async function selectBestPromptForReservation(reservation: any) {
  const content = `Name: ${reservation.name}\nLocation: ${reservation.location || ""}\nNotes: ${reservation.notes || ""}`;
  return await selectBestPromptForContent(content, "reservation");
}

// AI analyzes trip/segment/reservation data to pick best theme
async function selectBestPromptForContent(
  entity: any,
  entityType: "trip" | "segment" | "reservation"
): Promise<ImagePrompt> {
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
          content: `You are a travel imagery expert. Analyze the travel details and select the most appropriate visual style from the available options. Consider: destination type (urban/nature/beach/mountains), travel dates (season), activity type, and destination character. Return only the prompt name exactly as provided.`,
        },
        {
          role: "user",
          content: `Travel Details:\n${analysisContext}\n\nAvailable Styles:\n${availablePrompts.map((p) => p.name).join("\n")}\n\nSelect the single best matching style name:`,
        },
      ],
      temperature: 0.3,
    });

    const selectedName = completion.choices[0].message.content?.trim();
    const selectedPrompt = availablePrompts.find((p) => p.name === selectedName);

    return selectedPrompt || availablePrompts[0];
  } catch (error) {
    console.error("Error selecting prompt with AI:", error);
    // Fallback to first available prompt
    return availablePrompts[0];
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

// Combine template + actual entity data (exported for queue processor)
export function buildContextualPrompt(
  promptTemplate: ImagePrompt,
  entity: any,
  entityType: "trip" | "segment" | "reservation"
): string {
  const template = promptTemplate.prompt;

  // Build the TRAVEL CONTEXT section with actual data
  let travelContext = "";

  if (entityType === "trip") {
    const segments = entity.segments || [];
    const firstSegment = segments[0];
    travelContext = `
Destination: ${entity.title}
Description: ${entity.description}
Travel Dates: ${formatDate(entity.startDate)} to ${formatDate(entity.endDate)}
Season: ${getSeason(entity.startDate)}
Duration: ${getDurationInDays(entity.startDate, entity.endDate)} days
${segments.length > 0 ? `Key Locations: ${segments.map((s: any) => `${s.startTitle} → ${s.endTitle}`).join(", ")}` : ""}
${firstSegment ? `Primary Coordinates: ${firstSegment.startLat}, ${firstSegment.startLng}` : ""}
${firstSegment ? `Geographic Region: ${getRegionFromCoordinates(firstSegment.startLat, firstSegment.startLng)}` : ""}`;
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

// Download DALL-E image and upload to UploadThing for permanent storage (exported for queue processor)
export async function uploadImageToStorage(
  imageUrl: string,
  fileName: string
): Promise<string> {
  // Download image from OpenAI's temporary URL
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

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

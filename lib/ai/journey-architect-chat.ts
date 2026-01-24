/**
 * Journey Architect AI Chat Logic
 * 
 * AI-powered chat for building journey structures (Chapters)
 */

import { openai } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { z } from "zod";
import { TRIP_STRUCTURE_SYSTEM_PROMPT } from "./prompts";

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
}

interface InMemoryTrip {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  segments: InMemorySegment[];
}

interface JourneyArchitectResponse {
  message: string;
  tripUpdates?: Partial<InMemoryTrip>;
  segmentsToAdd?: InMemorySegment[];
}

/**
 * Process a Journey Architect chat message
 */
export async function processJourneyArchitectChat(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  currentTrip: InMemoryTrip
): Promise<JourneyArchitectResponse> {
  try {
    console.log("🎯 [Journey Architect] Processing message:", message);
    console.log("📊 [Journey Architect] Current trip:", {
      title: currentTrip.title,
      startDate: currentTrip.startDate,
      endDate: currentTrip.endDate,
      segmentCount: currentTrip.segments.length
    });

    // Build conversation prompt
    const conversationPrompt = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
    
    const fullPrompt = conversationPrompt 
      ? `${conversationPrompt}\n\nUser: ${message}`
      : message;

    // Add current trip context to system prompt
    const contextualSystemPrompt = `${TRIP_STRUCTURE_SYSTEM_PROMPT}

## CURRENT JOURNEY STATE

${currentTrip.title ? `Journey Title: ${currentTrip.title}` : "No title set yet"}
${currentTrip.startDate ? `Start Date: ${currentTrip.startDate}` : "No start date set"}
${currentTrip.endDate ? `End Date: ${currentTrip.endDate}` : "No end date set"}
${currentTrip.segments.length > 0 ? `Existing Chapters: ${currentTrip.segments.length}` : "No chapters yet"}

${currentTrip.segments.length > 0 ? `
Current Chapters:
${currentTrip.segments.map((seg, idx) => `${idx + 1}. ${seg.name} (${seg.segmentType}): ${seg.startLocation} → ${seg.endLocation}`).join('\n')}
` : ''}

Remember: Use your tools (update_in_memory_trip and add_in_memory_segment) to update the journey structure as you discuss it with the user.`;

    // Define tools for the AI (using Vercel AI SDK tool format with Zod schemas)
    const tools = {
      update_in_memory_trip: tool({
        description: "Update the Journey metadata in memory (not database). Use this to populate Journey details from conversation.",
        inputSchema: z.object({
          title: z.string().optional().describe("Journey title (use aspirational names)"),
          description: z.string().optional().describe("Journey description"),
          startDate: z.string().optional().describe("Start date in YYYY-MM-DD format"),
          endDate: z.string().optional().describe("End date in YYYY-MM-DD format"),
        }),
        execute: async ({ title, description, startDate, endDate }) => {
          return {
            success: true,
            updateType: "trip_metadata",
            updates: { title, description, startDate, endDate },
          };
        },
      }),
      add_in_memory_segment: tool({
        description: "Add a Chapter to the in-memory Journey. Each Chapter represents a distinct phase like a destination stay or travel leg.",
        inputSchema: z.object({
          name: z.string().describe("Chapter name - use aspirational, evocative names (e.g., 'Hokkaido Alpine Adventure', 'Journey to the East: SFO → Tokyo')"),
          segmentType: z.enum(["Travel", "Stay", "Tour", "Retreat", "Road Trip"]).describe("Type of Chapter"),
          startLocation: z.string().describe("Starting location (city, country)"),
          endLocation: z.string().describe("Ending location (city, country)"),
          startTime: z.string().optional().describe("Start date/time in ISO format"),
          endTime: z.string().optional().describe("End date/time in ISO format"),
          notes: z.string().optional().describe("Additional notes about this Chapter"),
        }),
        execute: async ({ name, segmentType, startLocation, endLocation, startTime, endTime, notes }) => {
          return {
            success: true,
            updateType: "add_segment",
            segment: {
              tempId: `temp-${Date.now()}-${Math.random()}`,
              name,
              segmentType,
              startLocation,
              endLocation,
              startTime: startTime || null,
              endTime: endTime || null,
              notes: notes || null,
            },
          };
        },
      }),
    };

    // Call OpenAI with tools
    const response = await generateText({
      model: openai("gpt-4o-2024-11-20"),
      system: contextualSystemPrompt,
      prompt: fullPrompt,
      tools: tools,
      temperature: 0.7
    });

    console.log("🤖 [Journey Architect] AI response received");
    console.log("📝 [Journey Architect] Response text length:", response.text.length);
    console.log("🔧 [Journey Architect] Steps:", response.steps?.length || 0);

    // Process tool results (tools are auto-executed by Vercel AI SDK)
    const tripUpdates: Partial<InMemoryTrip> = {};
    const segmentsToAdd: InMemorySegment[] = [];

    if (response.steps) {
      for (const step of response.steps) {
        if (step.toolCalls) {
          for (const toolCall of step.toolCalls) {
            console.log("🔧 [Journey Architect] Processing tool call:", toolCall.toolName);
            
            // Access the result from the toolCall (cast to any to bypass TypeScript)
            const result = (toolCall as any).result;
            
            if (toolCall.toolName === "update_in_memory_trip" && result?.success) {
              console.log("📝 [Journey Architect] Updating trip metadata:", result.updates);
              
              if (result.updates.title) tripUpdates.title = result.updates.title;
              if (result.updates.description) tripUpdates.description = result.updates.description;
              if (result.updates.startDate) tripUpdates.startDate = result.updates.startDate;
              if (result.updates.endDate) tripUpdates.endDate = result.updates.endDate;
            }
            
            if (toolCall.toolName === "add_in_memory_segment" && result?.success) {
              console.log("➕ [Journey Architect] Adding segment:", result.segment.name);
              
              const newSegment: InMemorySegment = {
                ...result.segment,
                order: currentTrip.segments.length + segmentsToAdd.length
              };
              
              segmentsToAdd.push(newSegment);
            }
          }
        }
      }
    }

    console.log("✅ [Journey Architect] Processing complete");
    console.log("📊 [Journey Architect] Trip updates:", Object.keys(tripUpdates).length);
    console.log("📊 [Journey Architect] Segments to add:", segmentsToAdd.length);

    return {
      message: response.text,
      tripUpdates: Object.keys(tripUpdates).length > 0 ? tripUpdates : undefined,
      segmentsToAdd: segmentsToAdd.length > 0 ? segmentsToAdd : undefined
    };

  } catch (error) {
    console.error("❌ [Journey Architect] Error processing chat:", error);
    throw error;
  }
}

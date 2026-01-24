/**
 * Journey Architect AI Chat Logic
 * 
 * AI-powered chat for building journey structures (Chapters)
 */

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
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

    // Build conversation context
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })),
      {
        role: "user" as const,
        content: message
      }
    ];

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

    // Define tools for the AI
    const tools = {
      update_in_memory_trip: {
        description: "Update the Journey metadata in memory (not database). Use this to populate Journey details from conversation.",
        parameters: {
          type: "object" as const,
          properties: {
            title: {
              type: "string",
              description: "Journey title (use aspirational names)"
            },
            description: {
              type: "string",
              description: "Journey description"
            },
            startDate: {
              type: "string",
              description: "Start date in YYYY-MM-DD format"
            },
            endDate: {
              type: "string",
              description: "End date in YYYY-MM-DD format"
            }
          }
        }
      },
      add_in_memory_segment: {
        description: "Add a Chapter to the in-memory Journey. Each Chapter represents a distinct phase like a destination stay or travel leg.",
        parameters: {
          type: "object" as const,
          properties: {
            name: {
              type: "string",
              description: "Chapter name - use aspirational, evocative names (e.g., 'Hokkaido Alpine Adventure', 'Journey to the East: SFO → Tokyo')"
            },
            segmentType: {
              type: "string",
              enum: ["Travel", "Stay", "Tour", "Retreat", "Road Trip"],
              description: "Type of Chapter"
            },
            startLocation: {
              type: "string",
              description: "Starting location (city, country)"
            },
            endLocation: {
              type: "string",
              description: "Ending location (city, country)"
            },
            startTime: {
              type: "string",
              description: "Start date/time in ISO format"
            },
            endTime: {
              type: "string",
              description: "End date/time in ISO format"
            },
            notes: {
              type: "string",
              description: "Additional notes about this Chapter"
            }
          },
          required: ["name", "segmentType", "startLocation", "endLocation"]
        }
      }
    };

    // Call OpenAI with tools
    const response = await generateText({
      model: openai("gpt-4o-2024-11-20"),
      system: contextualSystemPrompt,
      messages: messages,
      tools: tools,
      toolChoice: "auto",
      temperature: 0.7,
      maxTokens: 2000
    });

    console.log("🤖 [Journey Architect] AI response received");
    console.log("📝 [Journey Architect] Response text length:", response.text.length);
    console.log("🔧 [Journey Architect] Tool calls:", response.toolCalls?.length || 0);

    // Process tool calls
    const tripUpdates: Partial<InMemoryTrip> = {};
    const segmentsToAdd: InMemorySegment[] = [];

    if (response.toolCalls && response.toolCalls.length > 0) {
      for (const toolCall of response.toolCalls) {
        console.log("🔧 [Journey Architect] Processing tool call:", toolCall.toolName);
        
        if (toolCall.toolName === "update_in_memory_trip") {
          const args = toolCall.args as any;
          console.log("📝 [Journey Architect] Updating trip metadata:", args);
          
          if (args.title) tripUpdates.title = args.title;
          if (args.description) tripUpdates.description = args.description;
          if (args.startDate) tripUpdates.startDate = args.startDate;
          if (args.endDate) tripUpdates.endDate = args.endDate;
        }
        
        if (toolCall.toolName === "add_in_memory_segment") {
          const args = toolCall.args as any;
          console.log("➕ [Journey Architect] Adding segment:", args.name);
          
          const newSegment: InMemorySegment = {
            tempId: `temp-${Date.now()}-${Math.random()}`,
            name: args.name,
            segmentType: args.segmentType,
            startLocation: args.startLocation,
            endLocation: args.endLocation,
            startTime: args.startTime || null,
            endTime: args.endTime || null,
            notes: args.notes || null,
            order: currentTrip.segments.length + segmentsToAdd.length
          };
          
          segmentsToAdd.push(newSegment);
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

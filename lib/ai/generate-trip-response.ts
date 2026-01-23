import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createTripPlanningTools } from "@/lib/ai/tools";
import { TRIP_PLANNER_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export interface TripResponseOutput {
  text: string;
  toolResults: Array<{
    toolName: string;
    result: any;
  }>;
  tripCreated?: boolean;
  tripId?: string;
}

export async function generateTripResponse(
  userQuery: string,
  userId: string,
  conversationId?: string
): Promise<TripResponseOutput> {
  console.log("🤖 [generateTripResponse] Starting with tools enabled");
  console.log("   User ID:", userId);
  console.log("   Conversation ID:", conversationId);
  console.log("   Query:", userQuery);

  const tools = createTripPlanningTools(userId, conversationId);
  
  let result;
  try {
    result = await generateText({
      model: openai("gpt-4o-2024-11-20"),
      system: TRIP_PLANNER_SYSTEM_PROMPT,
      prompt: userQuery,
      tools,
      maxSteps: 10, // Allow multiple tool calls
      temperature: 0.7,
      maxTokens: 2000,
    });
  } catch (error) {
    console.error("❌ [generateTripResponse] AI API call failed:", error);
    throw new Error(`AI API call failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  console.log("✅ [generateTripResponse] AI response received");
  console.log("   Response text length:", result.text.length);

  // Extract tool results
  const toolResults: Array<{ toolName: string; result: any }> = [];
  let tripCreated = false;
  let tripId: string | undefined;

  // Process tool calls from steps
  if (result.steps) {
    console.log(`   Processing ${result.steps.length} steps`);
    for (const step of result.steps) {
      if (step.toolCalls) {
        console.log(`   Step has ${step.toolCalls.length} tool calls`);
        for (const toolCall of step.toolCalls) {
          console.log(`   - Tool: ${toolCall.toolName}`);
          toolResults.push({
            toolName: toolCall.toolName,
            result: toolCall.result,
          });
          
          // Check if trip was created
          if (toolCall.toolName === 'create_trip' && toolCall.result?.tripId) {
            tripCreated = true;
            tripId = toolCall.result.tripId;
            console.log(`   ✅ Trip created: ${tripId}`);
          }
        }
      }
    }
  }

  console.log(`✅ [generateTripResponse] Complete - ${toolResults.length} tool calls, trip created: ${tripCreated}`);

  return {
    text: result.text,
    toolResults,
    tripCreated,
    tripId,
  };
}

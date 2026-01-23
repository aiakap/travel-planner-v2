import { auth } from "@/auth";
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { createTripPlanningTools } from "@/lib/ai/tools";
import { TRIP_PLANNER_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60; // Increased for tool execution

// Helper to get trip context for the conversation
async function getTripContext(conversationId: string, userId: string): Promise<string | null> {
  try {
    // Get conversation with trip info
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      include: {
        trip: {
          include: {
            segments: {
              include: {
                segmentType: true,
                reservations: {
                  include: {
                    reservationType: {
                      include: {
                        category: true,
                      },
                    },
                    reservationStatus: true,
                  },
                  orderBy: {
                    startTime: 'asc',
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    if (!conversation?.trip) {
      return null;
    }

    const trip = conversation.trip;

    // Format trip data as context
    let context = `\n\n## CURRENT TRIP CONTEXT\n\n`;
    context += `You are currently discussing the trip: "${trip.title}"\n`;
    context += `Description: ${trip.description}\n`;
    context += `Dates: ${new Date(trip.startDate).toLocaleDateString()} to ${new Date(trip.endDate).toLocaleDateString()}\n`;
    context += `Trip ID: ${trip.id}\n\n`;

    if (trip.segments.length > 0) {
      context += `### Trip Segments (${trip.segments.length} total):\n\n`;

      trip.segments.forEach((segment, idx) => {
        context += `**Segment ${idx + 1}: ${segment.name}**\n`;
        context += `- Type: ${segment.segmentType.name}\n`;
        context += `- From: ${segment.startTitle}\n`;
        context += `- To: ${segment.endTitle}\n`;
        if (segment.startTime) {
          context += `- Start: ${new Date(segment.startTime).toLocaleString()}\n`;
        }
        if (segment.endTime) {
          context += `- End: ${new Date(segment.endTime).toLocaleString()}\n`;
        }
        if (segment.notes) {
          context += `- Notes: ${segment.notes}\n`;
        }
        context += `- Segment ID: ${segment.id}\n`;

        if (segment.reservations.length > 0) {
          context += `\n  **Reservations in this segment (${segment.reservations.length}):**\n`;
          segment.reservations.forEach((res, resIdx) => {
            context += `  ${resIdx + 1}. ${res.name}\n`;
            context += `     - Category: ${res.reservationType.category.name}\n`;
            context += `     - Type: ${res.reservationType.name}\n`;
            context += `     - Status: ${res.reservationStatus.name}\n`;
            if (res.startTime) {
              context += `     - Time: ${new Date(res.startTime).toLocaleString()}`;
              if (res.endTime) {
                context += ` to ${new Date(res.endTime).toLocaleTimeString()}`;
              }
              context += `\n`;
            }
            if (res.location) {
              context += `     - Location: ${res.location}\n`;
            }
            if (res.cost) {
              context += `     - Cost: ${res.currency || '$'}${res.cost}\n`;
            }
            if (res.confirmationNumber) {
              context += `     - Confirmation: ${res.confirmationNumber}\n`;
            }
            if (res.notes) {
              context += `     - Notes: ${res.notes}\n`;
            }
            context += `     - Reservation ID: ${res.id}\n`;
          });
        } else {
          context += `\n  No reservations in this segment yet.\n`;
        }
        context += `\n`;
      });
    } else {
      context += `No segments have been added to this trip yet.\n\n`;
    }

    context += `\n**IMPORTANT**: When answering questions about this trip, always reference the specific details above. You have complete knowledge of all segments, reservations, times, locations, and costs. Use this information to provide accurate, contextual responses.\n`;

    return context;
  } catch (error) {
    console.error("[getTripContext] Error:", error);
    return null;
  }
}

// Helper to save message directly (not a server action, for use in API routes)
async function saveMessageDirect({
  conversationId,
  userId,
  role,
  content,
  toolCalls,
}: {
  conversationId: string;
  userId: string;
  role: string;
  content: string;
  toolCalls?: string | null;
}) {
  // Verify conversation belongs to user
  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      userId: userId,
    },
  });

  if (!conversation) {
    console.error("[saveMessageDirect] Conversation not found:", conversationId);
    return null;
  }

  const message = await prisma.chatMessage.create({
    data: {
      conversationId,
      role,
      content,
      toolCalls: toolCalls || undefined,
    },
  });

  // Update conversation timestamp
  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return message;
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, conversationId } = await req.json();
    const userId = session.user.id;

    // Convert UI messages to model messages format
    const modelMessages = await convertToModelMessages(messages);

    // Get trip context if this conversation is about a specific trip
    const tripContext = await getTripContext(conversationId, userId);

    // Create tools with userId and conversationId already injected
    const tools = createTripPlanningTools(userId, conversationId);

    // Build system prompt with trip context if available
    const systemPrompt = tripContext 
      ? TRIP_PLANNER_SYSTEM_PROMPT + tripContext
      : TRIP_PLANNER_SYSTEM_PROMPT;

    // 🔍 DEBUG: Log the system prompt to verify it contains our instructions
    console.log("🎯 [System Prompt Preview]:", systemPrompt.substring(0, 500));
    console.log("🔧 [Available Tools]:", Object.keys(tools));

    const result = streamText({
      model: openai("gpt-4o-2024-11-20"), // Latest GPT-4o with best tool calling
      system: systemPrompt,
      messages: modelMessages,
      tools: tools,
      toolChoice: "auto", // Explicitly enable automatic tool selection
      temperature: 0.7, // Slightly more creative for better tool usage
      onFinish: async ({ text, toolCalls, toolResults }) => {
        try {
          // 🔍 DEBUG: Log all tool invocations
          console.log("=" .repeat(80));
          console.log("🔧 [TOOL INVOCATIONS DEBUG]");
          console.log("Total tool calls:", toolCalls?.length || 0);
          
          if (toolCalls && toolCalls.length > 0) {
            toolCalls.forEach((call, idx) => {
              console.log(`\n📞 Tool Call ${idx + 1}:`, {
                toolName: call.toolName,
                args: ('args' in call) ? call.args : undefined,
              });
              
              // Specifically highlight suggest_place calls
              if (call.toolName === "suggest_place" && 'args' in call) {
                console.log("✨ PLACE SUGGESTION DETECTED:", call.args);
              }
            });
          } else {
            console.log("⚠️  No tool calls made in this response");
          }
          
          if (toolResults && toolResults.length > 0) {
            console.log("\n📊 Tool Results:");
            toolResults.forEach((result, idx) => {
              console.log(`Result ${idx + 1}:`, result);
            });
          }
          
          console.log("\n📝 Assistant response text:", text.substring(0, 200) + "...");
          console.log("=" .repeat(80));

          // Save user message
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === "user") {
              // Extract text from parts for UI messages
              const userContent = lastMessage.parts
                ?.filter((p: { type: string }) => p.type === "text")
                .map((p: { text: string }) => p.text)
                .join("") || "";
              await saveMessageDirect({
                conversationId,
                userId,
                role: "user",
                content: userContent,
              });
            }
          }

          // Save assistant message with tool calls
          await saveMessageDirect({
            conversationId,
            userId,
            role: "assistant",
            content: text,
            toolCalls:
              toolCalls && toolCalls.length > 0
                ? JSON.stringify({
                    calls: toolCalls,
                    results: toolResults,
                  })
                : null,
          });
        } catch (saveError) {
          console.error("[API /api/chat] Error saving messages:", saveError);
        }
      },
    });

    // useChat expects the AI SDK UI message stream protocol
    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('[API /api/chat] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


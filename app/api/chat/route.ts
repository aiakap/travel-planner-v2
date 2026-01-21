import { auth } from "@/auth";
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { createTripPlanningTools } from "@/lib/ai/tools";
import { TRIP_PLANNER_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60; // Increased for tool execution

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

    // Create tools with userId already injected
    const tools = createTripPlanningTools(userId);

    const result = streamText({
      model: openai("gpt-4o"),
      system: TRIP_PLANNER_SYSTEM_PROMPT,
      messages: modelMessages,
      tools: tools,
      stopWhen: stepCountIs(15), // Allow multiple tool calls for complete trip creation
      onFinish: async ({ text, toolCalls, toolResults }) => {
        try {
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


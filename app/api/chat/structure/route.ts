import { auth } from "@/auth";
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
import { createTripPlanningTools } from "@/lib/ai/tools";
import { TRIP_STRUCTURE_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

// Helper to save message directly
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

    const { messages, conversationId, userId } = await req.json();

    // Convert UI messages to model messages format
    const modelMessages = await convertToModelMessages(messages);

    // Create tools with userId and conversationId
    const tools = createTripPlanningTools(userId, conversationId);

    // Use trip structure specific prompt
    const systemPrompt = TRIP_STRUCTURE_SYSTEM_PROMPT;

    console.log("🎯 [Structure Mode] Starting chat with structure-specific prompt");
    console.log("🔧 [Available Tools]:", Object.keys(tools));

    const result = streamText({
      model: openai("gpt-4o-2024-11-20"),
      system: systemPrompt,
      messages: modelMessages,
      tools: tools,
      toolChoice: "auto",
      temperature: 0.7,
      onFinish: async ({ text, toolCalls, toolResults }) => {
        try {
          console.log("=" .repeat(80));
          console.log("🔧 [STRUCTURE MODE TOOL INVOCATIONS]");
          console.log("Total tool calls:", toolCalls?.length || 0);

          if (toolCalls && toolCalls.length > 0) {
            toolCalls.forEach((call, idx) => {
              console.log(`\n📞 Tool Call ${idx + 1}:`, {
                toolName: call.toolName,
                args: "args" in call ? call.args : undefined,
              });
            });
          }

          console.log("\n📝 Assistant response text:", text.substring(0, 200) + "...");
          console.log("=" .repeat(80));

          // Save messages if we have a conversation
          if (conversationId) {
            // Save user message
            if (messages.length > 0) {
              const lastMessage = messages[messages.length - 1];
              if (lastMessage.role === "user") {
                const userContent =
                  lastMessage.parts
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
          }
        } catch (saveError) {
          console.error("[API /api/chat/structure] Error saving messages:", saveError);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("[API /api/chat/structure] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

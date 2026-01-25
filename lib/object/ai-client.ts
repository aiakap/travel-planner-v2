/**
 * AI client for object chat system
 * Handles AI API calls
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AICallOptions {
  systemPrompt: string;
  userMessage: string;
  messageHistory?: AIMessage[];
  maxTokens?: number;
}

/**
 * Call AI with the given options
 */
export async function callAI(options: AICallOptions): Promise<string> {
  const {
    systemPrompt,
    userMessage,
    messageHistory = [],
    maxTokens = 2000,
  } = options;

  try {
    // Build messages array
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...messageHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: userMessage,
      },
    ];

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === "text");
    return textContent && "text" in textContent ? textContent.text : "";
  } catch (error) {
    console.error("AI call error:", error);
    throw new Error("Failed to call AI");
  }
}

/**
 * Inject variables into prompt
 */
export function injectVariables(
  prompt: string,
  variables: Record<string, string>
): string {
  let result = prompt;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

/**
 * AI client for object chat system
 * Handles AI API calls
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    // Build messages array with system message first
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messageHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: userMessage,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: maxTokens,
      messages,
    });

    // Extract text from response
    return response.choices[0]?.message?.content || "";
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

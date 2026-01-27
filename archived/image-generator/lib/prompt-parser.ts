import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { generateFilenameFromPrompt } from "./file-utils";

export interface ParsedPrompt {
  id: string;
  prompt: string;
  filename: string;
}

export interface ParseResult {
  prompts: ParsedPrompt[];
  rawXml: string;
}

/**
 * Parse text containing prompts using OpenAI GPT-4
 * Extracts prompts and generates filenames
 */
export async function parsePromptsFromText(text: string): Promise<ParseResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }

  const openai = new OpenAI({ apiKey });

  const systemPrompt = `You are a prompt extraction assistant. Your job is to extract image generation prompts from text.

Rules:
1. Extract ALL prompts from the text, regardless of format (numbered lists, bullet points, XML, plain text, etc.)
2. Each prompt should be a complete description suitable for image generation
3. Generate a descriptive filename for each prompt (lowercase, underscores for spaces, max 50 chars)
4. Output ONLY valid XML in this exact format:

<prompts>
  <prompt id="1" filename="descriptive_filename_here">Full prompt text here</prompt>
  <prompt id="2" filename="another_filename">Another prompt text</prompt>
</prompts>

Examples of valid filenames:
- "futuristic_city_at_sunset"
- "astronaut_riding_horse_in_space"
- "mountain_landscape_with_lake"

Do NOT include any explanation or text outside the XML tags.`;

  const userPrompt = `Extract all image generation prompts from the following text and format them as XML:

${text}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    });

    const rawXml = completion.choices[0].message.content?.trim() || "";

    // Parse the XML to extract prompts
    const prompts = parseXmlPrompts(rawXml);

    return {
      prompts,
      rawXml,
    };
  } catch (error: any) {
    throw new Error(`Failed to parse prompts: ${error.message}`);
  }
}

/**
 * Parse XML string to extract prompts
 */
function parseXmlPrompts(xml: string): ParsedPrompt[] {
  const prompts: ParsedPrompt[] = [];

  // Simple regex-based XML parsing (good enough for our controlled format)
  const promptRegex = /<prompt\s+id="([^"]+)"\s+filename="([^"]+)">([^<]+)<\/prompt>/g;
  let match;

  while ((match = promptRegex.exec(xml)) !== null) {
    const [, , filename, prompt] = match;
    prompts.push({
      id: uuidv4(), // Generate UUID instead of using the sequential ID
      prompt: prompt.trim(),
      filename: filename.trim(),
    });
  }

  // Fallback: if no prompts found, try to extract from plain text
  if (prompts.length === 0) {
    // Try to find prompts in numbered lists or line-by-line
    const lines = xml.split("\n").filter(line => line.trim().length > 0);
    for (const line of lines) {
      // Remove leading numbers, bullets, etc.
      const cleaned = line.replace(/^\d+[\.\)]\s*/, "").replace(/^[-*]\s*/, "").trim();
      if (cleaned.length > 10) {
        // Looks like a prompt
        prompts.push({
          id: uuidv4(),
          prompt: cleaned,
          filename: generateFilenameFromPrompt(cleaned),
        });
      }
    }
  }

  return prompts;
}

/**
 * Validate that a string looks like a valid prompt
 */
export function isValidPrompt(text: string): boolean {
  return text.trim().length >= 10; // At least 10 characters
}

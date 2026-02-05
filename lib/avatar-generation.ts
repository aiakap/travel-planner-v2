// Server-only avatar generation logic
// This file should only be imported in server components or API routes

import { uploadImageToStorage } from "@/lib/image-generation";

// Re-export types and constants for backward compatibility with API routes
export { AVATAR_STYLES, getAvatarStyle, type AvatarStyle, type AvatarStyleOption } from "@/lib/avatar-types";

// Import types for use in this file
import { AVATAR_STYLES, type AvatarStyle } from "@/lib/avatar-types";

// Base prompt for all avatar generations
const BASE_AVATAR_PROMPT = `
Professional stylized profile avatar image.
Clean, modern illustration style with soft gradients and warm lighting.
Circular composition suitable for profile picture.
Sophisticated color palette with teal, coral, and warm gold accents.
High quality, detailed artwork.
CRITICAL: Do not include any text, words, letters, labels, signs, or typography in the image. No readable characters of any kind.
`.trim();

/**
 * Generate an avatar image using Vertex AI Imagen
 * @param customPrompt - Optional custom description from user
 * @param style - Avatar style to apply
 * @returns URL of the uploaded avatar image
 */
export async function generateAvatarImage(
  customPrompt: string | null,
  style: AvatarStyle
): Promise<string> {
  console.log(`[generateAvatarImage] Starting avatar generation with style: ${style}`);
  
  // Find the style configuration
  const styleConfig = AVATAR_STYLES.find(s => s.id === style);
  if (!styleConfig) {
    throw new Error(`Invalid avatar style: ${style}`);
  }

  // Build the complete prompt
  let fullPrompt = BASE_AVATAR_PROMPT;
  
  // Add style modifier
  fullPrompt += `\n\nStyle: ${styleConfig.promptModifier}`;
  
  // Add custom description if provided
  if (customPrompt && customPrompt.trim()) {
    fullPrompt += `\n\nAdditional details: ${customPrompt.trim()}`;
  }

  console.log(`[generateAvatarImage] Full prompt length: ${fullPrompt.length} chars`);
  
  try {
    // Import the Vertex AI client
    const { getVertexAIClient } = await import("@/archived/image-generator/lib/vertex-ai-client");
    const client = getVertexAIClient();
    
    const filename = `avatar-${Date.now()}.png`;
    
    // Generate image with 1:1 aspect ratio for avatar
    const result = await client.generateImage(
      {
        prompt: fullPrompt,
        aspectRatio: "1:1", // Square format for avatars
        addWatermark: false,
        safetySetting: "block_few"
      },
      filename
    );

    if (!result.success || !result.imagePath) {
      console.error(`[generateAvatarImage] Image generation failed:`, result.error);
      throw new Error(result.error?.message || "Avatar generation failed");
    }

    console.log(`[generateAvatarImage] Image generated, uploading to storage...`);

    // Upload to UploadThing for permanent storage
    const permanentUrl = await uploadImageToStorage(
      result.imagePath,
      `avatar-${Date.now()}`
    );

    console.log(`[generateAvatarImage] Avatar uploaded successfully: ${permanentUrl}`);

    return permanentUrl;
  } catch (error) {
    console.error(`[generateAvatarImage] Exception:`, error);
    throw error;
  }
}

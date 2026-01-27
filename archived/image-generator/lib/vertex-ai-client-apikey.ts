/**
 * Alternative Vertex AI client that attempts to use API key instead of service account
 * NOTE: This typically won't work as Vertex AI requires service account authentication
 * Keeping this as a fallback/test option
 */

import { v4 as uuidv4 } from "uuid";
import { writeFile } from "fs/promises";
import { join } from "path";

export interface ImageGenerationParams {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  addWatermark?: boolean;
}

export interface ImageGenerationResult {
  success: boolean;
  imageBase64?: string;
  imagePath?: string;
  error?: {
    code: number;
    message: string;
    details?: any;
  };
  duration: number;
  apiCallId: string;
}

export async function generateImageWithApiKey(
  params: ImageGenerationParams,
  filename: string
): Promise<ImageGenerationResult> {
  const apiCallId = uuidv4();
  const startTime = Date.now();

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const project = process.env.GOOGLE_CLOUD_PROJECT || "your-project";
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    const model = process.env.IMAGEN_MODEL || "imagen-4.0-generate-001";

    if (!apiKey) {
      throw new Error("GOOGLE_MAPS_API_KEY not found");
    }

    // Try to use API key with Vertex AI endpoint
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:predict`;

    const aspectRatio = params.aspectRatio || process.env.IMAGEN_ASPECT_RATIO || "1:1";
    const body = {
      instances: [{ prompt: params.prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatio,
        addWatermark: params.addWatermark ?? false,
        safetySetting: "block_medium_and_above",
        outputOptions: { mimeType: "image/png" },
      },
    };

    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: {
          code: response.status,
          message: `API Key authentication failed. Vertex AI requires Service Account credentials, not API keys.`,
          details: errorText,
        },
        duration,
        apiCallId,
      };
    }

    const data = await response.json();
    const imageBase64 = data.predictions?.[0]?.bytesBase64Encoded;

    if (!imageBase64) {
      return {
        success: false,
        error: { code: 500, message: "No image data in response", details: data },
        duration,
        apiCallId,
      };
    }

    // Save image
    const timestamp = Date.now();
    const outputFilename = `${filename}_${timestamp}.png`;
    const outputPath = join(process.cwd(), "image-generator", "output", outputFilename);
    const imageBuffer = Buffer.from(imageBase64, "base64");
    await writeFile(outputPath, imageBuffer);

    return { success: true, imageBase64, imagePath: outputPath, duration, apiCallId };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      error: { code: 500, message: error.message, details: error },
      duration,
      apiCallId,
    };
  }
}

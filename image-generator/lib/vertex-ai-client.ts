import { GoogleAuth } from "google-auth-library";
import { v4 as uuidv4 } from "uuid";
import { writeFile } from "fs/promises";
import { join } from "path";

// Rate limiter using token bucket algorithm
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second

  constructor(requestsPerMinute: number) {
    this.maxTokens = requestsPerMinute;
    this.tokens = requestsPerMinute;
    this.lastRefill = Date.now();
    this.refillRate = requestsPerMinute / 60; // Convert RPM to tokens per second
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = timePassed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  async acquire(): Promise<void> {
    this.refill();
    
    while (this.tokens < 1) {
      // Wait until we have a token
      const timeToWait = (1 - this.tokens) / this.refillRate * 1000;
      await new Promise(resolve => setTimeout(resolve, timeToWait));
      this.refill();
    }
    
    this.tokens -= 1;
  }
}

// Singleton rate limiter
let rateLimiter: RateLimiter | null = null;

function getRateLimiter(): RateLimiter {
  if (!rateLimiter) {
    const rpm = parseInt(process.env.IMAGEN_RPM_LIMIT || "5");
    rateLimiter = new RateLimiter(rpm);
  }
  return rateLimiter;
}

// Types
export interface ImageGenerationParams {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  addWatermark?: boolean;
  safetySetting?: "block_none" | "block_few" | "block_some" | "block_medium_and_above";
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

// Vertex AI Imagen client
export class VertexAIImagenClient {
  private auth: GoogleAuth;
  private project: string;
  private location: string;
  private model: string;

  constructor() {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!project) {
      throw new Error("GOOGLE_CLOUD_PROJECT environment variable is required");
    }

    if (!credentialsPath) {
      throw new Error("GOOGLE_APPLICATION_CREDENTIALS environment variable is required");
    }

    this.project = project;
    this.location = location;
    this.model = process.env.IMAGEN_MODEL || "imagen-4.0-generate-001";

    this.auth = new GoogleAuth({
      keyFilename: credentialsPath,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
  }

  async generateImage(
    params: ImageGenerationParams,
    filename: string
  ): Promise<ImageGenerationResult> {
    const apiCallId = uuidv4();
    const startTime = Date.now();

    try {
      // Acquire rate limit token
      await getRateLimiter().acquire();

      // Get access token
      const client = await this.auth.getClient();
      const tokenResponse = await client.getAccessToken();
      const token = tokenResponse.token;

      if (!token) {
        throw new Error("Failed to get access token");
      }

      // Build endpoint URL
      const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.project}/locations/${this.location}/publishers/google/models/${this.model}:predict`;

      // Build request body
      const aspectRatio = params.aspectRatio || process.env.IMAGEN_ASPECT_RATIO || "1:1";
      const body = {
        instances: [
          {
            prompt: params.prompt,
          },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: aspectRatio,
          addWatermark: params.addWatermark ?? false,
          safetySetting: params.safetySetting || "block_medium_and_above",
          outputOptions: {
            mimeType: "image/png",
          },
        },
      };

      // Make API call
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        return {
          success: false,
          error: {
            code: response.status,
            message: errorData.error?.message || errorData.message || "Unknown error",
            details: errorData,
          },
          duration,
          apiCallId,
        };
      }

      const data = await response.json();

      // Extract base64 image from response
      const prediction = data.predictions?.[0];
      if (!prediction || !prediction.bytesBase64Encoded) {
        return {
          success: false,
          error: {
            code: 500,
            message: "No image data in response",
            details: data,
          },
          duration,
          apiCallId,
        };
      }

      const imageBase64 = prediction.bytesBase64Encoded;

      // Save image to output folder
      const timestamp = Date.now();
      const outputFilename = `${filename}_${timestamp}.png`;
      const outputPath = join(process.cwd(), "image-generator", "output", outputFilename);

      // Convert base64 to buffer and save
      const imageBuffer = Buffer.from(imageBase64, "base64");
      await writeFile(outputPath, imageBuffer);

      return {
        success: true,
        imageBase64,
        imagePath: outputPath,
        duration,
        apiCallId,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: {
          code: 500,
          message: error.message || "Unknown error",
          details: error,
        },
        duration,
        apiCallId,
      };
    }
  }

  async generateImageWithRetry(
    params: ImageGenerationParams,
    filename: string,
    maxRetries: number = 3
  ): Promise<ImageGenerationResult> {
    let lastResult: ImageGenerationResult | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      lastResult = await this.generateImage(params, filename);

      if (lastResult.success) {
        return lastResult;
      }

      // Don't retry on auth errors or client errors (except 429)
      if (lastResult.error) {
        const code = lastResult.error.code;
        if (code === 401 || code === 403 || (code >= 400 && code < 500 && code !== 429)) {
          return lastResult;
        }
      }

      // Exponential backoff for retries
      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${backoffMs}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }

    return lastResult!;
  }
}

// Singleton instance
let clientInstance: VertexAIImagenClient | null = null;

export function getVertexAIClient(): VertexAIImagenClient {
  if (!clientInstance) {
    clientInstance = new VertexAIImagenClient();
  }
  return clientInstance;
}

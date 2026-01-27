/**
 * Model Pricing and Cost Calculation Utilities
 * 
 * Provides pricing data, token estimation, and cost calculation
 * for various AI models used in the platform.
 */

export interface ModelPricing {
  inputCostPer1k: number;
  outputCostPer1k: number;
  currency: string;
}

export interface ModelMetadata {
  name: string;
  displayName: string;
  provider: string;
  pricing: ModelPricing;
  capabilities: {
    streaming?: boolean;
    structuredOutput?: boolean;
    vision?: boolean;
    functionCalling?: boolean;
  };
  performance: {
    speedTier: "fastest" | "fast" | "balanced" | "slow" | "reasoning";
    qualityTier: "highest" | "high" | "good" | "standard";
    contextWindow: number;
    maxOutputTokens: number;
  };
  description: string;
  bestFor: string[];
}

export interface ImageModelMetadata {
  name: string;
  displayName: string;
  provider: string;
  costPerImage: number;
  currency: string;
  performance: {
    speedTier: "fastest" | "fast" | "balanced" | "slow";
    qualityTier: "highest" | "high" | "good" | "standard";
    maxResolution: string;
  };
  description: string;
  aspectRatios: string[];
}

/**
 * OpenAI Model Pricing (as of January 2026)
 * Prices per 1,000 tokens
 */
export const OPENAI_MODELS: Record<string, ModelMetadata> = {
  "gpt-4o": {
    name: "gpt-4o",
    displayName: "GPT-4o",
    provider: "OpenAI",
    pricing: {
      inputCostPer1k: 0.0025,
      outputCostPer1k: 0.01,
      currency: "USD",
    },
    capabilities: {
      streaming: true,
      structuredOutput: true,
      vision: true,
      functionCalling: true,
    },
    performance: {
      speedTier: "fast",
      qualityTier: "highest",
      contextWindow: 128000,
      maxOutputTokens: 16384,
    },
    description: "Most capable model with vision, streaming, and structured output",
    bestFor: ["Complex reasoning", "Vision tasks", "Structured extraction", "Long context"],
  },
  "gpt-4o-mini": {
    name: "gpt-4o-mini",
    displayName: "GPT-4o Mini",
    provider: "OpenAI",
    pricing: {
      inputCostPer1k: 0.00015,
      outputCostPer1k: 0.0006,
      currency: "USD",
    },
    capabilities: {
      streaming: true,
      structuredOutput: true,
      vision: true,
      functionCalling: true,
    },
    performance: {
      speedTier: "fastest",
      qualityTier: "high",
      contextWindow: 128000,
      maxOutputTokens: 16384,
    },
    description: "Fast and economical model with all capabilities",
    bestFor: ["High-volume tasks", "Cost optimization", "Quick responses", "Simple extraction"],
  },
  "o1-preview": {
    name: "o1-preview",
    displayName: "o1 Preview",
    provider: "OpenAI",
    pricing: {
      inputCostPer1k: 0.015,
      outputCostPer1k: 0.06,
      currency: "USD",
    },
    capabilities: {
      streaming: false,
      structuredOutput: false,
      vision: false,
      functionCalling: false,
    },
    performance: {
      speedTier: "reasoning",
      qualityTier: "highest",
      contextWindow: 128000,
      maxOutputTokens: 32768,
    },
    description: "Advanced reasoning model for complex problem-solving",
    bestFor: ["Complex planning", "Multi-step reasoning", "Strategic decisions"],
  },
  "o1-mini": {
    name: "o1-mini",
    displayName: "o1 Mini",
    provider: "OpenAI",
    pricing: {
      inputCostPer1k: 0.003,
      outputCostPer1k: 0.012,
      currency: "USD",
    },
    capabilities: {
      streaming: false,
      structuredOutput: false,
      vision: false,
      functionCalling: false,
    },
    performance: {
      speedTier: "reasoning",
      qualityTier: "high",
      contextWindow: 128000,
      maxOutputTokens: 65536,
    },
    description: "Faster reasoning model for coding and STEM tasks",
    bestFor: ["Code generation", "Math problems", "Logical reasoning", "Cost-effective reasoning"],
  },
  "gpt-4-turbo": {
    name: "gpt-4-turbo",
    displayName: "GPT-4 Turbo",
    provider: "OpenAI",
    pricing: {
      inputCostPer1k: 0.01,
      outputCostPer1k: 0.03,
      currency: "USD",
    },
    capabilities: {
      streaming: true,
      structuredOutput: true,
      vision: true,
      functionCalling: true,
    },
    performance: {
      speedTier: "balanced",
      qualityTier: "highest",
      contextWindow: 128000,
      maxOutputTokens: 4096,
    },
    description: "Previous generation flagship model",
    bestFor: ["Legacy compatibility", "Proven reliability"],
  },
};

/**
 * Google Vertex AI Imagen Pricing
 */
export const IMAGEN_MODELS: Record<string, ImageModelMetadata> = {
  "gemini-3-pro-image-preview": {
    name: "gemini-3-pro-image-preview",
    displayName: "Gemini 3 Pro Image (Preview)",
    provider: "Google Vertex AI",
    costPerImage: 0.05,
    currency: "USD",
    performance: {
      speedTier: "balanced",
      qualityTier: "highest",
      maxResolution: "4096x4096",
    },
    description: "Excellent text rendering, advanced reasoning, multi-turn editing support",
    aspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "4:5", "5:4", "9:16", "16:9", "21:9"],
  },
  "imagen-4.0-generate-001": {
    name: "imagen-4.0-generate-001",
    displayName: "Imagen 4.0",
    provider: "Google Vertex AI",
    costPerImage: 0.04,
    currency: "USD",
    performance: {
      speedTier: "balanced",
      qualityTier: "highest",
      maxResolution: "2048x2048",
    },
    description: "Latest generation with highest quality and detail",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
  },
  "imagen-3.0-generate-001": {
    name: "imagen-3.0-generate-001",
    displayName: "Imagen 3.0",
    provider: "Google Vertex AI",
    costPerImage: 0.02,
    currency: "USD",
    performance: {
      speedTier: "fast",
      qualityTier: "high",
      maxResolution: "1536x1536",
    },
    description: "Previous generation with good quality and faster generation",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
  },
  "imagegeneration@006": {
    name: "imagegeneration@006",
    displayName: "Imagen 2.0",
    provider: "Google Vertex AI",
    costPerImage: 0.01,
    currency: "USD",
    performance: {
      speedTier: "fastest",
      qualityTier: "good",
      maxResolution: "1024x1024",
    },
    description: "Fastest and most economical option",
    aspectRatios: ["1:1", "16:9", "9:16"],
  },
};

/**
 * Estimate token count from text
 * Rough approximation: ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // More accurate estimation considering spaces and punctuation
  const chars = text.length;
  const words = text.split(/\s+/).length;
  // Average: 1 token ≈ 0.75 words or 4 characters
  return Math.ceil(Math.max(chars / 4, words / 0.75));
}

/**
 * Calculate cost for text generation
 */
export interface CostBreakdown {
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
  model: string;
}

export function calculateTextCost(
  inputText: string,
  outputText: string,
  modelName: string
): CostBreakdown {
  const model = OPENAI_MODELS[modelName];
  if (!model) {
    throw new Error(`Unknown model: ${modelName}`);
  }

  const inputTokens = estimateTokens(inputText);
  const outputTokens = estimateTokens(outputText);

  const inputCost = (inputTokens / 1000) * model.pricing.inputCostPer1k;
  const outputCost = (outputTokens / 1000) * model.pricing.outputCostPer1k;
  const totalCost = inputCost + outputCost;

  return {
    inputTokens,
    outputTokens,
    inputCost,
    outputCost,
    totalCost,
    currency: model.pricing.currency,
    model: model.displayName,
  };
}

/**
 * Estimate cost before making API call
 */
export function estimateCost(
  inputText: string,
  estimatedOutputTokens: number,
  modelName: string
): CostBreakdown {
  const model = OPENAI_MODELS[modelName];
  if (!model) {
    throw new Error(`Unknown model: ${modelName}`);
  }

  const inputTokens = estimateTokens(inputText);
  const outputTokens = estimatedOutputTokens;

  const inputCost = (inputTokens / 1000) * model.pricing.inputCostPer1k;
  const outputCost = (outputTokens / 1000) * model.pricing.outputCostPer1k;
  const totalCost = inputCost + outputCost;

  return {
    inputTokens,
    outputTokens,
    inputCost,
    outputCost,
    totalCost,
    currency: model.pricing.currency,
    model: model.displayName,
  };
}

/**
 * Calculate image generation cost
 */
export interface ImageCostBreakdown {
  imageCount: number;
  costPerImage: number;
  totalCost: number;
  currency: string;
  model: string;
}

export function calculateImageCost(
  imageCount: number,
  modelName: string
): ImageCostBreakdown {
  const model = IMAGEN_MODELS[modelName];
  if (!model) {
    throw new Error(`Unknown image model: ${modelName}`);
  }

  const totalCost = imageCount * model.costPerImage;

  return {
    imageCount,
    costPerImage: model.costPerImage,
    totalCost,
    currency: model.currency,
    model: model.displayName,
  };
}

/**
 * Format cost for display
 */
export function formatCost(cost: number, currency: string = "USD"): string {
  if (cost < 0.01) {
    return `<$0.01`;
  }
  return `$${cost.toFixed(cost < 1 ? 3 : 2)}`;
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens} tokens`;
  }
  return `${(tokens / 1000).toFixed(1)}K tokens`;
}

/**
 * Get model by name
 */
export function getModelMetadata(modelName: string): ModelMetadata | undefined {
  return OPENAI_MODELS[modelName];
}

/**
 * Get image model by name
 */
export function getImageModelMetadata(modelName: string): ImageModelMetadata | undefined {
  return IMAGEN_MODELS[modelName];
}

/**
 * Get all available text models
 */
export function getAllTextModels(): ModelMetadata[] {
  return Object.values(OPENAI_MODELS);
}

/**
 * Get all available image models
 */
export function getAllImageModels(): ImageModelMetadata[] {
  return Object.values(IMAGEN_MODELS);
}

/**
 * Filter models by capability
 */
export function getModelsByCapability(
  capability: keyof ModelMetadata["capabilities"]
): ModelMetadata[] {
  return Object.values(OPENAI_MODELS).filter(
    (model) => model.capabilities[capability] === true
  );
}

/**
 * Get recommended model for task
 */
export function getRecommendedModel(
  task: "chat" | "structured" | "vision" | "reasoning" | "cost-effective"
): string {
  switch (task) {
    case "chat":
      return "gpt-4o";
    case "structured":
      return "gpt-4o";
    case "vision":
      return "gpt-4o";
    case "reasoning":
      return "o1-preview";
    case "cost-effective":
      return "gpt-4o-mini";
    default:
      return "gpt-4o";
  }
}

/**
 * Estimate generation time based on model and tokens
 */
export function estimateGenerationTime(
  outputTokens: number,
  modelName: string
): number {
  const model = OPENAI_MODELS[modelName];
  if (!model) return 0;

  // Rough estimates in seconds
  const tokensPerSecond: Record<string, number> = {
    "gpt-4o": 100,
    "gpt-4o-mini": 150,
    "o1-preview": 30,
    "o1-mini": 50,
    "gpt-4-turbo": 80,
  };

  const speed = tokensPerSecond[modelName] || 100;
  return Math.ceil(outputTokens / speed);
}

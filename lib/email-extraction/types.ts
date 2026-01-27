/**
 * Core types for the plugin-based email extraction system
 */

import { z } from "zod";

/** Context passed to all extraction plugins */
export interface ExtractionContext {
  /** The email text to extract from */
  emailText: string;
  
  /** Length of the email text */
  emailLength: number;
  
  /** Detected patterns in the email (for plugin activation) */
  detectedPatterns: string[];
  
  /** Extensible metadata for experiments, feature flags, etc. */
  metadata?: Record<string, any>;
}

/** An extraction plugin for a specific reservation type */
export interface ExtractionPlugin {
  /** Unique identifier for this plugin */
  id: string;
  
  /** Human-readable name for logging */
  name: string;
  
  /** The prompt content to include */
  content: string;
  
  /** The Zod schema for this extraction type */
  schema: z.ZodSchema;
  
  /** Priority (lower = earlier in final prompt). Base is always 0 */
  priority?: number;
  
  /** Whether to include this plugin given the context */
  shouldInclude: (context: ExtractionContext) => boolean;
  
  /** Optional: Transform context before passing to next plugins */
  transformContext?: (context: ExtractionContext) => ExtractionContext;
}

/** Registry of all available extraction plugins */
export type ExtractionRegistry = Map<string, ExtractionPlugin>;

/** Result of building an extraction prompt */
export interface BuildExtractionResult {
  /** The complete assembled prompt */
  prompt: string;
  
  /** The schema to use for extraction */
  schema: z.ZodSchema;
  
  /** The type of extraction (plugin id) */
  extractionType: string;
  
  /** Names of active plugins that were included */
  activePlugins: string[];
  
  /** Statistics about the prompt */
  stats: {
    /** Total character length of the prompt */
    totalLength: number;
    /** Number of plugins included (including base) */
    pluginCount: number;
  };
}

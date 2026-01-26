/**
 * Core types for the plugin-based prompt system
 */

/** Context passed to all prompt plugins */
export interface PromptBuildContext {
  /** The conversation ID if this is part of an ongoing conversation */
  conversationId?: string;
  
  /** The type of focused entity (TRIP/SEGMENT/RESERVATION) if any */
  chatType?: 'TRIP' | 'SEGMENT' | 'RESERVATION';
  
  /** Number of messages in the conversation so far */
  messageCount?: number;
  
  /** The current user message being processed */
  userMessage: string;
  
  /** Whether the conversation has an existing trip associated */
  hasExistingTrip?: boolean;
  
  /** Full trip context data if available */
  tripData?: any;
  
  /** Extensible metadata for experiments, feature flags, user settings, etc. */
  metadata?: Record<string, any>;
}

/** A helper prompt plugin */
export interface PromptPlugin {
  /** Unique identifier for this plugin */
  id: string;
  
  /** Human-readable name for logging */
  name: string;
  
  /** The prompt content to include */
  content: string;
  
  /** Priority (lower = earlier in final prompt). Base is always 0 */
  priority?: number;
  
  /** Whether to include this prompt given the context */
  shouldInclude: (context: PromptBuildContext) => boolean;
  
  /** Optional: Transform context before passing to next plugins */
  transformContext?: (context: PromptBuildContext) => PromptBuildContext;
}

/** Registry of all available prompt plugins */
export type PromptRegistry = Map<string, PromptPlugin>;

/**
 * Configuration types for object-based chat system
 * Defines how each object type behaves
 */

import { ComponentType } from "react";

/**
 * Data source configuration
 */
export interface DataSourceConfig {
  /**
   * Fetch initial data for the right panel
   */
  fetch: (userId: string, params?: Record<string, any>) => Promise<any>;

  /**
   * Optional: Subscribe to real-time updates
   */
  subscribe?: (userId: string, params?: Record<string, any>) => {
    unsubscribe: () => void;
  };
}

/**
 * Left panel (chat) configuration
 */
export interface LeftPanelConfig {
  /**
   * Header configuration for left panel
   */
  header?: {
    icon?: string; // Lucide icon name (e.g., "MessageCircle", "BookOpen")
    title: string;
    subtitle?: string;
  };

  /**
   * Welcome message shown when chat starts
   */
  welcomeMessage?: string;

  /**
   * Placeholder text for input field
   */
  placeholder?: string;

  /**
   * Card renderers: card type -> React component
   * Example: { hotel: HotelCard, restaurant: RestaurantCard }
   */
  cardRenderers: Record<string, ComponentType<any>>;
}

/**
 * Right panel (data view) configuration
 */
export interface RightPanelConfig {
  /**
   * Header configuration for right panel
   */
  header?: {
    icon?: string; // Lucide icon name
    title: string;
    subtitle?: string;
  };

  /**
   * Multiple view templates for the right panel
   * NEW: Supports switching between different visualizations
   */
  views?: Array<{
    id: string;                    // e.g., "chips", "table"
    name: string;                  // e.g., "Chips", "Table"
    icon: string;                  // Lucide icon name
    component: ComponentType<any>;
  }>;

  /**
   * Main view component for displaying data
   * DEPRECATED: Use views[] instead for multiple view support
   * Kept for backward compatibility
   */
  component?: ComponentType<any>;

  /**
   * Optional: Component to show when no data
   */
  emptyState?: ComponentType;
}

/**
 * Process executor for orchestrator pattern
 */
export interface ProcessExecutor {
  /**
   * Execute a process step
   */
  execute: (input: any, context: any) => Promise<any>;

  /**
   * Validate process input
   */
  validate?: (input: any) => boolean;
}

/**
 * Card style configuration
 */
export interface CardStyleConfig {
  /**
   * Default card style: "chip" | "button" | "card"
   */
  defaultStyle?: "chip" | "button" | "card";
  
  /**
   * Per-card-type style overrides
   */
  styleOverrides?: Record<string, "chip" | "button" | "card">;
}

/**
 * Auto-action configuration
 */
export interface AutoActionConfig {
  /**
   * Card types that trigger automatic actions
   * Example: ["auto_add", "quick_action"]
   */
  autoActionCards?: string[];
  
  /**
   * Handler function for auto-actions
   * Called when auto-action cards are created
   * 
   * @param cards - Array of cards to process
   * @param onDataUpdate - Callback to update UI state with new data
   */
  onAutoAction?: (
    cards: Array<{ type: string; data: any }>,
    onDataUpdate?: (data: { graphData?: any; xmlData?: string }) => void
  ) => Promise<void>;
}

/**
 * Complete object configuration
 */
export interface ObjectConfig {
  /**
   * Unique identifier (used in URL)
   */
  id: string;

  /**
   * Display name
   */
  name: string;

  /**
   * Description
   */
  description: string;

  /**
   * AI system prompt
   */
  systemPrompt: string;

  /**
   * Optional: Variables to inject into prompt
   * Example: { userProfile: "..." }
   */
  promptVariables?: Record<string, string>;

  /**
   * Data source configuration
   */
  dataSource: DataSourceConfig;

  /**
   * Left panel configuration
   */
  leftPanel: LeftPanelConfig;

  /**
   * Right panel configuration
   */
  rightPanel: RightPanelConfig;

  /**
   * Optional: Process executors for orchestrator
   */
  processes?: Record<string, ProcessExecutor>;

  /**
   * Optional: Custom metadata
   */
  metadata?: Record<string, any>;

  /**
   * Optional: Card styling configuration
   */
  cardStyle?: CardStyleConfig;
  
  /**
   * Optional: Auto-action configuration
   */
  autoActions?: AutoActionConfig;
  
  /**
   * Optional: Helper functions for data processing
   */
  helpers?: {
    /**
     * Category processor for auto-categorizing items
     */
    categoryProcessor?: any; // ProcessorConfig from category-processor
    
    /**
     * Transform item before saving
     * @param item - Raw item from AI
     * @returns Transformed item
     */
    transformItem?: (item: {
      value: string;
      category?: string;
      subcategory?: string;
    }) => {
      value: string;
      category: string;
      subcategory: string;
      metadata?: Record<string, any>;
    };
    
    /**
     * Validate item before saving
     * @param item - Item to validate
     * @returns true if valid, error message if invalid
     */
    validateItem?: (item: {
      value: string;
      category: string;
      subcategory: string;
    }) => true | string;
    
    /**
     * Normalize value (trim, capitalize, etc.)
     */
    normalizeValue?: (value: string) => string;
  };
}

/**
 * Config registry type
 */
export type ConfigRegistry = Record<string, ObjectConfig>;

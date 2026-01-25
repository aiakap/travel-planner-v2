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
   * Main view component for displaying data
   */
  component: ComponentType<any>;

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
}

/**
 * Config registry type
 */
export type ConfigRegistry = Record<string, ObjectConfig>;

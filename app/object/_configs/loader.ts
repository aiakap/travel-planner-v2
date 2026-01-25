/**
 * Configuration loader
 * Loads and validates object configurations
 */

import { ObjectConfig, ConfigRegistry } from "./types";

/**
 * Registry of all available configs
 * Import configs here as they're created
 */
const configRegistry: ConfigRegistry = {};

/**
 * Register a config
 */
export function registerConfig(config: ObjectConfig) {
  configRegistry[config.id] = config;
}

/**
 * Load a config by ID
 */
export function loadConfig(objectType: string): ObjectConfig | null {
  return configRegistry[objectType] || null;
}

/**
 * Get all available configs
 */
export function getAllConfigs(): ObjectConfig[] {
  return Object.values(configRegistry);
}

/**
 * Check if a config exists
 */
export function hasConfig(objectType: string): boolean {
  return objectType in configRegistry;
}

/**
 * Validate a config
 */
export function validateConfig(config: ObjectConfig): boolean {
  if (!config.id || typeof config.id !== "string") {
    console.error("Config missing or invalid id");
    return false;
  }

  if (!config.name || typeof config.name !== "string") {
    console.error("Config missing or invalid name");
    return false;
  }

  if (!config.systemPrompt || typeof config.systemPrompt !== "string") {
    console.error("Config missing or invalid systemPrompt");
    return false;
  }

  if (!config.dataSource || typeof config.dataSource.fetch !== "function") {
    console.error("Config missing or invalid dataSource.fetch");
    return false;
  }

  if (!config.leftPanel || typeof config.leftPanel.cardRenderers !== "object") {
    console.error("Config missing or invalid leftPanel.cardRenderers");
    return false;
  }

  if (!config.rightPanel || !config.rightPanel.component) {
    console.error("Config missing or invalid rightPanel.component");
    return false;
  }

  return true;
}

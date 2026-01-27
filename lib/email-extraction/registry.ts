/**
 * Plugin Registry - Central registration of all extraction plugins
 * 
 * This file defines all built-in plugins and provides functions
 * for managing the plugin registry.
 */

import { ExtractionPlugin, ExtractionRegistry } from './types';
import { hotelExtractionPlugin } from './plugins/hotel-extraction-plugin';
import { flightExtractionPlugin } from './plugins/flight-extraction-plugin';
import { carRentalExtractionPlugin } from './plugins/car-rental-extraction-plugin';

/** Helper to register a plugin */
function registerPlugin(registry: ExtractionRegistry, plugin: ExtractionPlugin): void {
  if (registry.has(plugin.id)) {
    console.warn(`[ExtractionRegistry] Plugin ${plugin.id} already registered, overwriting`);
  }
  registry.set(plugin.id, plugin);
}

/** Create the default extraction registry */
export function createExtractionRegistry(): ExtractionRegistry {
  const registry = new Map<string, ExtractionPlugin>();
  
  // Register all built-in plugins
  registerPlugin(registry, hotelExtractionPlugin);
  registerPlugin(registry, flightExtractionPlugin);
  registerPlugin(registry, carRentalExtractionPlugin);
  
  return registry;
}

/** Add a plugin to the registry */
export function addPlugin(registry: ExtractionRegistry, plugin: ExtractionPlugin): void {
  registerPlugin(registry, plugin);
}

/** Remove a plugin from the registry */
export function removePlugin(registry: ExtractionRegistry, pluginId: string): boolean {
  return registry.delete(pluginId);
}

/** Check if a plugin exists in the registry */
export function hasPlugin(registry: ExtractionRegistry, pluginId: string): boolean {
  return registry.has(pluginId);
}

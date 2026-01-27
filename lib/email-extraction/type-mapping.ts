/**
 * Shared Type Mapping Utility
 * 
 * Centralizes the mapping between database reservation types and extraction handlers/plugins.
 * Both detection API and email-extract API should use this to ensure consistency.
 * 
 * This replaces the hardcoded mappings that were causing sync issues between APIs.
 */

import { prisma } from "@/lib/prisma";

export interface HandlerInfo {
  dbTypeName: string;      // Database type name (e.g., "Private Driver")
  category: string;         // Database category (e.g., "Travel")
  handler: string;          // Handler/plugin family (e.g., "car-rental")
  pluginId: string;         // Extraction plugin ID (e.g., "car-rental-extraction")
}

// Cache for database reservation types
let TYPE_MAPPING_CACHE: Map<string, HandlerInfo> | null = null;
let CACHE_TIMESTAMP: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Map database type name and category to extraction handler
 * 
 * This is the single source of truth for type → handler mapping.
 * Updates here automatically propagate to both detection and extraction APIs.
 * 
 * NEW APPROACH: 1:1 mapping for type-specific handlers
 * For types with dedicated handlers, we use kebab-case of the type name.
 * This allows each type to have its own schema, plugin, and business logic.
 */
function mapTypeToHandler(typeName: string, categoryName: string): string {
  // Travel category mappings
  if (categoryName === "Travel") {
    // Types with dedicated handlers (1:1 mapping)
    if (typeName === "Flight") return "flight";
    if (typeName === "Train") return "train";
    if (typeName === "Cruise") return "cruise";
    if (typeName === "Car Rental") return "car-rental";
    if (typeName === "Private Driver") return "private-driver"; // NEW: Dedicated handler
    if (typeName === "Ride Share") return "ride-share"; // NEW: Dedicated handler (future)
    if (typeName === "Taxi") return "taxi"; // NEW: Dedicated handler (future)
    
    // Types that still share handlers (for now)
    if (typeName === "Bus") return "train"; // Bus uses train extraction
    if (typeName === "Ferry") return "cruise"; // Ferry uses cruise extraction
    if (typeName === "Parking") return "generic"; // Parking uses generic
  }

  // Stay category
  if (categoryName === "Stay") {
    // Types with dedicated handlers (future expansion)
    if (typeName === "Hotel") return "hotel";
    // TODO: Add dedicated handlers for Airbnb, Hostel, Resort, etc.
    // For now, all stay types use hotel extraction
    return "hotel";
  }

  // Activity category
  if (categoryName === "Activity") {
    // Types with dedicated handlers
    if (typeName === "Event Tickets") return "event";
    // TODO: Add dedicated handlers for Tour, Museum, Concert, etc.
    
    // These use generic extraction
    if (["Equipment Rental", "Spa & Wellness"].includes(typeName)) {
      return "generic";
    }
    // Everything else uses event extraction (for now)
    return "event";
  }

  // Dining category
  if (categoryName === "Dining") {
    // Types with dedicated handlers
    if (typeName === "Restaurant") return "restaurant";
    // TODO: Add dedicated handlers for Cafe, Bar, Food Tour
    // For now, all dining types use restaurant extraction
    return "restaurant";
  }

  // Default fallback
  return "generic";
}

/**
 * Map handler name to plugin ID
 * 
 * NEW APPROACH: Use simple pattern for 1:1 mapping
 * handler-name → handler-name-extraction
 * This makes it easy to add new handlers without updating this mapping.
 */
function handlerToPluginId(handler: string): string {
  // Special case: generic uses different naming
  if (handler === 'generic') {
    return 'generic-reservation';
  }
  
  // Standard pattern: handler-name → handler-name-extraction
  // e.g., "private-driver" → "private-driver-extraction"
  return `${handler}-extraction`;
}

/**
 * Load and cache reservation types from database
 * 
 * Returns a map of: dbTypeName (lowercase) → HandlerInfo
 * This allows both APIs to look up handler info by database type name.
 */
export async function getTypeMapping(): Promise<Map<string, HandlerInfo>> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (TYPE_MAPPING_CACHE && (now - CACHE_TIMESTAMP) < CACHE_TTL) {
    return TYPE_MAPPING_CACHE;
  }

  try {
    console.log('[TypeMapping] Loading reservation types from database...');
    
    const types = await prisma.reservationType.findMany({
      include: { category: true }
    });

    TYPE_MAPPING_CACHE = new Map(
      types.map(t => {
        const handler = mapTypeToHandler(t.name, t.category.name);
        const pluginId = handlerToPluginId(handler);
        
        return [
          t.name.toLowerCase(), // Key: lowercase type name for easy lookup
          {
            dbTypeName: t.name,
            category: t.category.name,
            handler,
            pluginId
          }
        ];
      })
    );

    CACHE_TIMESTAMP = now;
    console.log(`[TypeMapping] ✅ Loaded ${types.length} reservation types from database`);
    console.log(`[TypeMapping] Sample mappings:`);
    
    // Log some examples for debugging
    const examples = ['private driver', 'car rental', 'ride share', 'taxi', 'flight'];
    examples.forEach(ex => {
      const info = TYPE_MAPPING_CACHE?.get(ex);
      if (info) {
        console.log(`[TypeMapping]   "${info.dbTypeName}" (${info.category}) → ${info.handler} → ${info.pluginId}`);
      }
    });

    return TYPE_MAPPING_CACHE;
  } catch (error) {
    console.error('[TypeMapping] ❌ Failed to load reservation types from database:', error);
    // Return empty map as fallback
    return new Map();
  }
}

/**
 * Get handler info for a specific database type name
 * 
 * @param typeName - Database type name (e.g., "Private Driver", "Flight")
 * @returns Handler info or undefined if not found
 */
export async function getHandlerForType(typeName: string): Promise<HandlerInfo | undefined> {
  const mapping = await getTypeMapping();
  return mapping.get(typeName.toLowerCase());
}

/**
 * Clear the cache (useful for testing or after database updates)
 */
export function clearTypeMapping(): void {
  TYPE_MAPPING_CACHE = null;
  CACHE_TIMESTAMP = 0;
  console.log('[TypeMapping] Cache cleared');
}

/**
 * Get all available handlers
 * 
 * Returns a set of unique handler names used across all reservation types
 */
export async function getAllHandlers(): Promise<Set<string>> {
  const mapping = await getTypeMapping();
  const handlers = new Set<string>();
  
  for (const [_, info] of mapping) {
    handlers.add(info.handler);
  }
  
  return handlers;
}

/**
 * Get all types that use a specific handler
 * 
 * @param handler - Handler name (e.g., "car-rental")
 * @returns Array of HandlerInfo objects
 */
export async function getTypesForHandler(handler: string): Promise<HandlerInfo[]> {
  const mapping = await getTypeMapping();
  const types: HandlerInfo[] = [];
  
  for (const [_, info] of mapping) {
    if (info.handler === handler) {
      types.push(info);
    }
  }
  
  return types;
}

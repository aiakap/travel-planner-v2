/**
 * Cached Reservation Type & Status Lookups
 * 
 * Provides in-memory caching for reservation types and statuses to avoid
 * repeated database queries. The cache is populated on first access and
 * persists for the lifetime of the server process.
 */

import { prisma } from "@/lib/prisma";

// In-memory cache
let typesCache: Map<string, { id: string; name: string; categoryId: string; categoryName: string }> | null = null;
let statusesCache: Map<string, { id: string; name: string }> | null = null;

/**
 * Load all reservation types into memory (called once per server process)
 */
async function loadTypes() {
  if (typesCache) return;
  
  console.log("📦 Loading reservation types into cache...");
  
  const types = await prisma.reservationType.findMany({
    include: { category: true }
  });
  
  typesCache = new Map();
  types.forEach(type => {
    const key = `${type.category.name}:${type.name}`;
    typesCache!.set(key, {
      id: type.id,
      name: type.name,
      categoryId: type.categoryId,
      categoryName: type.category.name
    });
  });
  
  console.log(`✅ Loaded ${types.length} reservation types into cache`);
}

/**
 * Load all statuses into memory (called once per server process)
 */
async function loadStatuses() {
  if (statusesCache) return;
  
  console.log("📦 Loading reservation statuses into cache...");
  
  const statuses = await prisma.reservationStatus.findMany();
  statusesCache = new Map(statuses.map(s => [s.name, { id: s.id, name: s.name }]));
  
  console.log(`✅ Loaded ${statuses.length} reservation statuses into cache`);
}

/**
 * Get reservation type by category and name (cached)
 * 
 * @param category - Category name (e.g., "Transportation", "Stay", "Activity", "Dining")
 * @param typeName - Type name (e.g., "Flight", "Hotel", "Tour")
 * @returns Cached reservation type with id, name, categoryId, categoryName
 * @throws Error if type not found (with helpful message listing available types)
 * 
 * @example
 * const flightType = await getReservationType("Travel", "Flight");
 * // Returns: { id: "...", name: "Flight", categoryId: "...", categoryName: "Travel" }
 */
export async function getReservationType(category: string, typeName: string) {
  await loadTypes();
  
  const key = `${category}:${typeName}`;
  const type = typesCache!.get(key);
  
  if (!type) {
    const availableTypes = Array.from(typesCache!.keys()).join(', ');
    throw new Error(
      `Reservation type "${typeName}" in category "${category}" not found. ` +
      `Available types: ${availableTypes}. ` +
      `Make sure to run 'npm run db:seed' to populate reservation types.`
    );
  }
  
  return type;
}

/**
 * Get reservation status by name (cached)
 * 
 * @param statusName - Status name (e.g., "Pending", "Confirmed", "Cancelled", "Completed", "Waitlisted")
 * @returns Cached reservation status with id and name
 * @throws Error if status not found (with helpful message listing available statuses)
 * 
 * @example
 * const confirmedStatus = await getReservationStatus("Confirmed");
 * // Returns: { id: "...", name: "Confirmed" }
 */
export async function getReservationStatus(statusName: string) {
  await loadStatuses();
  
  const status = statusesCache!.get(statusName);
  
  if (!status) {
    const availableStatuses = Array.from(statusesCache!.keys()).join(', ');
    throw new Error(
      `Reservation status "${statusName}" not found. ` +
      `Available statuses: ${availableStatuses}. ` +
      `Make sure to run 'npm run db:seed' to populate reservation statuses.`
    );
  }
  
  return status;
}

/**
 * Get all cached reservation types (useful for dropdowns/selects)
 * 
 * @returns Array of all reservation types with their categories
 */
export async function getAllReservationTypes() {
  await loadTypes();
  return Array.from(typesCache!.values());
}

/**
 * Get all cached reservation statuses (useful for dropdowns/selects)
 * 
 * @returns Array of all reservation statuses
 */
export async function getAllReservationStatuses() {
  await loadStatuses();
  return Array.from(statusesCache!.values());
}

/**
 * Clear cache (useful for testing or after migrations)
 * 
 * This forces the cache to reload on next access.
 * In production, you typically don't need to call this as the server
 * restart will naturally clear the cache.
 */
export function clearReservationCache() {
  console.log("🔄 Clearing reservation cache...");
  typesCache = null;
  statusesCache = null;
}

/**
 * Pre-warm cache (optional - call on server startup)
 * 
 * Loads all types and statuses into memory proactively.
 * This is optional since the cache loads automatically on first use.
 * 
 * @example
 * // In your server startup code
 * warmReservationCache().catch(console.error);
 */
export async function warmReservationCache() {
  console.log("🔥 Pre-warming reservation cache...");
  await Promise.all([loadTypes(), loadStatuses()]);
  console.log("✅ Reservation cache pre-warmed successfully");
}

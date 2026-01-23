/**
 * Amadeus API Pagination Helpers
 * 
 * Based on amadeus-node SDK pagination patterns
 * Provides utilities for fetching additional pages of results
 */

import { getAmadeusClient } from '@/lib/flights/amadeus-client';

/**
 * Pagination metadata from Amadeus response
 */
export interface PaginationMeta {
  count?: number;
  links?: {
    self?: string;
    next?: string;
    previous?: string;
    last?: string;
    first?: string;
    up?: string;
  };
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta?: PaginationMeta;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Extract pagination metadata from Amadeus response
 */
export function extractPaginationMeta(response: any): PaginationMeta | undefined {
  return response.result?.meta;
}

/**
 * Check if response has next page
 */
export function hasNextPage(response: any): boolean {
  const meta = extractPaginationMeta(response);
  return Boolean(meta?.links?.next);
}

/**
 * Check if response has previous page
 */
export function hasPreviousPage(response: any): boolean {
  const meta = extractPaginationMeta(response);
  return Boolean(meta?.links?.previous);
}

/**
 * Fetch next page of results
 * Returns null if no next page is available
 */
export async function fetchNextPage<T>(response: any): Promise<PaginatedResponse<T> | null> {
  if (!hasNextPage(response)) {
    return null;
  }

  const amadeus = getAmadeusClient();
  
  try {
    const nextResponse = await amadeus.next(response);
    
    if (!nextResponse) {
      return null;
    }

    return {
      data: nextResponse.data || [],
      meta: extractPaginationMeta(nextResponse),
      hasNext: hasNextPage(nextResponse),
      hasPrevious: hasPreviousPage(nextResponse),
    };
  } catch (error) {
    console.error('Failed to fetch next page:', error);
    throw error;
  }
}

/**
 * Fetch previous page of results
 * Returns null if no previous page is available
 */
export async function fetchPreviousPage<T>(response: any): Promise<PaginatedResponse<T> | null> {
  if (!hasPreviousPage(response)) {
    return null;
  }

  const amadeus = getAmadeusClient();
  
  try {
    const previousResponse = await amadeus.previous(response);
    
    if (!previousResponse) {
      return null;
    }

    return {
      data: previousResponse.data || [],
      meta: extractPaginationMeta(previousResponse),
      hasNext: hasNextPage(previousResponse),
      hasPrevious: hasPreviousPage(previousResponse),
    };
  } catch (error) {
    console.error('Failed to fetch previous page:', error);
    throw error;
  }
}

/**
 * Fetch all pages of results (use with caution - can be expensive)
 * @param initialResponse The first page response
 * @param maxPages Maximum number of pages to fetch (default: 10)
 */
export async function* fetchAllPages<T>(
  initialResponse: any,
  maxPages: number = 10
): AsyncGenerator<T[], void, unknown> {
  yield initialResponse.data || [];

  let currentResponse = initialResponse;
  let pagesFetched = 1;

  while (hasNextPage(currentResponse) && pagesFetched < maxPages) {
    const nextPage = await fetchNextPage<T>(currentResponse);
    
    if (!nextPage) {
      break;
    }

    yield nextPage.data;
    currentResponse = nextPage;
    pagesFetched++;
  }
}

/**
 * Create a paginated response wrapper from an Amadeus response
 */
export function wrapPaginatedResponse<T>(response: any): PaginatedResponse<T> {
  return {
    data: response.data || [],
    meta: extractPaginationMeta(response),
    hasNext: hasNextPage(response),
    hasPrevious: hasPreviousPage(response),
  };
}

/**
 * Helper to get page offset from URL
 * Used for debugging/logging
 */
export function getPageOffset(response: any): number | null {
  const meta = extractPaginationMeta(response);
  const nextUrl = meta?.links?.next;
  
  if (!nextUrl) {
    return null;
  }

  const match = nextUrl.match(/page\[offset\]=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

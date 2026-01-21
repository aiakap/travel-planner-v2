"use server";

import { cookies } from "next/headers";
import { GooglePlaceData, PlaceSuggestion } from "@/lib/types/place-pipeline";

export interface PendingSuggestion {
  placeName: string;
  placeData: GooglePlaceData | null;
  suggestion: PlaceSuggestion;
  timestamp: number;
}

const COOKIE_NAME = "pending_suggestion";
const COOKIE_MAX_AGE = 60 * 60; // 1 hour

/**
 * Save a pending suggestion to cookies for unauthenticated users
 * Returns a suggestion ID that can be used in the callback URL
 */
export async function savePendingSuggestion(data: PendingSuggestion): Promise<string> {
  // Generate a simple ID from timestamp
  const id = `sugg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Store in cookie as JSON
  // Note: For production, consider encryption
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify({ id, data }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  
  return id;
}

/**
 * Retrieve a pending suggestion from cookies
 */
export async function getPendingSuggestion(id?: string): Promise<PendingSuggestion | null> {
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(COOKIE_NAME);
    
    if (!cookieValue?.value) {
      return null;
    }
    
    const { id: storedId, data } = JSON.parse(cookieValue.value);
    
    // If ID provided, verify it matches
    if (id && storedId !== id) {
      return null;
    }
    
    // Check if expired (older than 1 hour)
    const age = Date.now() - data.timestamp;
    if (age > COOKIE_MAX_AGE * 1000) {
      await clearPendingSuggestion();
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error retrieving pending suggestion:", error);
    return null;
  }
}

/**
 * Clear pending suggestion from cookies
 */
export async function clearPendingSuggestion(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Encode suggestion data for URL (alternative to cookies)
 */
export function encodeSuggestion(data: PendingSuggestion): string {
  try {
    const json = JSON.stringify(data);
    return Buffer.from(json).toString("base64url");
  } catch (error) {
    console.error("Error encoding suggestion:", error);
    return "";
  }
}

/**
 * Decode suggestion data from URL
 */
export function decodeSuggestion(encoded: string): PendingSuggestion | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    return JSON.parse(json);
  } catch (error) {
    console.error("Error decoding suggestion:", error);
    return null;
  }
}

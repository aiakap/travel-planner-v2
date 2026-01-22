/**
 * Cookie Management Utilities for Auth Debugging
 * Helps inspect, validate, and clear authentication cookies
 */

import { cookies } from "next/headers";

export interface CookieInfo {
  name: string;
  value: string;
  size: number;
  hasValue: boolean;
  isAuthRelated: boolean;
}

export interface CookieValidation {
  valid: boolean;
  issues: string[];
  cookies: CookieInfo[];
}

/**
 * Get all authentication-related cookies
 */
export async function getAllAuthCookies(): Promise<CookieInfo[]> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  const authCookieNames = [
    "authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "authjs.callback-url",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
    "authjs.csrf-token",
    "next-auth.csrf-token",
    "__Secure-next-auth.csrf-token",
  ];

  return allCookies
    .filter((cookie) => {
      const name = cookie.name.toLowerCase();
      return authCookieNames.some((authName) => name.includes(authName.toLowerCase())) ||
             name.includes("auth") ||
             name.includes("session");
    })
    .map((cookie) => ({
      name: cookie.name,
      value: cookie.value.substring(0, 50) + (cookie.value.length > 50 ? "..." : ""),
      size: cookie.value.length,
      hasValue: !!cookie.value,
      isAuthRelated: true,
    }));
}

/**
 * Validate authentication cookies
 */
export async function validateCookies(): Promise<CookieValidation> {
  const authCookies = await getAllAuthCookies();
  const issues: string[] = [];

  if (authCookies.length === 0) {
    issues.push("No authentication cookies found. User may not be logged in.");
  }

  const sessionCookie = authCookies.find((c) =>
    c.name.toLowerCase().includes("session-token")
  );

  if (!sessionCookie) {
    issues.push("No session token cookie found.");
  } else if (!sessionCookie.hasValue) {
    issues.push("Session token cookie exists but is empty.");
  } else if (sessionCookie.size < 10) {
    issues.push("Session token cookie seems too short. May be corrupted.");
  }

  const csrfCookie = authCookies.find((c) =>
    c.name.toLowerCase().includes("csrf-token")
  );

  if (!csrfCookie) {
    issues.push("No CSRF token cookie found. This may cause authentication issues.");
  }

  return {
    valid: issues.length === 0,
    issues,
    cookies: authCookies,
  };
}

/**
 * Get cookie status summary
 */
export async function getCookieStatus(): Promise<{
  count: number;
  hasSessionToken: boolean;
  hasCsrfToken: boolean;
  cookies: CookieInfo[];
}> {
  const authCookies = await getAllAuthCookies();

  return {
    count: authCookies.length,
    hasSessionToken: authCookies.some((c) =>
      c.name.toLowerCase().includes("session-token")
    ),
    hasCsrfToken: authCookies.some((c) =>
      c.name.toLowerCase().includes("csrf-token")
    ),
    cookies: authCookies,
  };
}

/**
 * Clear all authentication cookies (client-side helper)
 * This returns JavaScript code to be executed on the client
 */
export function getClearCookiesScript(): string {
  return `
    // Get all cookies
    const cookies = document.cookie.split(';');
    
    // Clear each auth-related cookie
    cookies.forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (name.includes('auth') || name.includes('session') || name.includes('csrf')) {
        // Clear for current domain
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Clear for parent domain
        const domain = window.location.hostname;
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + domain;
        
        // Clear for .domain
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + domain;
      }
    });
    
    console.log('Auth cookies cleared');
    return true;
  `;
}

/**
 * Get detailed cookie information for debugging
 */
export async function getDetailedCookieInfo(): Promise<{
  timestamp: string;
  cookies: CookieInfo[];
  validation: CookieValidation;
  recommendations: string[];
}> {
  const cookies = await getAllAuthCookies();
  const validation = await validateCookies();
  const recommendations: string[] = [];

  if (!validation.valid) {
    if (validation.issues.includes("No authentication cookies found. User may not be logged in.")) {
      recommendations.push("User needs to sign in to create authentication cookies.");
    }

    if (validation.issues.some((i) => i.includes("corrupted"))) {
      recommendations.push("Clear all cookies and sign in again.");
    }

    if (validation.issues.some((i) => i.includes("CSRF"))) {
      recommendations.push("CSRF token missing. This is usually created during sign in.");
    }
  }

  if (cookies.length > 5) {
    recommendations.push("Multiple auth cookies detected. Consider clearing old cookies.");
  }

  return {
    timestamp: new Date().toISOString(),
    cookies,
    validation,
    recommendations,
  };
}

/**
 * Check if cookies are from old session (incompatible)
 * This is a heuristic check based on cookie patterns
 */
export async function detectOldSessionCookies(): Promise<{
  hasOldCookies: boolean;
  reason?: string;
}> {
  const authCookies = await getAllAuthCookies();

  // Check for very short session tokens (old format)
  const sessionCookie = authCookies.find((c) =>
    c.name.toLowerCase().includes("session-token")
  );

  if (sessionCookie && sessionCookie.size < 50) {
    return {
      hasOldCookies: true,
      reason: "Session token is unusually short, may be from old auth system",
    };
  }

  // Check for deprecated cookie names
  const hasDeprecatedNames = authCookies.some((c) =>
    c.name.includes("next-auth") && !c.name.includes("authjs")
  );

  if (hasDeprecatedNames) {
    return {
      hasOldCookies: true,
      reason: "Found cookies with deprecated naming pattern (next-auth vs authjs)",
    };
  }

  return { hasOldCookies: false };
}

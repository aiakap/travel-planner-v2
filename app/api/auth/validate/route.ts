/**
 * Auth Validation API Endpoint
 * Provides comprehensive validation of authentication state
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateAuthConfig, getEnvironmentStatus, getConfiguredProviders } from "@/lib/auth-validation";
import { getCookieStatus, validateCookies, detectOldSessionCookies } from "@/lib/auth-cookies";

/**
 * Test database connection
 */
async function testDatabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
  latency?: number;
}> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return {
      connected: true,
      latency,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get session status
 */
async function getSessionStatus() {
  try {
    const session = await auth();

    if (!session) {
      return {
        exists: false,
        authenticated: false,
      };
    }

    return {
      exists: true,
      authenticated: !!session.user,
      userId: session.user?.id,
      email: session.user?.email,
      name: session.user?.name,
      hasImage: !!session.user?.image,
    };
  } catch (error) {
    return {
      exists: false,
      authenticated: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check if user exists in database
 */
async function checkUserInDatabase(userId?: string) {
  if (!userId) {
    return {
      exists: false,
      reason: "No user ID provided",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
            isPrimaryLogin: true,
            canLogin: true,
            lastLoginAt: true,
          },
        },
        _count: {
          select: {
            trips: true,
            conversations: true,
          },
        },
      },
    });

    if (!user) {
      return {
        exists: false,
        reason: "User not found in database",
      };
    }

    return {
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        accountCount: user.accounts.length,
        accounts: user.accounts.map((acc) => ({
          provider: acc.provider,
          isPrimary: acc.isPrimaryLogin,
          canLogin: acc.canLogin,
          lastLogin: acc.lastLoginAt,
        })),
        stats: {
          trips: user._count.trips,
          conversations: user._count.conversations,
        },
      },
    };
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * GET /api/auth/validate
 * Returns comprehensive auth validation data
 */
export async function GET() {
  try {
    const [
      configValidation,
      envStatus,
      sessionStatus,
      cookieStatus,
      cookieValidation,
      oldCookieCheck,
      dbConnection,
    ] = await Promise.all([
      Promise.resolve(validateAuthConfig()),
      Promise.resolve(getEnvironmentStatus()),
      getSessionStatus(),
      getCookieStatus(),
      validateCookies(),
      detectOldSessionCookies(),
      testDatabaseConnection(),
    ]);

    // Check user in database if session exists
    const userCheck = await checkUserInDatabase(sessionStatus.userId);

    // Determine overall status
    let overallStatus: "healthy" | "warning" | "error" = "healthy";
    const issues: string[] = [];

    if (!configValidation.valid) {
      overallStatus = "error";
      issues.push(...configValidation.errors.map((e) => e.message));
    }

    if (!dbConnection.connected) {
      overallStatus = "error";
      issues.push("Database connection failed");
    }

    if (sessionStatus.authenticated && !userCheck.exists) {
      overallStatus = "error";
      issues.push("Session exists but user not found in database");
    }

    if (oldCookieCheck.hasOldCookies) {
      overallStatus = overallStatus === "error" ? "error" : "warning";
      issues.push(oldCookieCheck.reason || "Old session cookies detected");
    }

    if (!cookieValidation.valid) {
      overallStatus = overallStatus === "error" ? "error" : "warning";
      issues.push(...cookieValidation.issues);
    }

    if (configValidation.warnings.length > 0) {
      if (overallStatus === "healthy") {
        overallStatus = "warning";
      }
      issues.push(...configValidation.warnings.map((w) => w.message));
    }

    const validation = {
      timestamp: new Date().toISOString(),
      status: overallStatus,
      issues,

      environment: {
        ...envStatus,
        configuredProviders: getConfiguredProviders(),
        validation: configValidation,
      },

      session: sessionStatus,

      user: userCheck,

      database: dbConnection,

      cookies: {
        ...cookieStatus,
        validation: cookieValidation,
        oldCookiesDetected: oldCookieCheck.hasOldCookies,
        oldCookiesReason: oldCookieCheck.reason,
      },

      recommendations: generateRecommendations({
        configValidation,
        sessionStatus,
        userCheck,
        dbConnection,
        cookieValidation,
        oldCookieCheck,
      }),
    };

    return NextResponse.json(validation);
  } catch (error) {
    console.error("[AUTH:VALIDATE] Error:", error);

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Generate recommendations based on validation results
 */
function generateRecommendations(data: {
  configValidation: any;
  sessionStatus: any;
  userCheck: any;
  dbConnection: any;
  cookieValidation: any;
  oldCookieCheck: any;
}): string[] {
  const recommendations: string[] = [];

  // Config issues
  if (!data.configValidation.valid) {
    data.configValidation.errors.forEach((error: any) => {
      if (error.fix) {
        recommendations.push(error.fix);
      }
    });
  }

  // Database issues
  if (!data.dbConnection.connected) {
    recommendations.push("Check DATABASE_URL in .env file");
    recommendations.push("Ensure database server is running");
    recommendations.push("Run: npx prisma db push");
  }

  // Session/User mismatch
  if (data.sessionStatus.authenticated && !data.userCheck.exists) {
    recommendations.push("Clear browser cookies and sign in again");
    recommendations.push("User may have been deleted from database");
  }

  // Old cookies
  if (data.oldCookieCheck.hasOldCookies) {
    recommendations.push("Clear all browser cookies");
    recommendations.push("Use incognito/private window for testing");
    recommendations.push("Old session tokens are incompatible with current auth system");
  }

  // Cookie issues
  if (!data.cookieValidation.valid) {
    if (data.cookieValidation.issues.some((i: string) => i.includes("No authentication cookies"))) {
      recommendations.push("Sign in to create authentication cookies");
    } else {
      recommendations.push("Clear cookies and sign in again");
    }
  }

  // No session
  if (!data.sessionStatus.authenticated) {
    recommendations.push("Sign in to test authentication");
  }

  return recommendations;
}

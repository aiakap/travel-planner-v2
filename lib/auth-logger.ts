/**
 * Structured Logging System for Auth Events
 * Provides consistent, detailed logging for all authentication activities
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface AuthLogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  userId?: string;
  provider?: string;
  error?: string;
  stack?: string;
  metadata?: Record<string, any>;
}

class AuthLogger {
  private isDevelopment = process.env.NODE_ENV === "development";

  /**
   * Format and output log entry
   */
  private log(entry: AuthLogEntry) {
    const prefix = `[AUTH:${entry.event.toUpperCase()}]`;
    const message = {
      timestamp: entry.timestamp,
      ...entry,
    };

    switch (entry.level) {
      case "error":
        console.error(prefix, message);
        break;
      case "warn":
        console.warn(prefix, message);
        break;
      case "debug":
        if (this.isDevelopment) {
          console.debug(prefix, message);
        }
        break;
      case "info":
      default:
        console.log(prefix, message);
        break;
    }
  }

  /**
   * Log successful sign in
   */
  signIn(userId: string, provider: string, details?: Record<string, any>) {
    this.log({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "signin",
      userId,
      provider,
      metadata: details,
    });
  }

  /**
   * Log sign out
   */
  signOut(userId: string, details?: Record<string, any>) {
    this.log({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "signout",
      userId,
      metadata: details,
    });
  }

  /**
   * Log session creation
   */
  sessionCreated(session: any) {
    this.log({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "session_created",
      userId: session?.user?.id,
      metadata: {
        hasUser: !!session?.user,
        hasToken: !!session,
        email: session?.user?.email,
      },
    });
  }

  /**
   * Log session validation
   */
  sessionValidated(userId: string, valid: boolean) {
    this.log({
      timestamp: new Date().toISOString(),
      level: valid ? "info" : "warn",
      event: "session_validated",
      userId,
      metadata: { valid },
    });
  }

  /**
   * Log JWT token creation
   */
  jwtCreated(token: any, trigger?: string) {
    this.log({
      timestamp: new Date().toISOString(),
      level: "debug",
      event: "jwt_created",
      userId: token?.userId || token?.sub,
      metadata: {
        trigger,
        hasAccessToken: !!token?.accessToken,
        hasRefreshToken: !!token?.refreshToken,
        provider: token?.provider,
      },
    });
  }

  /**
   * Log account linking
   */
  accountLinked(userId: string, provider: string, providerAccountId: string) {
    this.log({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "account_linked",
      userId,
      provider,
      metadata: { providerAccountId },
    });
  }

  /**
   * Log user creation
   */
  userCreated(userId: string, provider: string, email?: string) {
    this.log({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "user_created",
      userId,
      provider,
      metadata: { email },
    });
  }

  /**
   * Log user not found
   */
  userNotFound(userId: string, context?: Record<string, any>) {
    this.log({
      timestamp: new Date().toISOString(),
      level: "warn",
      event: "user_not_found",
      userId,
      metadata: context,
    });
  }

  /**
   * Log authentication error
   */
  error(error: Error | unknown, context?: Record<string, any>) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    this.log({
      timestamp: new Date().toISOString(),
      level: "error",
      event: "error",
      error: err.message,
      stack: this.isDevelopment ? err.stack : undefined,
      metadata: context,
    });
  }

  /**
   * Log callback error
   */
  callbackError(
    callbackType: "signIn" | "jwt" | "session",
    error: Error | unknown,
    context?: Record<string, any>
  ) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    this.log({
      timestamp: new Date().toISOString(),
      level: "error",
      event: `${callbackType}_callback_error`,
      error: err.message,
      stack: this.isDevelopment ? err.stack : undefined,
      metadata: context,
    });
  }

  /**
   * Log OAuth provider error
   */
  providerError(provider: string, error: Error | unknown, context?: Record<string, any>) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    this.log({
      timestamp: new Date().toISOString(),
      level: "error",
      event: "provider_error",
      provider,
      error: err.message,
      stack: this.isDevelopment ? err.stack : undefined,
      metadata: context,
    });
  }

  /**
   * Log database error
   */
  databaseError(operation: string, error: Error | unknown, context?: Record<string, any>) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    this.log({
      timestamp: new Date().toISOString(),
      level: "error",
      event: "database_error",
      error: err.message,
      stack: this.isDevelopment ? err.stack : undefined,
      metadata: { operation, ...context },
    });
  }

  /**
   * Log configuration warning
   */
  configWarning(message: string, details?: Record<string, any>) {
    this.log({
      timestamp: new Date().toISOString(),
      level: "warn",
      event: "config_warning",
      error: message,
      metadata: details,
    });
  }

  /**
   * Log debug information
   */
  debug(event: string, details?: Record<string, any>) {
    this.log({
      timestamp: new Date().toISOString(),
      level: "debug",
      event,
      metadata: details,
    });
  }

  /**
   * Log info message
   */
  info(event: string, details?: Record<string, any>) {
    this.log({
      timestamp: new Date().toISOString(),
      level: "info",
      event,
      metadata: details,
    });
  }

  /**
   * Log warning message
   */
  warn(event: string, details?: Record<string, any>) {
    this.log({
      timestamp: new Date().toISOString(),
      level: "warn",
      event,
      metadata: details,
    });
  }
}

// Export singleton instance
export const authLogger = new AuthLogger();

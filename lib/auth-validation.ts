/**
 * Auth Configuration Validation Utility
 * Validates environment variables and auth setup
 */

export interface AuthValidationError {
  type: string;
  message: string;
  fix?: string;
  provider?: string;
}

export interface AuthValidationResult {
  valid: boolean;
  errors: AuthValidationError[];
  warnings: AuthValidationError[];
}

export interface ProviderConfig {
  name: string;
  envPrefix: string;
  required: boolean;
}

const PROVIDERS: ProviderConfig[] = [
  { name: "GitHub", envPrefix: "GITHUB", required: false },
  { name: "Google", envPrefix: "GOOGLE", required: false },
  { name: "Facebook", envPrefix: "FACEBOOK", required: false },
  { name: "Apple", envPrefix: "APPLE", required: false },
  { name: "Twitter", envPrefix: "TWITTER", required: false },
  { name: "LinkedIn", envPrefix: "LINKEDIN", required: false },
  { name: "Spotify", envPrefix: "SPOTIFY", required: false },
];

/**
 * Validate complete auth configuration
 */
export function validateAuthConfig(): AuthValidationResult {
  const errors: AuthValidationError[] = [];
  const warnings: AuthValidationError[] = [];

  // Check AUTH_SECRET (required)
  const hasAuthSecret = !!process.env.AUTH_SECRET;
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;

  if (!hasAuthSecret && !hasNextAuthSecret) {
    errors.push({
      type: "MISSING_SECRET",
      message: "AUTH_SECRET or NEXTAUTH_SECRET is required for NextAuth v5",
      fix: 'Add AUTH_SECRET="your-secret-here" to .env file. Generate with: openssl rand -base64 32',
    });
  } else if (!hasAuthSecret && hasNextAuthSecret) {
    warnings.push({
      type: "DEPRECATED_SECRET",
      message: "NEXTAUTH_SECRET is deprecated. Use AUTH_SECRET instead",
      fix: 'Rename NEXTAUTH_SECRET to AUTH_SECRET in .env file',
    });
  }

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    errors.push({
      type: "MISSING_DATABASE",
      message: "DATABASE_URL is required for database connection",
      fix: 'Add DATABASE_URL="postgresql://..." to .env file',
    });
  }

  // Check provider credentials
  let hasAtLeastOneProvider = false;

  for (const provider of PROVIDERS) {
    const clientId = process.env[`${provider.envPrefix}_CLIENT_ID`] || 
                     process.env[`AUTH_${provider.envPrefix}_ID`];
    const clientSecret = process.env[`${provider.envPrefix}_CLIENT_SECRET`] || 
                        process.env[`AUTH_${provider.envPrefix}_SECRET`];

    if (clientId || clientSecret) {
      hasAtLeastOneProvider = true;

      if (clientId && !clientSecret) {
        errors.push({
          type: "INCOMPLETE_PROVIDER",
          provider: provider.name,
          message: `${provider.name} has CLIENT_ID but missing CLIENT_SECRET`,
          fix: `Add ${provider.envPrefix}_CLIENT_SECRET to .env file`,
        });
      } else if (!clientId && clientSecret) {
        errors.push({
          type: "INCOMPLETE_PROVIDER",
          provider: provider.name,
          message: `${provider.name} has CLIENT_SECRET but missing CLIENT_ID`,
          fix: `Add ${provider.envPrefix}_CLIENT_ID to .env file`,
        });
      }
    }
  }

  if (!hasAtLeastOneProvider) {
    warnings.push({
      type: "NO_PROVIDERS",
      message: "No OAuth providers configured. Users won't be able to sign in.",
      fix: "Configure at least one OAuth provider (GitHub, Google, etc.)",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get list of configured providers
 */
export function getConfiguredProviders(): string[] {
  const configured: string[] = [];

  for (const provider of PROVIDERS) {
    const clientId = process.env[`${provider.envPrefix}_CLIENT_ID`] || 
                     process.env[`AUTH_${provider.envPrefix}_ID`];
    const clientSecret = process.env[`${provider.envPrefix}_CLIENT_SECRET`] || 
                        process.env[`AUTH_${provider.envPrefix}_SECRET`];

    if (clientId && clientSecret) {
      configured.push(provider.name);
    }
  }

  return configured;
}

/**
 * Check if a specific provider is configured
 */
export function isProviderConfigured(providerName: string): boolean {
  const provider = PROVIDERS.find(
    (p) => p.name.toLowerCase() === providerName.toLowerCase()
  );

  if (!provider) return false;

  const clientId = process.env[`${provider.envPrefix}_CLIENT_ID`] || 
                   process.env[`AUTH_${provider.envPrefix}_ID`];
  const clientSecret = process.env[`${provider.envPrefix}_CLIENT_SECRET`] || 
                      process.env[`AUTH_${provider.envPrefix}_SECRET`];

  return !!(clientId && clientSecret);
}

/**
 * Get environment status summary
 */
export function getEnvironmentStatus() {
  return {
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasGoogleMapsKey: !!process.env.GOOGLE_MAPS_API_KEY,
    nodeEnv: process.env.NODE_ENV || "development",
    configuredProviders: getConfiguredProviders(),
  };
}

/**
 * Validate and log results (for startup checks)
 */
export function validateAndLog(): AuthValidationResult {
  const result = validateAuthConfig();

  if (!result.valid) {
    console.error("❌ Auth Configuration Errors:");
    result.errors.forEach((error) => {
      console.error(`  - [${error.type}] ${error.message}`);
      if (error.fix) {
        console.error(`    Fix: ${error.fix}`);
      }
    });
  }

  if (result.warnings.length > 0) {
    console.warn("⚠️  Auth Configuration Warnings:");
    result.warnings.forEach((warning) => {
      console.warn(`  - [${warning.type}] ${warning.message}`);
      if (warning.fix) {
        console.warn(`    Fix: ${warning.fix}`);
      }
    });
  }

  if (result.valid && result.warnings.length === 0) {
    console.log("✅ Auth configuration is valid");
    console.log(`   Configured providers: ${getConfiguredProviders().join(", ")}`);
  }

  return result;
}

/**
 * Vitest setup file
 * Runs before all tests
 */

// Add any global test setup here
// For example, mocking environment variables or global objects

// Mock Next.js auth for tests that need it
process.env.NEXTAUTH_SECRET = 'test-secret-for-vitest';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

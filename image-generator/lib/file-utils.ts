/**
 * Utility functions for file naming and management
 */

/**
 * Sanitize a string to be used as a filename
 * - Converts to lowercase
 * - Replaces spaces with underscores
 * - Removes special characters
 * - Limits length
 */
export function sanitizeFilename(text: string, maxLength: number = 50): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/_+/g, "_") // Collapse multiple underscores
    .replace(/^_|_$/g, "") // Remove leading/trailing underscores
    .substring(0, maxLength);
}

/**
 * Generate a filename from a prompt
 * Takes the first few words and sanitizes them
 */
export function generateFilenameFromPrompt(prompt: string, maxLength: number = 50): string {
  // Take first 10 words or so
  const words = prompt.split(/\s+/).slice(0, 10).join(" ");
  return sanitizeFilename(words, maxLength);
}

/**
 * Get the output directory path
 */
export function getOutputDir(): string {
  return "image-generator/output";
}

/**
 * Get the logs directory path
 */
export function getLogsDir(): string {
  return "image-generator/logs";
}

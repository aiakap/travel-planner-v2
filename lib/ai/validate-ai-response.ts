/**
 * Validation utility for AI responses
 * Ensures AI outputs match the expected JSON structure
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that an AI response has the correct structure
 * Expected format: { text: string, places: array, transport: array, hotels: array }
 */
export function validateAIResponse(response: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for required fields
  if (response === null || response === undefined) {
    errors.push("Response is null or undefined");
    return { valid: false, errors, warnings };
  }
  
  if (typeof response !== 'object') {
    errors.push("Response must be an object");
    return { valid: false, errors, warnings };
  }
  
  // Check text field
  if (!('text' in response)) {
    errors.push("Missing 'text' field");
  } else if (typeof response.text !== 'string') {
    errors.push("'text' field must be a string");
  } else if (response.text.length === 0) {
    warnings.push("'text' field is empty");
  }
  
  // Check places field
  if (!('places' in response)) {
    errors.push("Missing 'places' field");
  } else if (!Array.isArray(response.places)) {
    errors.push("'places' field must be an array");
  } else {
    // Validate place structure
    response.places.forEach((place: any, idx: number) => {
      if (!place.suggestedName) {
        warnings.push(`Place ${idx} missing 'suggestedName'`);
      }
      if (!place.category) {
        warnings.push(`Place ${idx} missing 'category'`);
      }
      if (!place.type) {
        warnings.push(`Place ${idx} missing 'type'`);
      }
      if (!place.searchQuery) {
        warnings.push(`Place ${idx} missing 'searchQuery'`);
      }
    });
  }
  
  // Check transport field
  if (!('transport' in response)) {
    errors.push("Missing 'transport' field");
  } else if (!Array.isArray(response.transport)) {
    errors.push("'transport' field must be an array");
  }
  
  // Check hotels field
  if (!('hotels' in response)) {
    errors.push("Missing 'hotels' field");
  } else if (!Array.isArray(response.hotels)) {
    errors.push("'hotels' field must be an array");
  }
  
  // Check for common AI mistakes
  if (typeof response.text === 'string') {
    // Check if response still has markdown code fences
    if (response.text.includes('```json') || response.text.includes('```')) {
      warnings.push("Text contains markdown code fences - AI may have wrapped JSON in markdown");
    }
    
    // Check if text is actually JSON (AI might have nested JSON)
    if (response.text.trim().startsWith('{') && response.text.trim().endsWith('}')) {
      warnings.push("Text field appears to contain JSON - AI may have double-wrapped the response");
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Formats validation errors for logging
 */
export function formatValidationErrors(result: ValidationResult): string {
  const parts: string[] = [];
  
  if (result.errors.length > 0) {
    parts.push(`Errors: ${result.errors.join(', ')}`);
  }
  
  if (result.warnings.length > 0) {
    parts.push(`Warnings: ${result.warnings.join(', ')}`);
  }
  
  return parts.join(' | ');
}

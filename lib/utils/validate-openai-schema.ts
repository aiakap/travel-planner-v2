/**
 * OpenAI Schema Validation Utility
 * 
 * Validates JSON schemas before sending to OpenAI's Structured Outputs API.
 * Checks for common issues and unsupported features.
 */

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates an OpenAI JSON schema for compatibility with Structured Outputs
 * 
 * @param schema - The JSON schema object to validate
 * @returns Validation result with errors and warnings
 */
export function validateOpenAISchema(schema: any): SchemaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Check root type
  if (!schema.type) {
    errors.push('Missing root type property');
  } else if (schema.type !== 'object') {
    errors.push(`Root type must be 'object', got '${schema.type}'`);
  }
  
  // 2. Check for properties
  if (!schema.properties) {
    errors.push('Missing properties object');
  }
  
  // 3. Check for unsupported oneOf (OpenAI only supports anyOf)
  if (schema.oneOf) {
    errors.push('Root level oneOf is not supported - use anyOf instead');
  }
  
  // 4. Check additionalProperties for strict mode
  if (schema.additionalProperties !== false) {
    warnings.push('additionalProperties should be false for strict mode');
  }
  
  // 5. Deep validation of nested structures
  validateNestedSchema(schema, 'root', errors, warnings);
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Recursively validates nested schema structures
 */
function validateNestedSchema(
  obj: any,
  path: string,
  errors: string[],
  warnings: string[]
): void {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }
  
  // Check for oneOf at any level
  if (obj.oneOf) {
    errors.push(`Found oneOf at ${path} - OpenAI only supports anyOf for unions`);
  }
  
  // Check for allOf (sometimes problematic)
  if (obj.allOf) {
    warnings.push(`Found allOf at ${path} - ensure this is properly flattened`);
  }
  
  // Check for $ref (not supported in strict mode)
  if (obj.$ref) {
    errors.push(`Found $ref at ${path} - references are not supported in strict mode`);
  }
  
  // Validate properties
  if (obj.properties) {
    Object.keys(obj.properties).forEach(key => {
      validateNestedSchema(obj.properties[key], `${path}.properties.${key}`, errors, warnings);
    });
  }
  
  // Validate array items
  if (obj.items) {
    validateNestedSchema(obj.items, `${path}.items`, errors, warnings);
  }
  
  // Validate anyOf branches
  if (obj.anyOf && Array.isArray(obj.anyOf)) {
    obj.anyOf.forEach((item: any, i: number) => {
      validateNestedSchema(item, `${path}.anyOf[${i}]`, errors, warnings);
    });
  }
  
  // Check for required array
  if (obj.type === 'object' && obj.properties && !obj.required) {
    warnings.push(`Object at ${path} has properties but no required array`);
  }
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(result: SchemaValidationResult): string {
  const parts: string[] = [];
  
  if (result.errors.length > 0) {
    parts.push('ERRORS:');
    result.errors.forEach((error, i) => {
      parts.push(`  ${i + 1}. ${error}`);
    });
  }
  
  if (result.warnings.length > 0) {
    if (parts.length > 0) parts.push('');
    parts.push('WARNINGS:');
    result.warnings.forEach((warning, i) => {
      parts.push(`  ${i + 1}. ${warning}`);
    });
  }
  
  return parts.join('\n');
}

/**
 * Quick check if a schema is valid
 */
export function isValidOpenAISchema(schema: any): boolean {
  return validateOpenAISchema(schema).valid;
}

/**
 * Analyzes schema complexity and provides metrics
 */
export function analyzeSchemaComplexity(schema: any): {
  totalProperties: number;
  maxDepth: number;
  hasUnions: boolean;
  estimatedSize: number;
} {
  let totalProperties = 0;
  let maxDepth = 0;
  let hasUnions = false;
  
  function traverse(obj: any, depth: number): void {
    if (typeof obj !== 'object' || obj === null) return;
    
    maxDepth = Math.max(maxDepth, depth);
    
    if (obj.properties) {
      totalProperties += Object.keys(obj.properties).length;
      Object.values(obj.properties).forEach(prop => traverse(prop, depth + 1));
    }
    
    if (obj.items) {
      traverse(obj.items, depth + 1);
    }
    
    if (obj.anyOf || obj.oneOf) {
      hasUnions = true;
      const union = obj.anyOf || obj.oneOf;
      union.forEach((item: any) => traverse(item, depth + 1));
    }
  }
  
  traverse(schema, 0);
  
  return {
    totalProperties,
    maxDepth,
    hasUnions,
    estimatedSize: JSON.stringify(schema).length,
  };
}

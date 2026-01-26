import { z } from 'zod';

/**
 * Validation result for OpenAI schema compatibility
 */
export interface SchemaValidationResult {
  /** Whether the schema is compatible with OpenAI Structured Outputs */
  compatible: boolean;
  /** Non-critical warnings about potential issues */
  warnings: string[];
  /** Critical errors that prevent OpenAI compatibility */
  errors: string[];
}

/**
 * Validates that a Zod schema is compatible with OpenAI Structured Outputs
 * 
 * OpenAI's Structured Outputs require:
 * 1. All properties must be in the "required" array OR have a default value
 * 2. Optional fields should use .nullable().default(null) instead of .optional()
 * 3. additionalProperties must be false
 * 4. Root object cannot be anyOf
 * 
 * This function performs basic validation by checking the Zod schema structure.
 * For comprehensive validation, test with actual OpenAI API calls.
 * 
 * @param schema - The Zod schema to validate
 * @param schemaName - Optional name for better error messages
 * @returns Validation result with compatibility status, warnings, and errors
 * 
 * @example
 * ```typescript
 * const result = validateOpenAISchema(mySchema, 'MySchema');
 * if (!result.compatible) {
 *   console.error('Schema errors:', result.errors);
 * }
 * if (result.warnings.length > 0) {
 *   console.warn('Schema warnings:', result.warnings);
 * }
 * ```
 * 
 * @see https://platform.openai.com/docs/guides/structured-outputs
 */
export function validateOpenAISchema(
  schema: z.ZodType,
  schemaName: string = 'Schema'
): SchemaValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // Check if it's an object schema (required for OpenAI)
    if (!(schema instanceof z.ZodObject)) {
      errors.push(`${schemaName}: Root schema must be a ZodObject, got ${schema.constructor.name}`);
      return { compatible: false, warnings, errors };
    }

    // Recursively check for .optional() usage
    const optionalFields = findOptionalFields(schema, schemaName);
    if (optionalFields.length > 0) {
      errors.push(
        `${schemaName}: Found .optional() fields which are not compatible with OpenAI Structured Outputs. ` +
        `Use .nullable().default(null) instead: ${optionalFields.join(', ')}`
      );
    }

    // Check for missing descriptions
    const fieldsWithoutDescriptions = findFieldsWithoutDescriptions(schema, schemaName);
    if (fieldsWithoutDescriptions.length > 0) {
      warnings.push(
        `${schemaName}: Consider adding descriptions to these fields for better AI understanding: ` +
        `${fieldsWithoutDescriptions.join(', ')}`
      );
    }

    // Check if schema is too deeply nested (OpenAI limit is 10 levels)
    const maxDepth = calculateNestingDepth(schema);
    if (maxDepth > 10) {
      errors.push(`${schemaName}: Nesting depth (${maxDepth}) exceeds OpenAI's limit of 10 levels`);
    } else if (maxDepth > 7) {
      warnings.push(`${schemaName}: Nesting depth (${maxDepth}) is high. Consider flattening the structure.`);
    }

    return {
      compatible: errors.length === 0,
      warnings,
      errors
    };
  } catch (error: any) {
    errors.push(`${schemaName}: Failed to validate schema: ${error.message}`);
    return { compatible: false, warnings, errors };
  }
}

/**
 * Recursively finds fields using .optional() in a Zod schema
 */
function findOptionalFields(schema: z.ZodType, path: string = ''): string[] {
  const fields: string[] = [];

  if (schema instanceof z.ZodOptional) {
    fields.push(path || 'root');
  }

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    for (const [key, value] of Object.entries(shape)) {
      const fieldPath = path ? `${path}.${key}` : key;
      fields.push(...findOptionalFields(value as z.ZodType, fieldPath));
    }
  }

  if (schema instanceof z.ZodArray) {
    fields.push(...findOptionalFields(schema.element, `${path}[]`));
  }

  if (schema instanceof z.ZodUnion || schema instanceof z.ZodDiscriminatedUnion) {
    const options = (schema as any).options || (schema as any)._def.options;
    if (options) {
      options.forEach((option: z.ZodType, index: number) => {
        fields.push(...findOptionalFields(option, `${path}[union:${index}]`));
      });
    }
  }

  return fields;
}

/**
 * Finds fields without descriptions
 */
function findFieldsWithoutDescriptions(schema: z.ZodType, path: string = ''): string[] {
  const fields: string[] = [];

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    for (const [key, value] of Object.entries(shape)) {
      const fieldPath = path ? `${path}.${key}` : key;
      const fieldSchema = value as z.ZodType;
      
      // Check if this field has a description
      const description = (fieldSchema as any)._def?.description;
      if (!description) {
        fields.push(fieldPath);
      }

      // Recursively check nested objects
      if (fieldSchema instanceof z.ZodObject) {
        fields.push(...findFieldsWithoutDescriptions(fieldSchema, fieldPath));
      }
    }
  }

  return fields;
}

/**
 * Calculates the maximum nesting depth of a schema
 */
function calculateNestingDepth(schema: z.ZodType, currentDepth: number = 0): number {
  if (currentDepth > 15) {
    // Prevent infinite recursion
    return currentDepth;
  }

  let maxDepth = currentDepth;

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    for (const value of Object.values(shape)) {
      const depth = calculateNestingDepth(value as z.ZodType, currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  if (schema instanceof z.ZodArray) {
    const depth = calculateNestingDepth(schema.element, currentDepth + 1);
    maxDepth = Math.max(maxDepth, depth);
  }

  // Unwrap nullable, default, etc.
  if (schema instanceof z.ZodNullable || schema instanceof z.ZodDefault) {
    const innerSchema = (schema as any)._def.innerType || (schema as any)._def.defaultType;
    if (innerSchema) {
      const depth = calculateNestingDepth(innerSchema, currentDepth);
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  return maxDepth;
}

/**
 * Quick check if a schema is likely compatible with OpenAI Structured Outputs
 * 
 * This is a lightweight version of validateOpenAISchema that only checks for
 * critical errors without detailed analysis.
 * 
 * @param schema - The Zod schema to check
 * @returns True if the schema appears compatible
 */
export function isOpenAICompatible(schema: z.ZodType): boolean {
  if (!(schema instanceof z.ZodObject)) {
    return false;
  }

  const optionalFields = findOptionalFields(schema);
  return optionalFields.length === 0;
}

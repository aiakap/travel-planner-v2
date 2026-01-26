# OpenAI Structured Output Schema Guidelines

This directory contains Zod schemas designed for use with OpenAI's Structured Outputs feature. These guidelines ensure schema compatibility and prevent common errors.

## Table of Contents

- [Core Rules](#core-rules)
- [Common Patterns](#common-patterns)
- [Schema Examples](#schema-examples)
- [Migration Guide](#migration-guide)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Core Rules

### Rule 1: Never Use `.optional()` with `generateObject`

OpenAI's Structured Outputs requires all properties to be in the `required` array. Using `.optional()` creates properties that might not exist, which violates this requirement.

❌ **BAD** (Will cause errors):
```typescript
const schema = z.object({
  name: z.string().optional(),
  email: z.string().optional()
});
```

✅ **GOOD** (OpenAI compatible):
```typescript
const schema = z.object({
  name: z.string().nullable().default(null),
  email: z.string().nullable().default(null)
});
```

### Rule 2: `.optional()` is Fine for Validation Only

You can safely use `.optional()` when validating data with `.safeParse()` or `.parse()`, just not for generation with OpenAI.

✅ **GOOD** (Validation schemas):
```typescript
// This schema is for validating API responses, not for OpenAI generation
const apiResponseSchema = z.object({
  data: z.string(),
  metadata: z.object({
    timestamp: z.number().optional() // OK here!
  }).optional()
});

const result = apiResponseSchema.safeParse(apiResponse);
```

### Rule 3: Always Add Descriptive Comments

Every nullable field should explain when it might be null:

✅ **GOOD**:
```typescript
const schema = z.object({
  cabin: z.string().nullable().default(null).describe(
    "Cabin class (Economy, Business, First) or null if not specified in booking"
  ),
  seatNumber: z.string().nullable().default(null).describe(
    "Assigned seat number (e.g., 22K) or null if not yet assigned"
  )
});
```

### Rule 4: Root Schema Must Be an Object

OpenAI requires the root schema to be an object, not a union or primitive type:

❌ **BAD**:
```typescript
const schema = z.union([
  z.object({ type: 'A', value: z.string() }),
  z.object({ type: 'B', value: z.number() })
]);
```

✅ **GOOD**:
```typescript
const schema = z.object({
  data: z.union([
    z.object({ type: z.literal('A'), value: z.string() }),
    z.object({ type: z.literal('B'), value: z.number() })
  ])
});
```

## Common Patterns

### Pattern 1: Required + Optional Fields

```typescript
export const userSchema = z.object({
  // Required fields - always present
  id: z.string().describe("Unique user identifier"),
  email: z.string().describe("User email address"),
  
  // Optional fields - use nullable with default
  phoneNumber: z.string().nullable().default(null).describe(
    "Phone number or null if not provided"
  ),
  bio: z.string().nullable().default(null).describe(
    "User biography or null if not set"
  ),
});
```

### Pattern 2: Nested Objects with Optional Fields

```typescript
export const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string().nullable().default(null),
  country: z.string(),
});

export const userWithAddressSchema = z.object({
  name: z.string(),
  // Entire address object can be nullable
  address: addressSchema.nullable().default(null).describe(
    "User address or null if not provided"
  ),
});
```

### Pattern 3: Arrays with Optional Elements

```typescript
export const flightSchema = z.object({
  flightNumber: z.string(),
  // Array of segments - array itself is required but can be empty
  segments: z.array(z.object({
    departure: z.string(),
    arrival: z.string(),
    // Optional field within array elements
    gate: z.string().nullable().default(null),
  })).describe("List of flight segments (may be empty)"),
});
```

### Pattern 4: Enums with Null

```typescript
export const reservationSchema = z.object({
  name: z.string(),
  // Enum that can be null
  status: z.enum(['pending', 'confirmed', 'cancelled'])
    .nullable()
    .default(null)
    .describe("Reservation status or null if not yet determined"),
});
```

## Schema Examples

### Example 1: Flight Extraction Schema

See [`flight-extraction-schema.ts`](./flight-extraction-schema.ts) for a complete example of an OpenAI-compatible schema with:
- JSDoc documentation
- Proper nullable fields
- Validation helper functions
- Type-safe TypeScript types

### Example 2: Simple Data Extraction

```typescript
import { z } from 'zod';

/**
 * Extract contact information from text
 * OpenAI-compatible schema for structured output
 */
export const contactExtractionSchema = z.object({
  // Required fields
  name: z.string().describe("Person's full name"),
  
  // Optional contact details
  email: z.string().nullable().default(null).describe(
    "Email address or null if not found"
  ),
  phone: z.string().nullable().default(null).describe(
    "Phone number or null if not found"
  ),
  company: z.string().nullable().default(null).describe(
    "Company name or null if not mentioned"
  ),
  
  // Array of optional items
  socialLinks: z.array(z.object({
    platform: z.string(),
    url: z.string(),
  })).describe("List of social media links (empty if none found)"),
});

export type ContactExtraction = z.infer<typeof contactExtractionSchema>;
```

## Migration Guide

### Migrating from `.optional()` to `.nullable().default(null)`

If you have existing schemas using `.optional()` that need to work with OpenAI's `generateObject`:

**Step 1**: Identify schemas used with `generateObject`
```bash
# Search for schemas used with generateObject
grep -r "generateObject" --include="*.ts" | grep "schema"
```

**Step 2**: Replace `.optional()` with `.nullable().default(null)`
```typescript
// Before
const oldSchema = z.object({
  field: z.string().optional().describe("Some field"),
});

// After
const newSchema = z.object({
  field: z.string().nullable().default(null).describe(
    "Some field or null if not provided"
  ),
});
```

**Step 3**: Update consuming code (usually no changes needed!)
```typescript
// The code handling the data often doesn't need changes
// Both patterns work with null/undefined checks:

// Before (optional field)
if (data.field !== undefined) {
  console.log(data.field);
}

// After (nullable field) - same check works!
if (data.field !== null) {
  console.log(data.field);
}

// Or use optional chaining (works for both)
console.log(data.field?.toUpperCase());
```

**Step 4**: Update TypeScript types
```typescript
// Type changes from:
type Old = {
  field?: string;  // string | undefined
}

// To:
type New = {
  field: string | null;  // string | null
}
```

### Validation Checklist

Use the provided validation utilities to check your schemas:

```typescript
import { validateOpenAISchema } from '@/lib/schemas/validate-openai-schema';

const result = validateOpenAISchema(mySchema, 'MySchema');

if (!result.compatible) {
  console.error('Schema errors:', result.errors);
}

if (result.warnings.length > 0) {
  console.warn('Schema warnings:', result.warnings);
}
```

## Testing

### Unit Test Template

```typescript
import { describe, it, expect } from '@jest/globals';
import { mySchema, validateMySchema } from './my-schema';

describe('MySchema', () => {
  it('should handle all required fields', () => {
    const validData = {
      requiredField: 'value',
      // Optional fields can be null
      optionalField: null,
    };
    
    const result = validateMySchema(validData);
    expect(result.success).toBe(true);
  });

  it('should handle null optional fields', () => {
    const dataWithNulls = {
      requiredField: 'value',
      optionalField1: null,
      optionalField2: null,
    };
    
    const result = validateMySchema(dataWithNulls);
    expect(result.success).toBe(true);
    expect(result.data?.optionalField1).toBeNull();
  });

  it('should reject missing required fields', () => {
    const invalidData = {
      optionalField: 'value',
      // Missing requiredField
    };
    
    const result = validateMySchema(invalidData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('requiredField');
  });
});
```

### Testing with OpenAI

```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { mySchema } from './my-schema';

async function testSchemaWithOpenAI() {
  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: mySchema,
      prompt: 'Extract data from: ...',
    });
    
    console.log('✅ Schema works with OpenAI');
    console.log('Result:', result.object);
  } catch (error) {
    console.error('❌ Schema error:', error);
  }
}
```

## Troubleshooting

### Error: "Missing 'fieldName' in required"

**Cause**: A field is using `.optional()` instead of `.nullable().default(null)`

**Solution**: Replace `.optional()` with `.nullable().default(null)`:
```typescript
// Before
field: z.string().optional()

// After
field: z.string().nullable().default(null)
```

### Error: "additionalProperties must be false"

**Cause**: Zod objects automatically set `additionalProperties: false`, but custom JSON schemas might not.

**Solution**: If converting from JSON Schema manually, ensure:
```json
{
  "type": "object",
  "properties": { ... },
  "additionalProperties": false  // Required!
}
```

### Error: "Root object cannot be anyOf"

**Cause**: Root schema is a union or discriminated union.

**Solution**: Wrap the union in an object:
```typescript
// Before
const schema = z.union([...]);

// After
const schema = z.object({
  data: z.union([...])
});
```

### Warning: "Nesting depth exceeds limit"

**Cause**: Schema has more than 10 levels of nesting (OpenAI limit).

**Solution**: Flatten your schema structure:
```typescript
// Before (too nested)
const schema = z.object({
  level1: z.object({
    level2: z.object({
      // ... continues 10+ levels
    })
  })
});

// After (flattened)
const level2Schema = z.object({ ... });
const level1Schema = z.object({
  level2: level2Schema
});
const schema = z.object({
  level1: level1Schema
});
```

## Additional Resources

- [OpenAI Structured Outputs Documentation](https://platform.openai.com/docs/guides/structured-outputs)
- [Zod Documentation](https://zod.dev)
- [Schema Validation Utilities](./validate-openai-schema.ts)
- [Flight Extraction Example](./flight-extraction-schema.ts)

## Best Practices Summary

1. ✅ Use `.nullable().default(null)` for optional fields with `generateObject`
2. ✅ Use `.optional()` only for validation schemas (not generation)
3. ✅ Add clear descriptions to all fields
4. ✅ Keep root schema as an object
5. ✅ Validate schemas before deployment
6. ✅ Write unit tests for schemas
7. ✅ Document nullable fields clearly
8. ✅ Use validation helpers
9. ✅ Test with actual OpenAI API calls
10. ✅ Monitor for schema errors in production

---

**Last Updated**: January 2026  
**For Questions**: Check schema validation utilities or OpenAI documentation

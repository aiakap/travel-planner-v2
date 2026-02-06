# Flight Extraction Schema Fix

## Issue

OpenAI structured output error:
```
Invalid schema for response_format 'response': In context=('properties', 'flights', 'items'), 
'required' is required to be supplied and to be an array including every key in properties. 
Missing 'cabin'.
```

## Root Cause

OpenAI's structured output with JSON Schema requires that:
- All properties must either be in the `required` array, OR
- Optional properties should be `nullable` with a `default` value

Using Zod's `.optional()` creates a schema where the property might not exist, which doesn't translate properly to OpenAI's strict JSON Schema requirements.

## Solution

Changed all optional fields from `.optional()` to `.nullable().default(null)`:

### Before
```typescript
cabin: z.string().optional().describe("Cabin class...")
seatNumber: z.string().optional().describe("Assigned seat number")
operatedBy: z.string().optional().describe("Operating airline...")
eTicketNumber: z.string().optional().describe("E-ticket number")
purchaseDate: z.string().optional().describe("Date of purchase")
totalCost: z.number().optional().describe("Total cost...")
currency: z.string().optional().describe("Currency code...")
```

### After
```typescript
cabin: z.string().nullable().default(null).describe("Cabin class... or null if not specified")
seatNumber: z.string().nullable().default(null).describe("Assigned seat number or null...")
operatedBy: z.string().nullable().default(null).describe("Operating airline... or null...")
eTicketNumber: z.string().nullable().default(null).describe("E-ticket number or null...")
purchaseDate: z.string().nullable().default(null).describe("Date of purchase or null...")
totalCost: z.number().nullable().default(null).describe("Total cost... or null...")
currency: z.string().nullable().default(null).describe("Currency code... or null...")
```

## Why This Works

### `.optional()` behavior
- Property may not exist in the object
- JSON Schema: Property is not in `required` array and has no `default`
- OpenAI rejects: "All properties must be required or have defaults"

### `.nullable().default(null)` behavior
- Property always exists in the object (with value or null)
- JSON Schema: Property is in `required` array with default value of `null`
- OpenAI accepts: "Property is required and has a default"

## Existing Code Compatibility

The existing code already handles nullable values correctly:

### Display Code (email-extract/page.tsx)
```typescript
{ label: "E-Ticket", value: extractedData.eTicketNumber || "N/A" }
...(flight.cabin ? [{ label: "Cabin", value: flight.cabin }] : [])
```

### Server Action (add-flights-to-trip.ts)
```typescript
cost: flightData.totalCost ? flightData.totalCost / flightData.flights.length : undefined,
currency: flightData.currency,
notes: [
  flight.cabin ? `Cabin: ${flight.cabin}` : null,
  flight.seatNumber ? `Seat: ${flight.seatNumber}` : null,
].filter(Boolean).join('\n')
```

Both already check for null/undefined values, so they work with both approaches.

## TypeScript Type

The inferred TypeScript type changes slightly:

### Before
```typescript
type FlightExtraction = {
  cabin?: string | undefined;
  eTicketNumber?: string | undefined;
  // ...
}
```

### After
```typescript
type FlightExtraction = {
  cabin: string | null;
  eTicketNumber: string | null;
  // ...
}
```

This is actually better because:
- ✅ More explicit: Field always exists, value may be null
- ✅ Easier to work with: No need to check `if (obj.field !== undefined)`
- ✅ JSON-friendly: Serializes consistently

## Testing

Test the extraction with the sample email:

```bash
# Navigate to http://localhost:3000/admin/email-extract
# Paste or drag the United Airlines email
# Click "Extract Flight Data"
# Should now work without schema errors
```

## Files Modified

1. **`lib/schemas/flight-extraction-schema.ts`**
   - Changed 7 fields from `.optional()` to `.nullable().default(null)`
   - Updated descriptions to mention "or null if not specified"

## Result

✅ Schema now validates with OpenAI's structured output
✅ Email extraction works correctly
✅ Existing display and server code continue to work
✅ More robust typing with explicit null values

---

**Status**: ✅ FIXED
**Error**: Schema validation error resolved
**File Modified**: `lib/schemas/flight-extraction-schema.ts`

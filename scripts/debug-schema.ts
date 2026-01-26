import { zodToJsonSchema } from "zod-to-json-schema";
import { flightExtractionSchema } from "../lib/schemas/flight-extraction-schema";

// Debug what JSON Schema is being generated
const jsonSchema = zodToJsonSchema(flightExtractionSchema, "flightExtractionSchema");

console.log("Generated JSON Schema:");
console.log(JSON.stringify(jsonSchema, null, 2));

console.log("\n\nFlight Segment Schema (nested):");
console.log(JSON.stringify((jsonSchema as any).definitions?.flightSegmentSchema || "Not found", null, 2));

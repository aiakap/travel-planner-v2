import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { travelDataSchema, ExtractedTravelData } from "@/lib/schemas/travel-extraction-schema";

/**
 * Extracts travel data (flights, hotels, cars, activities) from text
 * Uses GPT-4o with structured output
 */
export class TravelTextExtractor {
  /**
   * Extract travel data from email or text content
   */
  async extract(text: string): Promise<ExtractedTravelData> {
    try {
      const result = await generateObject({
        model: openai("gpt-4o-2024-11-20"),
        schema: travelDataSchema,
        prompt: this.buildExtractionPrompt(text),
        temperature: 0.1, // Low temperature for consistent extraction
      });

      return result.object;
    } catch (error) {
      console.error("Error extracting travel data from text:", error);
      throw new Error("Failed to extract travel data from text");
    }
  }

  /**
   * Build the extraction prompt
   */
  private buildExtractionPrompt(text: string): string {
    return `Extract ALL travel information from this email/text content.

Email/Text Content:
${text}

Instructions:
1. Extract ALL flights - include every flight leg (outbound, return, connections)
2. Extract ALL hotels - include every hotel reservation mentioned
3. Extract ALL rental cars - include every rental car booking
4. Extract ALL activities - include tours, excursions, or activity bookings

For Flights:
- Parse airline names (e.g., "United Airlines", "Delta", "AA" = "American Airlines")
- Parse flight numbers (e.g., "UA123", "DL456")
- Parse airport codes from the text or infer from city names
- Parse dates and times in ISO format (YYYY-MM-DDTHH:MM:SS)
- Look for confirmation numbers, booking references, or PNR codes

For Hotels:
- Parse hotel name and location (city, address if available)
- Parse check-in and check-out dates in ISO format (YYYY-MM-DD)
- Calculate number of nights if dates are provided
- Look for confirmation numbers

For Rental Cars:
- Parse company name (e.g., "Hertz", "Enterprise", "Avis")
- Parse pickup and return locations (may be same or different)
- Parse pickup and return dates in ISO format (YYYY-MM-DDTHH:MM:SS)
- Look for confirmation numbers

For Activities:
- Parse activity/tour name
- Parse location (city, venue, address)
- Parse date and time in ISO format
- Look for confirmation numbers

Important:
- If you cannot find specific information, use empty arrays []
- Do NOT make up information that is not in the text
- If airport codes are not mentioned, try to infer from city names (e.g., "New York" → "JFK" or "LGA")
- If exact times are not mentioned for hotels/cars, use reasonable defaults (check-in: 15:00, check-out: 11:00)
- Parse all date formats (e.g., "Jan 15, 2025", "1/15/25", "January 15th, 2025")

Return a JSON object with four arrays: flights, hotels, rentalCars, and activities. Each array should contain all relevant bookings found in the text.`;
  }

  /**
   * Extract only flights from text (backwards compatibility)
   */
  async extractFlights(text: string): Promise<ExtractedTravelData["flights"]> {
    const data = await this.extract(text);
    return data.flights;
  }

  /**
   * Extract only hotels from text
   */
  async extractHotels(text: string): Promise<ExtractedTravelData["hotels"]> {
    const data = await this.extract(text);
    return data.hotels;
  }
}

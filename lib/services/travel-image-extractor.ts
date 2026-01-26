import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { travelDataSchema, ExtractedTravelData } from "@/lib/schemas/travel-extraction-schema";
import * as fs from "fs";

/**
 * Extracts travel data from images using GPT-4o Vision
 * Handles confirmation screenshots, PDFs, and other image formats
 */
export class TravelImageExtractor {
  /**
   * Extract travel data from an image
   * @param imageInput - Can be a file path, URL, or base64 string
   */
  async extractFromImage(imageInput: string | Buffer): Promise<ExtractedTravelData> {
    try {
      let imageUrl: string;

      // Handle different input types
      if (Buffer.isBuffer(imageInput)) {
        // Convert buffer to base64 data URL
        const base64 = imageInput.toString("base64");
        imageUrl = `data:image/jpeg;base64,${base64}`;
      } else if (imageInput.startsWith("http://") || imageInput.startsWith("https://")) {
        // It's already a URL
        imageUrl = imageInput;
      } else if (imageInput.startsWith("data:")) {
        // It's already a data URL
        imageUrl = imageInput;
      } else {
        // Assume it's a file path
        const fileBuffer = fs.readFileSync(imageInput);
        const base64 = fileBuffer.toString("base64");
        const mimeType = this.getMimeType(imageInput);
        imageUrl = `data:${mimeType};base64,${base64}`;
      }

      const result = await generateObject({
        model: openai("gpt-4o-2024-11-20"),
        schema: travelDataSchema,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: this.buildVisionPrompt(),
              },
              {
                type: "image",
                image: imageUrl,
              },
            ],
          },
        ],
        temperature: 0.1,
      });

      return result.object;
    } catch (error) {
      console.error("Error extracting travel data from image:", error);
      throw new Error("Failed to extract travel data from image");
    }
  }

  /**
   * Extract travel data from a PDF file
   * Note: This is a simplified version that treats PDF as an image
   * For production, you'd want to use a proper PDF library to extract images/text
   */
  async extractFromPDF(pdfPath: string): Promise<ExtractedTravelData> {
    // For now, treat single-page PDFs as images
    // In a production system, you'd use pdf-lib or similar to:
    // 1. Extract text if available (better accuracy)
    // 2. Convert each page to image and process separately
    // 3. Merge results from all pages
    
    try {
      // Simple approach: convert PDF to image would go here
      // For now, we'll throw an error suggesting text extraction instead
      throw new Error(
        "PDF extraction not fully implemented. Please convert PDF to images or extract text first."
      );
    } catch (error) {
      console.error("Error extracting travel data from PDF:", error);
      throw error;
    }
  }

  /**
   * Build the vision prompt for image analysis
   */
  private buildVisionPrompt(): string {
    return `Analyze this travel confirmation image and extract ALL booking information.

Look for and extract:

1. **FLIGHTS**
   - Airline name and logo
   - Flight numbers (e.g., "UA 1234", "DL 5678")
   - Origin and destination airport codes and cities
   - Departure and arrival dates and times
   - Confirmation number, booking reference, or PNR
   - Look for: "Flight", "Booking", "Confirmation", "Itinerary"

2. **HOTELS**
   - Hotel name
   - Hotel address and city
   - Check-in and check-out dates
   - Number of nights
   - Confirmation number
   - Look for: "Hotel", "Reservation", "Check-in", "Check-out"

3. **RENTAL CARS**
   - Car rental company (Hertz, Enterprise, Budget, etc.)
   - Pickup location and date/time
   - Return location and date/time
   - Confirmation number
   - Look for: "Car Rental", "Vehicle", "Pick-up", "Drop-off"

4. **ACTIVITIES**
   - Tour or activity name
   - Location (venue, city, address)
   - Date and time
   - Confirmation number
   - Look for: "Tour", "Activity", "Excursion", "Booking"

Important Instructions:
- Read ALL text in the image carefully, including small print
- Extract dates in ISO format (YYYY-MM-DD for dates, YYYY-MM-DDTHH:MM:SS for datetimes)
- If airport codes are shown, use them; otherwise infer from city names
- Parse all variations of date formats
- Look for confirmation numbers in various formats (alphanumeric codes)
- If information is unclear or not present, leave it out (empty arrays)
- DO NOT make up information that is not visible in the image
- If the image shows a multi-leg trip, extract ALL legs as separate flights

Return a JSON object with four arrays: flights, hotels, rentalCars, and activities.`;
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "webp":
        return "image/webp";
      case "pdf":
        return "application/pdf";
      default:
        return "image/jpeg"; // Default fallback
    }
  }

  /**
   * Validate that an image contains travel-related content
   */
  async validateTravelImage(imageInput: string | Buffer): Promise<boolean> {
    // TODO: Add a quick pre-check to see if image likely contains travel confirmation
    // This could save API calls for irrelevant images
    return true;
  }

  /**
   * Merge multiple extraction results (useful for multi-page PDFs)
   */
  mergeExtractions(extractions: ExtractedTravelData[]): ExtractedTravelData {
    return {
      flights: extractions.flatMap((e) => e.flights),
      hotels: extractions.flatMap((e) => e.hotels),
      rentalCars: extractions.flatMap((e) => e.rentalCars),
      activities: extractions.flatMap((e) => e.activities),
    };
  }
}

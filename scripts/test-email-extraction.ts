import { config } from "dotenv";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { flightExtractionSchema, validateFlightExtraction } from "../lib/schemas/flight-extraction-schema";

// Load environment variables
config();

// Test email data (United Airlines confirmation)
const TEST_EMAIL = `Thank you for choosing United. A receipt of your purchase is shown below. Please retain this email receipt for your records. Get ready for your trip: Visit the Travel-Ready Center, your one-stop digital assistant, to find out about important travel requirements specific to your trip. Confirmation Number: HQYJ5G Flight 1 of 4 UA875 Class: United Premium Plus (A) Thu, Jan 29, 2026 Fri, Jan 30, 2026 10:15 AM 02:50 PM San Francisco, CA, US (SFO) Tokyo, JP (HND) Flight 2 of 4 UA8006 Class: Economy (H) Fri, Jan 30, 2026 Fri, Jan 30, 2026 05:00 PM 06:35 PM Tokyo, JP (HND) Sapporo, JP (CTS) Flight Operated by All Nippon Airways. If this is an originating flight on your itinerary, please check in at the ANA ALL NIPPON ticket counter. Flight 3 of 4 UA7975 Class: Economy (Q) Sat, Feb 07, 2026 Sat, Feb 07, 2026 12:30 PM 02:10 PM Sapporo, JP (CTS) Tokyo, JP (HND) Flight Operated by All Nippon Airways. If this is an originating flight on your itinerary, please check in at the ANA ALL NIPPON ticket counter. Flight 4 of 4 UA876 Class: United Premium Plus (A) Sat, Feb 07, 2026 Sat, Feb 07, 2026 04:25 PM 09:10 AM Tokyo, JP (HND) San Francisco, CA, US (SFO) Traveler Details KAPLINSKY/ALEXANDER eTicket number: 0162363753568 Seats: SFO-HND 22K Frequent Flyer: UA-XXXXX605 Premier 1K® HND-CTS 28G CTS-HND 24G HND-SFO 21G Purchase Summary Method of payment: Visa ending in 3073 Travel Certificate Date of purchase: Mon, Jan 12, 2026 Airfare: 3286.00 U.S. Transportation Tax: 46.80 Passenger Civil Aviation Security Service Fee: 5.60 Japan Domestic Passenger Facility Charge: 10.60 Japan Passenger Service Facilities Charge: 18.80 International Tourist Tax: 6.40 U.S. APHIS User Fee: 3.84 U.S. Immigration User Fee: 7.00 U.S. Customs User Fee: 7.39 U.S. Passenger Facility Charge: 4.50 Total Per Passenger: 3396.93 USD Total: 3396.93 USD`;

async function testEmailExtraction() {
  console.log("🧪 Testing Flight Email Extraction");
  console.log("=" .repeat(80));
  console.log();

  // Check environment
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not found in environment");
    process.exit(1);
  }

  console.log("✅ Environment variables loaded");
  console.log(`📧 Test email length: ${TEST_EMAIL.length} characters`);
  console.log();

  try {
    console.log("🤖 Calling OpenAI with structured output...");
    const startTime = Date.now();

    const result = await generateObject({
      model: openai("gpt-4o-2024-08-06"),
      schema: flightExtractionSchema,
      prompt: `Extract flight information from this email. If any field is not available in the email, use an empty string ("") for text fields and 0 for numeric fields. Do NOT use null.

Email content:
${TEST_EMAIL}`,
    });

    const duration = Date.now() - startTime;
    console.log(`✅ OpenAI call completed in ${duration}ms`);
    console.log();

    // Validate the result
    console.log("🔍 Validating extracted data...");
    const validation = validateFlightExtraction(result.object);

    if (!validation.success) {
      console.error("❌ Validation failed:", validation.error);
      process.exit(1);
    }

    console.log("✅ Validation passed");
    console.log();

    // Display results
    console.log("📊 Extracted Flight Information:");
    console.log("-".repeat(80));
    console.log(`Confirmation Number: ${result.object.confirmationNumber}`);
    console.log(`Passenger Name: ${result.object.passengerName}`);
    console.log(`E-Ticket: ${result.object.eTicketNumber || "(not provided)"}`);
    console.log(`Purchase Date: ${result.object.purchaseDate || "(not provided)"}`);
    console.log(`Total Cost: ${result.object.totalCost ? `${result.object.totalCost} ${result.object.currency}` : "(not provided)"}`);
    console.log();

    console.log(`✈️  Flight Segments (${result.object.flights.length}):`);
    result.object.flights.forEach((flight, idx) => {
      console.log();
      console.log(`  Flight ${idx + 1}: ${flight.flightNumber}`);
      console.log(`  Carrier: ${flight.carrier} (${flight.carrierCode})`);
      console.log(`  Route: ${flight.departureAirport} → ${flight.arrivalAirport}`);
      console.log(`  Departure: ${flight.departureCity}, ${flight.departureDate} at ${flight.departureTime}`);
      console.log(`  Arrival: ${flight.arrivalCity}, ${flight.arrivalDate} at ${flight.arrivalTime}`);
      console.log(`  Cabin: ${flight.cabin || "(not specified)"}`);
      console.log(`  Seat: ${flight.seatNumber || "(not assigned)"}`);
      console.log(`  Operated by: ${flight.operatedBy || flight.carrier}`);
    });

    console.log();
    console.log("=" .repeat(80));
    console.log("✅ Test completed successfully!");
    console.log();

    // Output usage stats
    console.log("📈 Token Usage:");
    console.log(`  Prompt tokens: ${result.usage?.promptTokens || "N/A"}`);
    console.log(`  Completion tokens: ${result.usage?.completionTokens || "N/A"}`);
    console.log(`  Total tokens: ${result.usage?.totalTokens || "N/A"}`);

  } catch (error: any) {
    console.error();
    console.error("❌ Test failed with error:");
    console.error("-".repeat(80));
    
    if (error.message) {
      console.error("Message:", error.message);
    }
    
    if (error.cause) {
      console.error("Cause:", JSON.stringify(error.cause, null, 2));
    }
    
    if (error.response?.data) {
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }
    
    console.error();
    console.error("Full error:", error);
    process.exit(1);
  }
}

// Run the test
testEmailExtraction();

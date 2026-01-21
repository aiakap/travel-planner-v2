import { searchPlace } from "../lib/actions/google-places";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables from .env file
try {
  const envPath = join(__dirname, "../.env");
  const envFile = readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join("=").trim();
      }
    }
  });
} catch (error) {
  console.warn("⚠️  Could not load .env file");
}

/**
 * Test script to verify Google Places API integration
 * Run with: npx tsx scripts/test-places-integration.ts
 */

async function testPlacesIntegration() {
  console.log("🧪 Testing Google Places API Integration\n");

  // Test 1: Search for a well-known restaurant
  console.log("Test 1: Searching for 'Osteria Francescana' in 'Modena, Italy'");
  const result1 = await searchPlace("Osteria Francescana", "Modena, Italy");
  
  if (result1) {
    console.log("✅ Found place:");
    console.log(`   Name: ${result1.name}`);
    console.log(`   Address: ${result1.formattedAddress}`);
    console.log(`   Rating: ${result1.rating || "N/A"}`);
    console.log(`   Price Level: ${result1.priceLevel ? "$".repeat(result1.priceLevel) : "N/A"}`);
    console.log(`   Photos: ${result1.photos?.length || 0}`);
    console.log(`   Phone: ${result1.phoneNumber || "N/A"}`);
    console.log(`   Website: ${result1.website || "N/A"}`);
  } else {
    console.log("❌ Failed to find place");
  }

  console.log("\n---\n");

  // Test 2: Search for a hotel
  console.log("Test 2: Searching for 'The Ritz London'");
  const result2 = await searchPlace("The Ritz London", "London");
  
  if (result2) {
    console.log("✅ Found place:");
    console.log(`   Name: ${result2.name}`);
    console.log(`   Address: ${result2.formattedAddress}`);
    console.log(`   Rating: ${result2.rating || "N/A"}`);
    console.log(`   Price Level: ${result2.priceLevel ? "$".repeat(result2.priceLevel) : "N/A"}`);
    console.log(`   Opening Hours: ${result2.openingHours?.weekdayText?.[0] || "N/A"}`);
  } else {
    console.log("❌ Failed to find place");
  }

  console.log("\n---\n");

  // Test 3: Search without location context
  console.log("Test 3: Searching for 'Eiffel Tower' without location context");
  const result3 = await searchPlace("Eiffel Tower");
  
  if (result3) {
    console.log("✅ Found place:");
    console.log(`   Name: ${result3.name}`);
    console.log(`   Address: ${result3.formattedAddress}`);
    console.log(`   Coordinates: ${result3.geometry?.location.lat}, ${result3.geometry?.location.lng}`);
  } else {
    console.log("❌ Failed to find place");
  }

  console.log("\n✨ Testing complete!\n");
}

// Check if API key is configured
if (!process.env.GOOGLE_PLACES_API_KEY && !process.env.GOOGLE_MAPS_API_KEY) {
  console.error("❌ Neither GOOGLE_PLACES_API_KEY nor GOOGLE_MAPS_API_KEY is set in environment variables");
  process.exit(1);
}

if (process.env.GOOGLE_MAPS_API_KEY && !process.env.GOOGLE_PLACES_API_KEY) {
  console.log("ℹ️  Using GOOGLE_MAPS_API_KEY (includes Places API access)\n");
}

testPlacesIntegration()
  .then(() => {
    console.log("All tests completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test failed with error:", error);
    process.exit(1);
  });

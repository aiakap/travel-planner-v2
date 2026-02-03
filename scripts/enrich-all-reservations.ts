/**
 * Script to enrich all existing reservations with images
 * Run with: npx tsx scripts/enrich-all-reservations.ts
 */

import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

// Import the Google Places search function
async function searchPlace(query: string) {
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!GOOGLE_PLACES_API_KEY) {
    console.error("Google Places API key not configured");
    return null;
  }

  try {
    const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";
    
    // Text search to find the place
    const searchUrl = new URL(`${PLACES_API_BASE}/textsearch/json`);
    searchUrl.searchParams.append("query", query);
    searchUrl.searchParams.append("language", "en");
    searchUrl.searchParams.append("key", GOOGLE_PLACES_API_KEY);

    const searchResponse = await fetch(searchUrl.toString());
    const searchData = await searchResponse.json();

    if (searchData.status !== "OK" || !searchData.results?.length) {
      return null;
    }

    const place = searchData.results[0];

    // Get place details with photos
    const detailsUrl = new URL(`${PLACES_API_BASE}/details/json`);
    detailsUrl.searchParams.append("place_id", place.place_id);
    detailsUrl.searchParams.append("fields", "photos");
    detailsUrl.searchParams.append("language", "en");
    detailsUrl.searchParams.append("key", GOOGLE_PLACES_API_KEY);

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== "OK" || !detailsData.result?.photos?.length) {
      return null;
    }

    // Build photo URL
    const photoRef = detailsData.result.photos[0].photo_reference;
    const photoUrl = `${PLACES_API_BASE}/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`;

    return { photoUrl };
  } catch (error) {
    console.error("Error searching place:", error);
    return null;
  }
}

async function logImageEnrichment(params: {
  reservationId: string;
  reservationName: string;
  searchQuery: string | null;
  source: "google_places" | "ai_generation";
  status: "success" | "no_results" | "api_error" | "timeout";
  errorMessage?: string;
  errorCode?: string;
  photoUrl?: string;
}) {
  try {
    await prisma.imageEnrichmentLog.create({
      data: {
        reservationId: params.reservationId,
        reservationName: params.reservationName,
        searchQuery: params.searchQuery,
        source: params.source,
        status: params.status,
        errorMessage: params.errorMessage,
        errorCode: params.errorCode,
        photoUrl: params.photoUrl,
      },
    });
  } catch (e) {
    console.error("[Log] Failed to log:", e);
  }
}

function buildSearchQuery(reservation: any): string | null {
  const categoryName = reservation.reservationType?.category?.name;
  const typeName = reservation.reservationType?.name;

  // For flights, use arrival location (airport)
  if (typeName === "Flight") {
    if (reservation.arrivalLocation) {
      // Extract airport code if present, e.g., "Los Angeles (LAX)" -> "LAX airport"
      const match = reservation.arrivalLocation.match(/\(([A-Z]{3})\)/);
      if (match) {
        return `${match[1]} airport`;
      }
      return `${reservation.arrivalLocation} airport`;
    }
    if (reservation.departureLocation) {
      const match = reservation.departureLocation.match(/\(([A-Z]{3})\)/);
      if (match) {
        return `${match[1]} airport`;
      }
      return `${reservation.departureLocation} airport`;
    }
  }

  // For trains, use arrival station
  if (typeName === "Train") {
    if (reservation.arrivalLocation) {
      return `${reservation.arrivalLocation} train station`;
    }
  }

  // For hotels and stays
  if (categoryName === "Stay" || typeName === "Hotel") {
    if (reservation.location) {
      return `${reservation.name} ${reservation.location}`;
    }
    return reservation.name;
  }

  // For restaurants/dining
  if (categoryName === "Dining") {
    if (reservation.location) {
      return `${reservation.name} restaurant ${reservation.location}`;
    }
    return `${reservation.name} restaurant`;
  }

  // For car rentals
  if (typeName === "Car Rental") {
    if (reservation.departureLocation) {
      return reservation.departureLocation;
    }
  }

  // For cruises
  if (typeName === "Cruise" || typeName === "Ferry") {
    return `${reservation.name} cruise ship`;
  }

  // Generic fallback: use name + location
  if (reservation.location) {
    return `${reservation.name} ${reservation.location}`;
  }

  return reservation.name;
}

async function main() {
  console.log("🔍 Finding reservations without images...\n");

  // Get all reservations without images (and not custom images)
  const reservations = await prisma.reservation.findMany({
    where: {
      imageUrl: null,
      imageIsCustom: false,
    },
    include: {
      reservationType: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log(`📊 Found ${reservations.length} reservations without images\n`);

  if (reservations.length === 0) {
    console.log("✅ All reservations already have images!");
    return;
  }

  let successCount = 0;
  let noResultsCount = 0;
  let errorCount = 0;

  for (let i = 0; i < reservations.length; i++) {
    const reservation = reservations[i];
    const progress = `[${i + 1}/${reservations.length}]`;
    
    const searchQuery = buildSearchQuery(reservation);
    
    if (!searchQuery) {
      console.log(`${progress} ⏭️  ${reservation.name} - No search query available`);
      noResultsCount++;
      continue;
    }

    console.log(`${progress} 🔎 ${reservation.name}`);
    console.log(`        Query: "${searchQuery}"`);

    try {
      const result = await searchPlace(searchQuery);

      if (result?.photoUrl) {
        // Update the reservation with the image
        await prisma.reservation.update({
          where: { id: reservation.id },
          data: { imageUrl: result.photoUrl },
        });

        await logImageEnrichment({
          reservationId: reservation.id,
          reservationName: reservation.name,
          searchQuery,
          source: "google_places",
          status: "success",
          photoUrl: result.photoUrl,
        });

        console.log(`        ✅ Image found and saved`);
        successCount++;
      } else {
        await logImageEnrichment({
          reservationId: reservation.id,
          reservationName: reservation.name,
          searchQuery,
          source: "google_places",
          status: "no_results",
        });

        console.log(`        ❌ No image found`);
        noResultsCount++;
      }
    } catch (error: any) {
      await logImageEnrichment({
        reservationId: reservation.id,
        reservationName: reservation.name,
        searchQuery,
        source: "google_places",
        status: "api_error",
        errorMessage: error.message,
      });

      console.log(`        ⚠️  Error: ${error.message}`);
      errorCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 SUMMARY");
  console.log("=".repeat(50));
  console.log(`✅ Success:    ${successCount}`);
  console.log(`❌ No results: ${noResultsCount}`);
  console.log(`⚠️  Errors:     ${errorCount}`);
  console.log(`📈 Total:      ${reservations.length}`);
  console.log("=".repeat(50));
}

main()
  .catch((e) => {
    console.error("Script error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

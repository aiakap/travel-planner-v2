"use server";

import { 
  TransportSuggestion, 
  HotelSuggestion,
  TransportDataMap, 
  HotelDataMap, 
  AmadeusTransportData, 
  AmadeusHotelData 
} from "@/lib/types/amadeus-pipeline";
import { 
  searchFlights, 
  searchHotels, 
  searchTransfers,
  FlightSearchParams, 
  HotelSearchParams,
  TransferSearchParams 
} from "@/lib/flights/amadeus-client";

/**
 * Stage 2B: Transport Availability Lookup (Flights & Transfers)
 * 
 * Takes a list of transport suggestions and resolves each one to real Amadeus offers.
 */
export async function resolveTransport(
  suggestions: TransportSuggestion[]
): Promise<{ transportMap: TransportDataMap; timing: number }> {
  console.log(`🚀 [Stage 2B] Resolving ${suggestions.length} transport suggestions`);

  const transportMap: TransportDataMap = {};

  // Process each transport suggestion
  for (const suggestion of suggestions) {
    try {
      console.log(`   Processing: ${suggestion.suggestedName} (${suggestion.type})`);

      if (suggestion.type === "Flight") {
        // Build flight search params
        const searchParams: FlightSearchParams = {
          origin: suggestion.origin,
          destination: suggestion.destination,
          departureDate: suggestion.departureDate,
          returnDate: suggestion.returnDate,
          adults: suggestion.adults || 1,
          travelClass: suggestion.travelClass || "ECONOMY",
          max: 5,
        };

        console.log(`   → Searching flights with params:`, JSON.stringify(searchParams));
        const offers = await searchFlights(searchParams);
        console.log(`   ← Received ${offers?.length || 0} flight offers from Amadeus`);

        if (!offers || offers.length === 0) {
          console.warn(`   ⚠️  No flights found: ${suggestion.suggestedName}`);
          transportMap[suggestion.suggestedName] = {
            id: "",
            type: "flight",
            price: { total: "0", currency: "USD" },
            itineraries: [],
            validatingAirlineCodes: [],
            notFound: true,
          };
          continue;
        }

        // Use the first (cheapest) offer
        const bestOffer = offers[0];
        transportMap[suggestion.suggestedName] = {
          id: bestOffer.id,
          type: "flight",
          price: bestOffer.price,
          itineraries: bestOffer.itineraries,
          validatingAirlineCodes: bestOffer.validatingAirlineCodes,
          notFound: false,
        };

        console.log(`   ✅ Found flight: ${bestOffer.price.total} ${bestOffer.price.currency}`);
      } else if (suggestion.type === "Transfer" || suggestion.type === "Taxi") {
        // Build transfer search params
        // Note: Transfers need destination address - for now, we'll skip if missing
        console.warn(`   ⚠️  Transfer search not yet implemented for: ${suggestion.suggestedName}`);
        transportMap[suggestion.suggestedName] = {
          id: "",
          type: "transfer",
          price: { total: "0", currency: "USD" },
          notFound: true,
        };
      } else {
        // Unsupported transport type
        console.warn(`   ⚠️  Unsupported transport type ${suggestion.type}: ${suggestion.suggestedName}`);
        transportMap[suggestion.suggestedName] = {
          id: "",
          type: "flight",
          price: { total: "0", currency: "USD" },
          notFound: true,
        };
      }
    } catch (error) {
      console.error(`   ❌ Error resolving transport ${suggestion.suggestedName}:`, error);
      transportMap[suggestion.suggestedName] = {
        id: "",
        type: "flight",
        price: { total: "0", currency: "USD" },
        notFound: true,
      };
    }
  }

  const successCount = Object.values(transportMap).filter(t => !t.notFound).length;
  console.log(`✅ [Stage 2B] Resolved ${successCount}/${suggestions.length} transport options`);

  return {
    transportMap,
    timing: 0, // Will be set by caller
  };
}

/**
 * Stage 2C: Hotel Availability Lookup
 * 
 * Takes a list of hotel suggestions and resolves each one to real Amadeus hotel offers.
 */
export async function resolveHotels(
  suggestions: HotelSuggestion[]
): Promise<{ hotelMap: HotelDataMap; timing: number }> {
  console.log(`🏨 [Stage 2C] Resolving ${suggestions.length} hotel suggestions`);

  const hotelMap: HotelDataMap = {};

  // Process each hotel suggestion
  for (const suggestion of suggestions) {
    try {
      console.log(`   Processing: ${suggestion.suggestedName}`);

      // Extract city code from location
      const cityCode = extractCityCode(suggestion.location);
      if (!cityCode) {
        console.warn(`   ⚠️  Could not determine city code for: ${suggestion.suggestedName}`);
        hotelMap[suggestion.suggestedName] = {
          hotelId: "",
          name: suggestion.suggestedName,
          price: { total: "0", currency: "USD" },
          available: false,
          notFound: true,
        };
        continue;
      }

      // Build search params
      const searchParams: HotelSearchParams = {
        cityCode,
        checkInDate: suggestion.checkInDate,
        checkOutDate: suggestion.checkOutDate,
        adults: suggestion.guests,
        rooms: suggestion.rooms,
        max: 5, // Get top 5 offers
      };

      // Call Amadeus API
      const offers = await searchHotels(searchParams);

      if (!offers || offers.length === 0) {
        console.warn(`   ⚠️  No hotels found: ${suggestion.suggestedName}`);
        hotelMap[suggestion.suggestedName] = {
          hotelId: "",
          name: suggestion.suggestedName,
          price: { total: "0", currency: "USD" },
          available: false,
          notFound: true,
        };
        continue;
      }

      // Try to find a matching hotel by name, or use the first one
      let bestOffer = offers.find(h => 
        h.name.toLowerCase().includes(suggestion.suggestedName.toLowerCase()) ||
        suggestion.suggestedName.toLowerCase().includes(h.name.toLowerCase())
      ) || offers[0];

      hotelMap[suggestion.suggestedName] = {
        hotelId: bestOffer.hotelId,
        name: bestOffer.name,
        price: bestOffer.price,
        rating: bestOffer.rating,
        location: bestOffer.location,
        address: bestOffer.address ? 
          [
            ...(bestOffer.address.lines || []),
            bestOffer.address.cityName,
            bestOffer.address.countryCode
          ].filter(Boolean).join(", ") : undefined,
        amenities: bestOffer.amenities,
        photos: bestOffer.media?.map(m => m.uri),
        available: bestOffer.available,
        notFound: false,
      };

      console.log(`   ✅ Found: ${bestOffer.name} - ${bestOffer.price.total} ${bestOffer.price.currency}`);
    } catch (error) {
      console.error(`   ❌ Error resolving hotel ${suggestion.suggestedName}:`, error);
      hotelMap[suggestion.suggestedName] = {
        hotelId: "",
        name: suggestion.suggestedName,
        price: { total: "0", currency: "USD" },
        available: false,
        notFound: true,
      };
    }
  }

  const successCount = Object.values(hotelMap).filter(h => !h.notFound).length;
  console.log(`✅ [Stage 2C] Resolved ${successCount}/${suggestions.length} hotels`);

  return {
    hotelMap,
    timing: 0, // Will be set by caller
  };
}

/**
 * Helper function to extract IATA city code from location string
 * This is a simple implementation - in production you'd want a proper mapping service
 */
function extractCityCode(location: string): string | null {
  const cityMappings: { [key: string]: string } = {
    'paris': 'PAR',
    'london': 'LON',
    'new york': 'NYC',
    'tokyo': 'TYO',
    'los angeles': 'LAX',
    'san francisco': 'SFO',
    'chicago': 'CHI',
    'miami': 'MIA',
    'dubai': 'DXB',
    'singapore': 'SIN',
    'hong kong': 'HKG',
    'barcelona': 'BCN',
    'rome': 'ROM',
    'amsterdam': 'AMS',
    'berlin': 'BER',
    'madrid': 'MAD',
    'sydney': 'SYD',
    'melbourne': 'MEL',
    'bangkok': 'BKK',
    'istanbul': 'IST',
  };

  const normalizedLocation = location.toLowerCase();
  
  // Check for direct matches
  for (const [city, code] of Object.entries(cityMappings)) {
    if (normalizedLocation.includes(city)) {
      return code;
    }
  }

  // Check if it's already an IATA code (3 uppercase letters)
  const iataMatch = location.match(/\b([A-Z]{3})\b/);
  if (iataMatch) {
    return iataMatch[1];
  }

  return null;
}

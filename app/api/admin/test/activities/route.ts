import { NextRequest, NextResponse } from "next/server";

// Common destination ID mappings (Viator requires numeric IDs)
// IDs extracted from Viator URLs: viator.com/{location}/d{ID}-ttd
const DESTINATION_IDS: Record<string, string> = {
  // USA - Major Cities
  "new york": "687",
  "new york city": "687",
  "nyc": "687",
  "las vegas": "684",
  "los angeles": "645",
  "san francisco": "651",
  "miami": "662",
  "chicago": "672",
  "orlando": "678",
  "boston": "678",
  "seattle": "713",
  "washington dc": "657",
  "washington": "657",
  
  // Hawaii (correct IDs from Viator URLs)
  "hawaii": "278",
  "honolulu": "59070",
  "oahu": "672",
  "maui": "671",
  "kauai": "670",
  "big island": "669",
  "kona": "669",
  
  // Europe
  "paris": "479",
  "london": "737",
  "rome": "511",
  "barcelona": "562",
  "amsterdam": "525",
  "berlin": "535",
  "dublin": "762",
  "edinburgh": "739",
  "florence": "505",
  "venice": "522",
  "prague": "541",
  "vienna": "543",
  "lisbon": "538",
  "madrid": "564",
  
  // Asia Pacific
  "tokyo": "334",
  "sydney": "357",
  "bangkok": "343",
  "singapore": "352",
  "hong kong": "348",
  "bali": "702",
  
  // Other
  "dubai": "828",
  "cancun": "631",
  "mexico city": "628",
};

// Category slug to Viator tag ID mappings
// These IDs are from Viator's taxonomy - see /products/tags endpoint
const CATEGORY_TAG_IDS: Record<string, number> = {
  "tours-&-sightseeing": 21972,
  "tours-sightseeing": 21972,
  "cultural-&-theme-tours": 11938,
  "cultural-theme-tours": 11938,
  "food-&-drink": 20245,
  "food-drink": 20245,
  "outdoor-activities": 11903,
  "water-sports": 12046,
  "day-trips-&-excursions": 12029,
  "day-trips-excursions": 12029,
  "shows-&-performances": 11929,
  "shows-performances": 11929,
  "museums-&-attractions": 12028,
  "museums-attractions": 12028,
  // Additional common categories
  "adventure": 11903,
  "walking-tours": 11941,
  "boat-tours": 12053,
  "food-tours": 21911,
  "wine-tours": 12054,
  "cooking-classes": 12055,
  "private-tours": 11941,
  "family-friendly": 22046,
};

// Helper to resolve destination name to Viator destination ID
function resolveDestinationId(destination: string): string {
  // If already a number, use it directly
  if (/^\d+$/.test(destination)) {
    return destination;
  }
  
  // Look up by name (case-insensitive)
  const normalized = destination.toLowerCase().trim();
  return DESTINATION_IDS[normalized] || destination;
}

// Helper to resolve category slug to Viator tag ID
function resolveCategoryTagId(category: string): number | null {
  // If already a number, use it directly
  if (/^\d+$/.test(category)) {
    return parseInt(category, 10);
  }
  
  // Look up by slug (case-insensitive)
  const normalized = category.toLowerCase().trim();
  return CATEGORY_TAG_IDS[normalized] || null;
}

// Helper to format duration in minutes to human readable string
function formatDurationMinutes(minutes: number | undefined): string {
  if (!minutes) return "Duration varies";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} minutes`;
  if (mins === 0) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${hours}h ${mins}m`;
}

// Transform Viator API response to normalized format for frontend
function transformActivityDetails(viatorData: any) {
  // Get best quality image URL from variants (prefer 720px width)
  const getImageUrl = (img: any) => {
    if (!img?.variants?.length) return null;
    const preferred = img.variants.find((v: any) => v.width === 720);
    return preferred?.url || img.variants[img.variants.length - 1]?.url;
  };

  return {
    // Basic info
    productCode: viatorData.productCode,
    title: viatorData.title,
    description: viatorData.description,
    productUrl: viatorData.productUrl,
    
    // Transform images to simpler format with best quality URLs
    images: viatorData.images?.map((img: any) => ({
      url: getImageUrl(img),
      caption: img.caption || "",
    })).filter((img: any) => img.url),
    
    // Reviews
    rating: viatorData.reviews?.combinedAverageRating,
    reviewCount: viatorData.reviews?.totalReviews,
    
    // Duration from itinerary
    duration: viatorData.itinerary?.duration,
    
    // Pricing - try to get from pricingInfo or productOptions
    pricing: {
      summary: {
        fromPrice: viatorData.pricingInfo?.summary?.fromPrice || 
                   viatorData.productOptions?.[0]?.pricing?.suggestedRetailPrice,
        fromPriceBeforeDiscount: viatorData.pricingInfo?.summary?.fromPriceBeforeDiscount,
      },
      currency: viatorData.pricingInfo?.currency || "USD",
    },
    
    // Transform inclusions to string array
    inclusions: viatorData.inclusions?.map((inc: any) => 
      inc.otherDescription || inc.description || inc.typeDescription
    ).filter(Boolean),
    
    // Transform exclusions to string array  
    exclusions: viatorData.exclusions?.map((exc: any) => 
      exc.otherDescription || exc.description || exc.typeDescription
    ).filter(Boolean),
    
    // Additional info as strings
    additionalInfo: viatorData.additionalInfo?.map((info: any) => info.description).filter(Boolean),
    
    // Itinerary with formatted duration and items
    itinerary: {
      duration: formatDurationMinutes(viatorData.itinerary?.duration?.fixedDurationInMinutes),
      fixedDurationInMinutes: viatorData.itinerary?.duration?.fixedDurationInMinutes,
      privateTour: viatorData.itinerary?.privateTour || false,
      skipTheLine: viatorData.itinerary?.skipTheLine || false,
      items: viatorData.itinerary?.itineraryItems?.map((item: any) => ({
        title: item.pointOfInterestLocation?.location?.name || null,
        description: item.description,
        duration: item.duration?.fixedDurationInMinutes 
          ? formatDurationMinutes(item.duration.fixedDurationInMinutes) 
          : null,
      })),
    },
    
    // Cancellation policy
    cancellationPolicy: viatorData.cancellationPolicy ? {
      type: viatorData.cancellationPolicy.type,
      description: viatorData.cancellationPolicy.description,
      refundEligibility: viatorData.cancellationPolicy.refundEligibility,
    } : null,
    
    // Logistics - meeting point and end location
    meetingPoint: viatorData.logistics?.start?.[0]?.description,
    endPoint: viatorData.logistics?.end?.[0]?.description,
    travelerPickup: viatorData.logistics?.travelerPickup ? {
      pickupOptionType: viatorData.logistics.travelerPickup.pickupOptionType,
      allowCustomPickup: viatorData.logistics.travelerPickup.allowCustomTravelerPickup,
    } : null,
    
    // Booking info
    bookingInfo: {
      instantConfirmation: viatorData.confirmationType === "INSTANT",
      freeCancellation: viatorData.cancellationPolicy?.type === "STANDARD",
      cancellationPolicy: viatorData.cancellationPolicy?.description,
      minTravelers: viatorData.bookingRequirements?.minTravelersPerBooking,
      maxTravelers: viatorData.bookingRequirements?.maxTravelersPerBooking,
      requiresAdultForBooking: viatorData.bookingRequirements?.requiresAdultForBooking,
    },
    
    // Tags/categories
    tags: viatorData.tags,
    
    // Flags (FREE_CANCELLATION, PRIVATE_TOUR, etc.)
    flags: viatorData.flags,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { destination, category, startDate, endDate, limit = 20 } = await request.json();

    if (!destination) {
      return NextResponse.json(
        { error: "Destination is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.VIATOR_API_KEY;
    if (!apiKey) {
      // Return mock data for testing without API key
      return NextResponse.json({
        success: true,
        mock: true,
        message: "Using mock data - add VIATOR_API_KEY to .env for real data",
        activities: getMockActivities(destination),
        total: 50,
      });
    }

    const startTime = Date.now();

    // Resolve destination name to Viator destination ID
    const destinationId = resolveDestinationId(destination);
    const isNumericId = /^\d+$/.test(destinationId);

    // Viator API endpoint for product search
    const url = "https://api.viator.com/partner/products/search";

    const requestBody: any = {
      filtering: {
        destination: destinationId,
      },
      sorting: {
        sort: "TRAVELER_RATING",
        order: "DESCENDING",
      },
      pagination: {
        start: 1,
        count: limit,
      },
      currency: "USD",
    };

    // Tags filter (category can be a slug or numeric tag ID)
    if (category) {
      const tagId = resolveCategoryTagId(category);
      if (tagId) {
        requestBody.filtering.tags = [tagId];
        console.log(`[Viator API] Category resolved: ${category} -> tag ID ${tagId}`);
      } else {
        console.log(`[Viator API] Unknown category "${category}" - skipping tag filter`);
      }
    }

    if (startDate) {
      requestBody.filtering.startDate = startDate;
    }

    if (endDate) {
      requestBody.filtering.endDate = endDate;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "exp-api-key": apiKey,
        "Accept": "application/json;version=2.0",
        "Content-Type": "application/json",
        "Accept-Language": "en-US",
      },
      body: JSON.stringify(requestBody),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Viator API] Error response:", response.status, errorText);
      console.error("[Viator API] Request body:", JSON.stringify(requestBody, null, 2));
      console.log("[Viator API] Destination resolved:", destination, "->", destinationId);
      
      // Fall back to mock data instead of returning error
      console.log("[Viator API] Falling back to mock data");
      
      // Parse error for better messaging
      let errorMessage = `Viator API returned ${response.status}. Using mock data.`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.code === "UNAUTHORIZED") {
          errorMessage = "Viator API key is invalid or expired. Using mock data.";
        } else if (errorJson.code === "BAD_REQUEST") {
          // Check if it's a destination resolution issue
          if (errorJson.message?.includes("Invalid destination") && !isNumericId) {
            errorMessage = `Unknown destination "${destination}". Try using a numeric Viator destination ID or a common city name (New York, Paris, London, etc.). Using mock data.`;
          } else {
            errorMessage = `Viator API error: ${errorJson.message || "Bad request"}. Using mock data.`;
          }
        }
      } catch {}
      
      return NextResponse.json({
        success: true,
        mock: true,
        message: errorMessage,
        activities: getMockActivities(destination),
        total: 50,
        debug: {
          status: response.status,
          endpoint: url,
          destinationResolved: `${destination} -> ${destinationId}`,
        }
      });
    }

    const data = await response.json();
    console.log(`[Viator API] Success: Found ${data.totalCount || 0} activities for destination ${destinationId} (${destination}) in ${duration}ms`);

    return NextResponse.json({
      success: true,
      activities: data.products || [],
      total: data.totalCount || 0,
      duration,
      destinationId, // Include resolved destination ID in response
    });
  } catch (error: any) {
    console.error("[Viator API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch activities data" },
      { status: 500 }
    );
  }
}

// GET endpoint for fetching activity details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productCode = searchParams.get("code");

    if (!productCode) {
      return NextResponse.json(
        { error: "Product code is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.VIATOR_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        mock: true,
        message: "Using mock data - add VIATOR_API_KEY to .env for real data",
        activity: getMockActivityDetails(productCode),
      });
    }

    const startTime = Date.now();
    const url = `https://api.viator.com/partner/products/${productCode}`;

    const response = await fetch(url, {
      headers: {
        "exp-api-key": apiKey,
        "Accept": "application/json;version=2.0",
        "Accept-Language": "en-US",
      },
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Viator API] Error fetching details:", response.status, errorText);
      
      // Fall back to mock data
      return NextResponse.json({
        success: true,
        mock: true,
        message: "Using mock data for activity details",
        activity: getMockActivityDetails(productCode),
      });
    }

    const data = await response.json();
    
    // Transform the Viator response to normalized format
    const transformedActivity = transformActivityDetails(data);
    console.log(`[Viator API] Successfully fetched and transformed details for ${productCode} in ${duration}ms`);

    return NextResponse.json({
      success: true,
      activity: transformedActivity,
      duration,
    });
  } catch (error: any) {
    console.error("[Viator API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch activity details" },
      { status: 500 }
    );
  }
}

// Mock data for testing
function getMockActivities(destination: string) {
  const categories = [
    "Tours & Sightseeing",
    "Cultural & Theme Tours",
    "Food & Drink",
    "Outdoor Activities",
    "Water Sports",
    "Day Trips & Excursions",
    "Shows & Performances",
    "Museums & Attractions",
  ];

  const activities = [
    "City Walking Tour",
    "Museum Pass",
    "Food Tasting Tour",
    "Boat Cruise",
    "Adventure Park",
    "Historical Tour",
    "Cooking Class",
    "Bike Tour",
    "Wine Tasting",
    "Sunset Cruise",
  ];

  return Array.from({ length: 10 }, (_, i) => ({
    productCode: `MOCK-${i}`,
    title: `${activities[i % activities.length]} in ${destination}`,
    description: `Experience the best ${activities[i % activities.length].toLowerCase()} in ${destination}. This highly-rated activity offers an unforgettable experience.`,
    images: [
      {
        url: "https://via.placeholder.com/600x400",
        caption: "Activity image",
      },
    ],
    productUrl: `https://www.viator.com/tours/mock-${i}`,
    rating: 4 + Math.random(),
    reviewCount: Math.floor(Math.random() * 1000) + 100,
    duration: {
      fixedDurationInMinutes: Math.floor(Math.random() * 360) + 60,
    },
    pricing: {
      summary: {
        fromPrice: Math.floor(Math.random() * 150) + 30,
        fromPriceBeforeDiscount: Math.floor(Math.random() * 200) + 50,
      },
      currency: "USD",
    },
    location: {
      ref: destination,
      latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
      longitude: -74.006 + (Math.random() - 0.5) * 0.1,
    },
    categories: [
      {
        name: categories[i % categories.length],
      },
    ],
    bookingInfo: {
      instantConfirmation: Math.random() > 0.5,
      freeCancellation: Math.random() > 0.3,
    },
  }));
}

function getMockActivityDetails(productCode: string) {
  return {
    productCode,
    title: "Mock Activity Tour",
    description: "This is a detailed description of the mock activity. Experience the best of the destination with our expert guides.",
    images: [
      { url: "https://via.placeholder.com/800x600", caption: "Main image" },
      { url: "https://via.placeholder.com/800x600", caption: "Gallery 1" },
      { url: "https://via.placeholder.com/800x600", caption: "Gallery 2" },
    ],
    productUrl: "https://www.viator.com/tours/mock",
    rating: 4.7,
    reviewCount: 523,
    duration: {
      fixedDurationInMinutes: 180,
    },
    pricing: {
      summary: {
        fromPrice: 89,
        fromPriceBeforeDiscount: 120,
      },
      currency: "USD",
    },
    location: {
      ref: "New York",
      latitude: 40.7128,
      longitude: -74.006,
      address: "123 Main Street, New York, NY",
    },
    categories: [
      { name: "Tours & Sightseeing" },
      { name: "Cultural & Theme Tours" },
    ],
    bookingInfo: {
      instantConfirmation: true,
      freeCancellation: true,
      cancellationPolicy: "Free cancellation up to 24 hours before the activity starts",
    },
    itinerary: {
      description: "Full day tour with multiple stops",
      duration: "3 hours",
      highlights: [
        "Visit iconic landmarks",
        "Expert local guide",
        "Small group experience",
        "Hotel pickup included",
      ],
    },
    inclusions: [
      "Professional guide",
      "Hotel pickup and drop-off",
      "All entrance fees",
      "Snacks and beverages",
    ],
    exclusions: [
      "Gratuities",
      "Personal expenses",
    ],
    additionalInfo: [
      "Confirmation will be received at time of booking",
      "Not wheelchair accessible",
      "Near public transportation",
      "Most travelers can participate",
    ],
  };
}

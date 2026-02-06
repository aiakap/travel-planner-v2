import { NextRequest, NextResponse } from "next/server";

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

    // Viator API endpoint for product search
    // Note: Using sandbox URL as the current API key is for sandbox only
    const url = "https://api.sandbox.viator.com/partner/products/search";

    const requestBody: any = {
      filtering: {
        destination: destination,
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

    // Tags filter (category is a tag ID number)
    if (category) {
      requestBody.filtering.tags = [Number(category)];
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
      
      // Fall back to mock data instead of returning error
      console.log("[Viator API] Falling back to mock data");
      
      // Parse error for better messaging
      let errorMessage = `Viator API returned ${response.status}. Using mock data.`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.code === "UNAUTHORIZED") {
          errorMessage = "Viator API key is invalid or expired. Using mock data. Try sandbox endpoint or contact affiliateapi@tripadvisor.com";
        } else if (errorJson.code === "BAD_REQUEST") {
          errorMessage = "Viator API key may have limited access (sandbox only, no search permissions). Using mock data.";
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
        }
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      activities: data.products || [],
      total: data.totalCount || 0,
      duration,
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
    // Note: Using sandbox URL as the current API key is for sandbox only
    const url = `https://api.sandbox.viator.com/partner/products/${productCode}`;

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

    return NextResponse.json({
      success: true,
      activity: data,
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

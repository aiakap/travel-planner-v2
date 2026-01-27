import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { location, term, categories, price, limit = 20, offset = 0 } = await request.json();

    if (!location) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.YELP_API_KEY;
    if (!apiKey) {
      // Return mock data for testing without API key
      return NextResponse.json({
        success: true,
        mock: true,
        message: "Using mock data - add YELP_API_KEY to .env for real data",
        businesses: getMockRestaurants(location),
        total: 50,
      });
    }

    const startTime = Date.now();

    // Build query parameters
    const params = new URLSearchParams({
      location,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (term) params.append("term", term);
    if (categories) params.append("categories", categories);
    if (price) params.append("price", price);

    const url = `https://api.yelp.com/v3/businesses/search?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.description || "Failed to fetch restaurant data" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      businesses: data.businesses,
      total: data.total,
      duration,
    });
  } catch (error: any) {
    console.error("[Yelp API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch restaurant data" },
      { status: 500 }
    );
  }
}

// GET endpoint for fetching business details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("id");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.YELP_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        mock: true,
        message: "Using mock data - add YELP_API_KEY to .env for real data",
        business: getMockBusinessDetails(businessId),
      });
    }

    const startTime = Date.now();
    const url = `https://api.yelp.com/v3/businesses/${businessId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.description || "Failed to fetch business details" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      business: data,
      duration,
    });
  } catch (error: any) {
    console.error("[Yelp API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch business details" },
      { status: 500 }
    );
  }
}

// Mock data for testing
function getMockRestaurants(location: string) {
  const cuisines = ["Italian", "Japanese", "Mexican", "French", "American", "Chinese", "Thai", "Indian"];
  const names = ["Bella Vista", "Sakura", "El Toro", "Le Petit", "The Grill", "Dragon Palace", "Spice Garden", "Curry House"];

  return Array.from({ length: 10 }, (_, i) => ({
    id: `mock-restaurant-${i}`,
    name: `${names[i % names.length]} ${location}`,
    image_url: "https://via.placeholder.com/300x200",
    is_closed: false,
    url: `https://www.yelp.com/biz/mock-${i}`,
    review_count: Math.floor(Math.random() * 500) + 50,
    categories: [
      {
        alias: cuisines[i % cuisines.length].toLowerCase(),
        title: cuisines[i % cuisines.length],
      },
    ],
    rating: 3.5 + Math.random() * 1.5,
    coordinates: {
      latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
      longitude: -74.006 + (Math.random() - 0.5) * 0.1,
    },
    transactions: ["delivery", "pickup"],
    price: "$".repeat(Math.floor(Math.random() * 4) + 1),
    location: {
      address1: `${100 + i} Main Street`,
      city: location,
      zip_code: "10001",
      country: "US",
      state: "NY",
      display_address: [`${100 + i} Main Street`, `${location}, NY 10001`],
    },
    phone: "+12125551234",
    display_phone: "(212) 555-1234",
    distance: Math.random() * 5000,
  }));
}

function getMockBusinessDetails(id: string) {
  return {
    id,
    name: "Mock Restaurant",
    image_url: "https://via.placeholder.com/600x400",
    is_claimed: true,
    is_closed: false,
    url: "https://www.yelp.com/biz/mock",
    phone: "+12125551234",
    display_phone: "(212) 555-1234",
    review_count: 250,
    categories: [
      { alias: "italian", title: "Italian" },
      { alias: "pizza", title: "Pizza" },
    ],
    rating: 4.5,
    location: {
      address1: "123 Main Street",
      city: "New York",
      zip_code: "10001",
      country: "US",
      state: "NY",
      display_address: ["123 Main Street", "New York, NY 10001"],
    },
    coordinates: {
      latitude: 40.7128,
      longitude: -74.006,
    },
    photos: [
      "https://via.placeholder.com/600x400",
      "https://via.placeholder.com/600x400",
      "https://via.placeholder.com/600x400",
    ],
    price: "$$",
    hours: [
      {
        open: [
          { is_overnight: false, start: "1100", end: "2200", day: 0 },
          { is_overnight: false, start: "1100", end: "2200", day: 1 },
          { is_overnight: false, start: "1100", end: "2200", day: 2 },
          { is_overnight: false, start: "1100", end: "2200", day: 3 },
          { is_overnight: false, start: "1100", end: "2300", day: 4 },
          { is_overnight: false, start: "1100", end: "2300", day: 5 },
          { is_overnight: false, start: "1200", end: "2100", day: 6 },
        ],
        hours_type: "REGULAR",
        is_open_now: true,
      },
    ],
    transactions: ["delivery", "pickup", "restaurant_reservation"],
  };
}

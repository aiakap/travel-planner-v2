import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { location, type = "current" } = await request.json();

    if (!location) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      // Return mock data for testing without API key
      return NextResponse.json({
        success: true,
        mock: true,
        message: "Using mock data - add OPENWEATHER_API_KEY to .env for real data",
        data: getMockWeatherData(location, type),
      });
    }

    const startTime = Date.now();
    let url: string;

    switch (type) {
      case "current":
        url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;
        break;
      case "forecast":
        url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;
        break;
      case "onecall":
        // For One Call API, we need coordinates
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();
        
        if (!geoData || geoData.length === 0) {
          return NextResponse.json(
            { error: "Location not found" },
            { status: 404 }
          );
        }
        
        const { lat, lon } = geoData[0];
        url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        break;
      default:
        url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;
    }

    const response = await fetch(url);
    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Weather API] Error:", response.status, errorData);
      
      // Fall back to mock data for subscription or auth errors
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({
          success: true,
          mock: true,
          message: `OpenWeather API returned ${response.status}. Using mock data. Check API key or subscription.`,
          data: getMockWeatherData(location, type),
        });
      }
      
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch weather data" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
      duration,
      type,
    });
  } catch (error: any) {
    console.error("[Weather API] Error:", error);
    
    // Fall back to mock data on network errors
    return NextResponse.json({
      success: true,
      mock: true,
      message: "Network error occurred. Using mock data for demonstration.",
      data: getMockWeatherData(location, type),
    });
  }
}

// Mock data for testing without API key
function getMockWeatherData(location: string, type: string) {
  const baseData = {
    coord: { lon: -0.1257, lat: 51.5085 },
    weather: [
      {
        id: 800,
        main: "Clear",
        description: "clear sky",
        icon: "01d",
      },
    ],
    main: {
      temp: 18.5,
      feels_like: 17.8,
      temp_min: 16.2,
      temp_max: 20.1,
      pressure: 1013,
      humidity: 65,
    },
    visibility: 10000,
    wind: {
      speed: 3.5,
      deg: 220,
    },
    clouds: {
      all: 10,
    },
    dt: Date.now() / 1000,
    sys: {
      country: "GB",
      sunrise: Date.now() / 1000 - 3600,
      sunset: Date.now() / 1000 + 7200,
    },
    timezone: 0,
    name: location,
  };

  if (type === "forecast") {
    return {
      ...baseData,
      list: Array.from({ length: 40 }, (_, i) => ({
        dt: Date.now() / 1000 + i * 3 * 3600,
        main: {
          temp: 15 + Math.random() * 10,
          feels_like: 14 + Math.random() * 10,
          temp_min: 12 + Math.random() * 8,
          temp_max: 18 + Math.random() * 8,
          pressure: 1010 + Math.random() * 10,
          humidity: 60 + Math.random() * 20,
        },
        weather: [
          {
            id: 800,
            main: ["Clear", "Clouds", "Rain"][Math.floor(Math.random() * 3)],
            description: "mock weather",
            icon: "01d",
          },
        ],
        wind: {
          speed: 2 + Math.random() * 5,
          deg: Math.random() * 360,
        },
        dt_txt: new Date(Date.now() + i * 3 * 3600 * 1000).toISOString(),
      })),
    };
  }

  return baseData;
}

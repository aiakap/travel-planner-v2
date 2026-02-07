/**
 * OpenWeather API Client
 * Standardized wrapper for OpenWeather API calls
 */

import type { WeatherSourceData } from "@/lib/types/consolidated-place";

const OPENWEATHER_API_BASE = "https://api.openweathermap.org/data/2.5";

// Get API key dynamically
function getApiKey(): string | undefined {
  return process.env.OPENWEATHER_API_KEY;
}

// ============================================================================
// Types
// ============================================================================

export interface WeatherForecastOptions {
  coordinates: { lat: number; lng: number };
  units?: "metric" | "imperial";
  dates?: {
    start: string;
    end: string;
  };
}

export interface WeatherForecastResult {
  weather: WeatherSourceData | null;
  location?: {
    name: string;
    country: string;
  };
  timing: number;
  isForecastForTripDates: boolean;
  forecastNote?: string;
  error?: string;
  isMock?: boolean;
}

export interface CurrentWeatherResult {
  weather: WeatherSourceData | null;
  location?: {
    name: string;
    country: string;
  };
  timing: number;
  error?: string;
  isMock?: boolean;
}

// ============================================================================
// Internal Response Types
// ============================================================================

interface OpenWeatherForecastResponse {
  city: {
    name: string;
    country: string;
    coord: { lat: number; lon: number };
    timezone: number;
  };
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      humidity: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    wind: {
      speed: number;
    };
    pop: number; // Probability of precipitation
  }>;
}

interface OpenWeatherCurrentResponse {
  name: string;
  sys: {
    country: string;
  };
  coord: { lat: number; lon: number };
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
}

// ============================================================================
// Core Client Functions
// ============================================================================

/**
 * Get weather forecast for a location
 */
export async function getForecast(
  options: WeatherForecastOptions
): Promise<WeatherForecastResult> {
  const startTime = Date.now();
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn("[WeatherClient] API key not configured, returning mock data");
    return {
      weather: getMockWeather(options.dates),
      timing: Date.now() - startTime,
      isForecastForTripDates: false,
      forecastNote: "Mock data - API key not configured",
      isMock: true,
    };
  }

  try {
    const units = options.units || "metric";
    const url = `${OPENWEATHER_API_BASE}/forecast?lat=${options.coordinates.lat}&lon=${options.coordinates.lng}&appid=${apiKey}&units=${units}`;

    const response = await fetch(url, {
      next: { revalidate: 600 }, // Cache for 10 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[WeatherClient] API error:", errorText);
      return {
        weather: getMockWeather(options.dates),
        timing: Date.now() - startTime,
        isForecastForTripDates: false,
        forecastNote: "Mock data - API error",
        error: `Weather API error: ${response.status}`,
        isMock: true,
      };
    }

    const data: OpenWeatherForecastResponse = await response.json();

    // Check if trip dates are within forecast range
    const tripStart = options.dates?.start
      ? new Date(options.dates.start)
      : null;
    const forecastEnd = new Date(
      data.list[data.list.length - 1]?.dt * 1000
    );
    const isTripBeyondForecast = tripStart && tripStart > forecastEnd;

    // Group forecasts by day
    const dailyForecasts = groupForecastsByDay(data.list);

    // Transform to our format
    const weather: WeatherSourceData = transformForecast(dailyForecasts[0]);
    weather.forecast = dailyForecasts.slice(1, 6).map(transformForecast);

    return {
      weather,
      location: {
        name: data.city.name,
        country: data.city.country,
      },
      timing: Date.now() - startTime,
      isForecastForTripDates: !isTripBeyondForecast,
      forecastNote: isTripBeyondForecast
        ? "Showing current 5-day forecast as climate reference. Trip dates are beyond forecast range."
        : "Forecast matches trip dates",
    };
  } catch (error) {
    console.error("[WeatherClient] Forecast error:", error);
    return {
      weather: getMockWeather(options.dates),
      timing: Date.now() - startTime,
      isForecastForTripDates: false,
      forecastNote: "Mock data - error occurred",
      error: error instanceof Error ? error.message : "Unknown error",
      isMock: true,
    };
  }
}

/**
 * Get current weather for a location
 */
export async function getCurrentWeather(options: {
  coordinates: { lat: number; lng: number };
  units?: "metric" | "imperial";
}): Promise<CurrentWeatherResult> {
  const startTime = Date.now();
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn("[WeatherClient] API key not configured, returning mock data");
    return {
      weather: getMockWeather(),
      timing: Date.now() - startTime,
      isMock: true,
    };
  }

  try {
    const units = options.units || "metric";
    const url = `${OPENWEATHER_API_BASE}/weather?lat=${options.coordinates.lat}&lon=${options.coordinates.lng}&appid=${apiKey}&units=${units}`;

    const response = await fetch(url, {
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      return {
        weather: getMockWeather(),
        timing: Date.now() - startTime,
        error: `Weather API error: ${response.status}`,
        isMock: true,
      };
    }

    const data: OpenWeatherCurrentResponse = await response.json();

    const weather: WeatherSourceData = {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0]?.description || "Unknown",
      icon: data.weather[0]?.icon || "01d",
      windSpeed: data.wind.speed,
    };

    return {
      weather,
      location: {
        name: data.name,
        country: data.sys.country,
      },
      timing: Date.now() - startTime,
    };
  } catch (error) {
    console.error("[WeatherClient] Current weather error:", error);
    return {
      weather: getMockWeather(),
      timing: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
      isMock: true,
    };
  }
}

/**
 * Get weather for multiple days (simplified)
 */
export async function getMultiDayWeather(options: {
  coordinates: { lat: number; lng: number };
  startDate: string;
  endDate: string;
}): Promise<WeatherSourceData[]> {
  const result = await getForecast({
    coordinates: options.coordinates,
    dates: { start: options.startDate, end: options.endDate },
  });

  if (!result.weather) {
    return [];
  }

  const allDays: WeatherSourceData[] = [result.weather];
  if (result.weather.forecast) {
    allDays.push(...result.weather.forecast);
  }

  return allDays;
}

// ============================================================================
// Helper Functions
// ============================================================================

function groupForecastsByDay(
  forecastList: OpenWeatherForecastResponse["list"]
): OpenWeatherForecastResponse["list"] {
  const dailyMap = new Map<string, typeof forecastList>();

  forecastList.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toISOString().split("T")[0];

    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, []);
    }
    dailyMap.get(dateKey)!.push(item);
  });

  // Get representative forecast for each day (closest to noon)
  const dailyForecasts: typeof forecastList = [];

  dailyMap.forEach((dayItems) => {
    // Calculate daily high/low
    const tempMax = Math.max(...dayItems.map((f) => f.main.temp_max));
    const tempMin = Math.min(...dayItems.map((f) => f.main.temp_min));

    // Find item closest to noon
    const representative = dayItems.reduce((prev, curr) => {
      const prevHour = new Date(prev.dt * 1000).getHours();
      const currHour = new Date(curr.dt * 1000).getHours();
      return Math.abs(currHour - 12) < Math.abs(prevHour - 12) ? curr : prev;
    });

    // Override with calculated high/low
    representative.main.temp_max = tempMax;
    representative.main.temp_min = tempMin;

    dailyForecasts.push(representative);
  });

  return dailyForecasts;
}

function transformForecast(
  item: OpenWeatherForecastResponse["list"][0]
): WeatherSourceData {
  return {
    temperature: Math.round(item.main.temp),
    feelsLike: Math.round(item.main.feels_like),
    humidity: item.main.humidity,
    description: item.weather[0]?.description || "Unknown",
    icon: item.weather[0]?.icon || "01d",
    windSpeed: item.wind.speed,
    precipitation: Math.round(item.pop * 100),
  };
}

// ============================================================================
// Mock Data
// ============================================================================

function getMockWeather(dates?: { start: string; end: string }): WeatherSourceData {
  const startDate = dates?.start ? new Date(dates.start) : new Date();

  const forecast: WeatherSourceData["forecast"] = [];
  for (let i = 1; i < 5; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    forecast.push({
      date: date.toISOString(),
      tempHigh: Math.round(25 + Math.random() * 5),
      tempLow: Math.round(15 + Math.random() * 5),
      description: "partly cloudy",
      icon: "02d",
    });
  }

  return {
    temperature: Math.round(20 + Math.random() * 10),
    feelsLike: Math.round(20 + Math.random() * 10),
    humidity: Math.round(50 + Math.random() * 30),
    description: "partly cloudy",
    icon: "02d",
    windSpeed: Math.round(5 + Math.random() * 10),
    precipitation: Math.round(Math.random() * 50),
    forecast,
  };
}

/**
 * Check if OpenWeather API is configured
 */
export function isConfigured(): boolean {
  return !!getApiKey();
}

/**
 * Get weather icon URL
 */
export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// ============================================================================
// Exports
// ============================================================================

export const weatherClient = {
  getForecast,
  getCurrentWeather,
  getMultiDayWeather,
  getWeatherIconUrl,
  isConfigured,
};

export default weatherClient;

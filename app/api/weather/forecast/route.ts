import { NextResponse } from 'next/server'

// Helper: Group forecasts by day and pick midday forecast
function groupForecastsByDay(forecastList: any[]) {
  const dailyForecasts = new Map<string, any>();
  
  forecastList.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Pick forecast closest to noon (12:00)
    const hour = date.getHours();
    if (!dailyForecasts.has(dateKey) || Math.abs(hour - 12) < Math.abs(dailyForecasts.get(dateKey).hour - 12)) {
      dailyForecasts.set(dateKey, { ...item, hour });
    }
  });
  
  return Array.from(dailyForecasts.values());
}

export async function POST(request: Request) {
  try {
    const { lat, lng, dates } = await request.json()
    
    console.log('=== WEATHER API REQUEST ===');
    console.log('Coordinates:', { lat, lng });
    console.log('Dates:', dates);
    
    const apiKey = process.env.OPENWEATHER_API_KEY
    console.log('API Key configured:', !!apiKey);
    if (!apiKey) {
      // Return mock data if API key not configured
      return NextResponse.json({
        location: "Unknown Location",
        country: "XX",
        isForecastForTripDates: false,
        forecastNote: 'Mock data - API key not configured',
        forecast: generateMockForecast(dates)
      })
    }
    
    // Fetch 5-day forecast from OpenWeather
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    const response = await fetch(url, {
      next: { revalidate: 600 } // Cache for 10 minutes
    })
    
    console.log('OpenWeather API response status:', response.status);
    
    if (!response.ok) {
      console.error('OpenWeather API error:', await response.text());
      throw new Error('Weather API request failed')
    }
    
    const data = await response.json()
    
    console.log('Raw data received:', {
      cityName: data.city?.name,
      country: data.city?.country,
      totalForecasts: data.list?.length
    });
    
    // Always return available forecast data
    // OpenWeather 5-day forecast only provides next 5 days from today
    // For trips beyond 5 days, we show current forecast as climate reference
    let forecast = data.list
    
    console.log('Available forecast data:', {
      totalForecasts: forecast.length,
      dateRange: {
        from: new Date(forecast[0]?.dt * 1000).toISOString(),
        to: new Date(forecast[forecast.length - 1]?.dt * 1000).toISOString()
      },
      requestedDates: dates
    });
    
    // Check if trip dates are within forecast range
    const tripStart = dates?.start ? new Date(dates.start) : null;
    const forecastEnd = new Date(forecast[forecast.length - 1]?.dt * 1000);
    const isTripBeyondForecast = tripStart && tripStart > forecastEnd;
    
    if (isTripBeyondForecast) {
      console.log('ℹ️  Trip dates are beyond 5-day forecast range. Showing current forecast as climate reference.');
    }
    
    // Group forecasts by day (pick midday forecast from 3-hour intervals)
    const dailyForecasts = groupForecastsByDay(forecast);
    
    console.log('Daily forecasts grouped:', dailyForecasts.length);
    
    return NextResponse.json({
      location: data.city.name,
      country: data.city.country,
      isForecastForTripDates: !isTripBeyondForecast,
      forecastNote: isTripBeyondForecast 
        ? 'Showing current 5-day forecast as climate reference. Trip dates are beyond forecast range.'
        : 'Forecast matches trip dates',
      forecast: dailyForecasts.map((item: any) => ({
        date: new Date(item.dt * 1000).toISOString(),
        temp: Math.round(item.main.temp),
        feels_like: Math.round(item.main.feels_like),
        temp_min: Math.round(item.main.temp_min),
        temp_max: Math.round(item.main.temp_max),
        humidity: item.main.humidity,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        wind_speed: item.wind.speed,
        precipitation: item.pop * 100,  // Probability of precipitation as percentage
      }))
    })
  } catch (error) {
    console.error('=== WEATHER API ERROR ===');
    console.error('Error details:', error);
    console.error('Returning mock data');
    
    // Return mock data on error
    return NextResponse.json({
      location: "Unknown Location",
      country: "XX",
      isForecastForTripDates: false,
      forecastNote: 'Mock data - API key not configured or error occurred',
      forecast: generateMockForecast()
    })
  }
}

function generateMockForecast(dates?: { start: string, end: string }) {
  const startDate = dates?.start ? new Date(dates.start) : new Date()
  const forecast = []
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    forecast.push({
      date: date.toISOString(),
      temp: Math.round(20 + Math.random() * 10),
      feels_like: Math.round(20 + Math.random() * 10),
      temp_min: Math.round(15 + Math.random() * 5),
      temp_max: Math.round(25 + Math.random() * 5),
      humidity: Math.round(50 + Math.random() * 30),
      description: "partly cloudy",
      icon: "02d",
      wind_speed: Math.round(5 + Math.random() * 10),
      precipitation: Math.round(Math.random() * 50),
    })
  }
  
  return forecast
}

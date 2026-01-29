import { NextResponse } from 'next/server'

// Helper: Group forecasts by time period (morning, afternoon, evening)
function groupForecastsByTimePeriod(forecasts: any[]) {
  const morning: any[] = [];
  const afternoon: any[] = [];
  const evening: any[] = [];
  
  forecasts.forEach(item => {
    const hour = new Date(item.dt * 1000).getHours();
    
    // Morning: 6:00 AM - 12:00 PM (6, 9) - note: 12 goes to afternoon
    if (hour >= 6 && hour < 12) {
      morning.push(item);
    }
    // Afternoon: 12:00 PM - 6:00 PM (12, 15, 18) - note: 18 goes to evening
    else if (hour >= 12 && hour < 18) {
      afternoon.push(item);
    }
    // Evening: 6:00 PM - 6:00 AM next day (18, 21, 0, 3)
    // Note: 0 and 3 are early morning hours but included in evening for the day they belong to
    else if (hour >= 18 || hour < 6) {
      evening.push(item);
    }
  });
  
  // Calculate high/low for each period and get representative forecast
  const getPeriodData = (periodForecasts: any[], periodName: string) => {
    if (periodForecasts.length === 0) {
      return null;
    }
    
    const tempMax = Math.max(...periodForecasts.map((f: any) => f.main.temp_max));
    const tempMin = Math.min(...periodForecasts.map((f: any) => f.main.temp_min));
    
    // Get representative forecast (middle of period)
    let representative = periodForecasts[0];
    if (periodName === 'morning') {
      // Prefer 9am or closest to it
      representative = periodForecasts.reduce((prev, curr) => {
        const prevHour = new Date(prev.dt * 1000).getHours();
        const currHour = new Date(curr.dt * 1000).getHours();
        return Math.abs(currHour - 9) < Math.abs(prevHour - 9) ? curr : prev;
      });
    } else if (periodName === 'afternoon') {
      // Prefer 3pm or closest to it
      representative = periodForecasts.reduce((prev, curr) => {
        const prevHour = new Date(prev.dt * 1000).getHours();
        const currHour = new Date(curr.dt * 1000).getHours();
        return Math.abs(currHour - 15) < Math.abs(prevHour - 15) ? curr : prev;
      });
    } else if (periodName === 'evening') {
      // Prefer 9pm or closest to it
      representative = periodForecasts.reduce((prev, curr) => {
        const prevHour = new Date(curr.dt * 1000).getHours();
        const currHour = prevHour >= 18 ? prevHour : prevHour + 24;
        const prevHourAdj = new Date(prev.dt * 1000).getHours();
        const prevHourAdj2 = prevHourAdj >= 18 ? prevHourAdj : prevHourAdj + 24;
        return Math.abs(currHour - 21) < Math.abs(prevHourAdj2 - 21) ? curr : prev;
      });
    }
    
    return {
      temp_min: Math.round(tempMin),
      temp_max: Math.round(tempMax),
      temp: Math.round(representative.main.temp),
      description: representative.weather[0].description,
      icon: representative.weather[0].icon
    };
  };
  
  return {
    morning: getPeriodData(morning, 'morning'),
    afternoon: getPeriodData(afternoon, 'afternoon'),
    evening: getPeriodData(evening, 'evening')
  };
}

// Helper: Group forecasts by day and calculate true daily high/low with time periods
function groupForecastsByDay(forecastList: any[]) {
  const dailyForecasts = new Map<string, any>();
  
  // First pass: collect all forecasts for each day
  forecastList.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dailyForecasts.has(dateKey)) {
      dailyForecasts.set(dateKey, {
        forecasts: [],
        representative: null,
        representativeHour: null
      });
    }
    
    const dayData = dailyForecasts.get(dateKey);
    dayData.forecasts.push(item);
    
    // Track forecast closest to noon (12:00) for representative data
    const hour = date.getHours();
    if (!dayData.representative || Math.abs(hour - 12) < Math.abs(dayData.representativeHour - 12)) {
      dayData.representative = item;
      dayData.representativeHour = hour;
    }
  });
  
  // Second pass: calculate daily high/low and time periods, return aggregated data
  return Array.from(dailyForecasts.entries()).map(([dateKey, dayData]) => {
    const forecasts = dayData.forecasts;
    const representative = dayData.representative;
    
    // Calculate true daily high/low from all forecasts for the day
    const dailyMax = Math.max(...forecasts.map((f: any) => f.main.temp_max));
    const dailyMin = Math.min(...forecasts.map((f: any) => f.main.temp_min));
    
    // Calculate time period data
    const timePeriods = groupForecastsByTimePeriod(forecasts);
    
    // Use representative forecast for other fields (description, icon, etc.)
    return {
      ...representative,
      main: {
        ...representative.main,
        temp_max: dailyMax,
        temp_min: dailyMin
      },
      timePeriods
    };
  });
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
        morning: item.timePeriods.morning,
        afternoon: item.timePeriods.afternoon,
        evening: item.timePeriods.evening,
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
      morning: {
        temp_min: Math.round(15 + Math.random() * 3),
        temp_max: Math.round(18 + Math.random() * 4),
        temp: Math.round(17 + Math.random() * 3),
        description: "partly cloudy",
        icon: "02d"
      },
      afternoon: {
        temp_min: Math.round(20 + Math.random() * 3),
        temp_max: Math.round(25 + Math.random() * 5),
        temp: Math.round(23 + Math.random() * 3),
        description: "partly cloudy",
        icon: "02d"
      },
      evening: {
        temp_min: Math.round(18 + Math.random() * 3),
        temp_max: Math.round(22 + Math.random() * 3),
        temp: Math.round(20 + Math.random() * 2),
        description: "partly cloudy",
        icon: "02n"
      },
    })
  }
  
  return forecast
}

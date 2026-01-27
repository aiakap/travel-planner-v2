import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { lat, lng, dates } = await request.json()
    
    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) {
      // Return mock data if API key not configured
      return NextResponse.json({
        location: "Unknown Location",
        country: "XX",
        forecast: generateMockForecast(dates)
      })
    }
    
    // Fetch 5-day forecast from OpenWeather
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    const response = await fetch(url, {
      next: { revalidate: 600 } // Cache for 10 minutes
    })
    
    if (!response.ok) {
      throw new Error('Weather API request failed')
    }
    
    const data = await response.json()
    
    // Filter to relevant dates if provided
    let forecast = data.list
    if (dates?.start && dates?.end) {
      const start = new Date(dates.start)
      const end = new Date(dates.end)
      forecast = forecast.filter((item: any) => {
        const itemDate = new Date(item.dt * 1000)
        return itemDate >= start && itemDate <= end
      })
    }
    
    return NextResponse.json({
      location: data.city.name,
      country: data.city.country,
      forecast: forecast.map((item: any) => ({
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
    console.error('Weather fetch error:', error)
    
    // Return mock data on error
    return NextResponse.json({
      location: "Unknown Location",
      country: "XX",
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

/**
 * PDF Weather Component
 * 
 * Displays weather forecast data in a table format.
 * Shows actual forecasts for days within the 5-day forecast window,
 * and marks historical averages/estimates for dates beyond that.
 */

import React from 'react'
import { View, Text } from '@react-pdf/renderer'
import { styles } from './styles'
import { formatLocalDate } from '@/lib/utils/local-time'
import type { WeatherData, WeatherForecast } from '@/lib/itinerary-view-types'

interface PDFWeatherProps {
  weather: WeatherData[]
  tripStartDate: string
  tripEndDate: string
}

/**
 * Get weather icon as text representation
 */
function getWeatherIcon(icon: string): string {
  const iconMap: Record<string, string> = {
    '01d': '☀️',  // clear sky day
    '01n': '🌙',  // clear sky night
    '02d': '⛅',  // few clouds day
    '02n': '☁️',  // few clouds night
    '03d': '☁️',  // scattered clouds
    '03n': '☁️',
    '04d': '☁️',  // broken clouds
    '04n': '☁️',
    '09d': '🌧️', // shower rain
    '09n': '🌧️',
    '10d': '🌦️', // rain day
    '10n': '🌧️', // rain night
    '11d': '⛈️', // thunderstorm
    '11n': '⛈️',
    '13d': '❄️', // snow
    '13n': '❄️',
    '50d': '🌫️', // mist
    '50n': '🌫️',
  }
  return iconMap[icon] || '🌤️'
}

/**
 * Format temperature for display
 * Input is in Celsius, output shows both F and C
 */
function formatTemp(celsius: number): string {
  const fahrenheit = Math.round((celsius * 9/5) + 32)
  return `${fahrenheit}°F (${Math.round(celsius)}°C)`
}

/**
 * Format temperature range
 */
function formatTempRange(minCelsius: number, maxCelsius: number): string {
  const minF = Math.round((minCelsius * 9/5) + 32)
  const maxF = Math.round((maxCelsius * 9/5) + 32)
  return `${minF}°-${maxF}°F`
}

export function PDFWeather({ weather, tripStartDate, tripEndDate }: PDFWeatherProps) {
  if (!weather || weather.length === 0) {
    return (
      <View style={styles.weatherSection}>
        <Text style={styles.sectionHeader}>Weather Forecast</Text>
        <Text style={styles.weatherNote}>
          Weather data will be available closer to your trip dates. Check the app for the latest forecast.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.weatherSection}>
      <Text style={styles.sectionHeader}>Weather Forecast</Text>
      
      {weather.map((locationWeather, locIndex) => (
        <View key={locIndex} style={styles.weatherLocationCard}>
          {/* Location header */}
          <View style={styles.weatherLocationHeader}>
            <Text style={styles.weatherLocationName}>
              {locationWeather.location}, {locationWeather.country}
            </Text>
            {locationWeather.isForecastForTripDates === false && (
              <Text style={styles.weatherEstimateBadge}>Climate Reference</Text>
            )}
            {locationWeather.isForecastForTripDates === true && (
              <Text style={styles.weatherForecastBadge}>Live Forecast</Text>
            )}
          </View>
          
          {locationWeather.forecastNote && (
            <Text style={styles.weatherForecastNote}>{locationWeather.forecastNote}</Text>
          )}
          
          {/* Weather table */}
          <View style={styles.weatherTable}>
            {/* Table header */}
            <View style={styles.weatherTableHeader}>
              <Text style={[styles.weatherTableCell, styles.weatherCellDate]}>Date</Text>
              <Text style={[styles.weatherTableCell, styles.weatherCellConditions]}>Conditions</Text>
              <Text style={[styles.weatherTableCell, styles.weatherCellTemp]}>High/Low</Text>
              <Text style={[styles.weatherTableCell, styles.weatherCellDetails]}>Details</Text>
            </View>
            
            {/* Weather rows */}
            {locationWeather.forecast.slice(0, 7).map((day, dayIndex) => (
              <View key={dayIndex} style={styles.weatherTableRow}>
                <Text style={[styles.weatherTableCell, styles.weatherCellDate]}>
                  {formatLocalDate(day.date, 'weekday-short')}
                </Text>
                <View style={[styles.weatherTableCell, styles.weatherCellConditions]}>
                  <Text>{getWeatherIcon(day.icon)} {day.description}</Text>
                </View>
                <Text style={[styles.weatherTableCell, styles.weatherCellTemp]}>
                  {formatTempRange(day.temp_min, day.temp_max)}
                </Text>
                <View style={[styles.weatherTableCell, styles.weatherCellDetails]}>
                  <Text style={styles.weatherDetailText}>
                    Humidity: {day.humidity}%
                    {day.precipitation > 0 && ` • Rain: ${Math.round(day.precipitation * 100)}%`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          
          {/* Time period breakdown if available */}
          {locationWeather.forecast[0]?.morning && (
            <View style={styles.weatherTimePeriods}>
              <Text style={styles.weatherTimePeriodsTitle}>Typical Day Breakdown:</Text>
              <View style={styles.weatherTimePeriodsRow}>
                <View style={styles.weatherTimePeriod}>
                  <Text style={styles.weatherTimePeriodLabel}>Morning</Text>
                  <Text style={styles.weatherTimePeriodTemp}>
                    {formatTemp(locationWeather.forecast[0].morning.temp)}
                  </Text>
                </View>
                {locationWeather.forecast[0].afternoon && (
                  <View style={styles.weatherTimePeriod}>
                    <Text style={styles.weatherTimePeriodLabel}>Afternoon</Text>
                    <Text style={styles.weatherTimePeriodTemp}>
                      {formatTemp(locationWeather.forecast[0].afternoon.temp)}
                    </Text>
                  </View>
                )}
                {locationWeather.forecast[0].evening && (
                  <View style={styles.weatherTimePeriod}>
                    <Text style={styles.weatherTimePeriodLabel}>Evening</Text>
                    <Text style={styles.weatherTimePeriodTemp}>
                      {formatTemp(locationWeather.forecast[0].evening.temp)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      ))}
    </View>
  )
}

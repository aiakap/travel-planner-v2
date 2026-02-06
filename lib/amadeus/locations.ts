/**
 * Amadeus Location/City Search Functions
 * 
 * Provides utilities for searching cities, airports, and locations
 * Replaces hard-coded city mappings with dynamic API calls
 */

import { getAmadeusClient } from '@/lib/flights/amadeus-client';
import { parseAmadeusError } from './errors';
import { validateCities } from './schemas';

/**
 * City search result
 */
export interface City {
  type: string;
  subType: string;
  name: string;
  detailedName?: string;
  id: string;
  iataCode: string;
  address?: {
    cityName?: string;
    cityCode?: string;
    countryName?: string;
    countryCode?: string;
    regionCode?: string;
  };
  geoCode?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Search for cities by keyword
 * @param keyword Search term (e.g., "Paris", "London")
 * @param max Maximum number of results (default: 10)
 * @returns Array of matching cities
 */
export async function searchCities(keyword: string, max: number = 10): Promise<City[]> {
  const amadeus = getAmadeusClient();

  try {
    console.log(`🌍 Searching cities: "${keyword}"`);
    
    const response = await amadeus.referenceData.locations.cities.get({
      keyword,
      max,
    });

    console.log(`✅ Found ${response.data.length} cities`);

    // Validate response
    const validation = validateCities(response.data);
    
    if (!validation.success) {
      console.warn('City search validation failed, using raw data');
      return response.data as City[];
    }

    return validation.data as City[];
  } catch (error) {
    console.error('City search failed:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

/**
 * Search for a single city and get its IATA code
 * @param keyword Search term
 * @returns IATA code or null if not found
 */
export async function getCityCode(keyword: string): Promise<string | null> {
  try {
    const cities = await searchCities(keyword, 1);
    
    if (cities.length === 0) {
      return null;
    }

    return cities[0].iataCode;
  } catch (error) {
    console.error(`Failed to get city code for "${keyword}":`, error);
    return null;
  }
}

/**
 * Search for airports by keyword
 * @param keyword Search term (e.g., "New York", "JFK")
 * @param max Maximum number of results (default: 10)
 */
export async function searchAirports(keyword: string, max: number = 10): Promise<any[]> {
  try {
    console.log(`✈️  Searching airports: "${keyword}"`);
    console.log(`🔑 Amadeus credentials check:`, {
      clientId: process.env.AMADEUS_CLIENT_ID ? 'Set' : 'Missing',
      clientSecret: process.env.AMADEUS_CLIENT_SECRET ? 'Set' : 'Missing',
    });
    
    const amadeus = getAmadeusClient();
    
    console.log('📡 Making Amadeus API call...');
    const response = await amadeus.referenceData.locations.get({
      keyword,
      subType: 'AIRPORT',
      'page[limit]': max,
    });

    console.log(`✅ Found ${response.data.length} airports`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Airport search failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      description: error.description,
      response: error.response?.result,
    });
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

/**
 * Get city or airport by IATA code
 * @param iataCode 3-letter IATA code (e.g., "PAR", "JFK")
 */
export async function getLocationByCode(iataCode: string): Promise<any | null> {
  const amadeus = getAmadeusClient();

  try {
    const response = await amadeus.referenceData.location(iataCode).get();
    return response.data;
  } catch (error) {
    console.error(`Failed to get location for code "${iataCode}":`, error);
    return null;
  }
}

/**
 * Find nearest airports to coordinates
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @param radius Search radius in kilometers (default: 50)
 */
export async function findNearestAirports(
  latitude: number,
  longitude: number,
  radius: number = 50
): Promise<any[]> {
  const amadeus = getAmadeusClient();

  try {
    console.log(`🗺️  Finding airports near (${latitude}, ${longitude})`);
    
    const response = await amadeus.referenceData.locations.airports.get({
      latitude,
      longitude,
      radius,
    });

    console.log(`✅ Found ${response.data.length} nearby airports`);
    return response.data;
  } catch (error) {
    console.error('Nearby airport search failed:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

/**
 * Batch resolve city codes for multiple location queries
 * Useful for resolving multiple cities at once
 */
export async function resolveCityCodes(locationQueries: string[]): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();

  // Process in parallel for better performance
  await Promise.all(
    locationQueries.map(async (query) => {
      const code = await getCityCode(query);
      results.set(query, code);
    })
  );

  return results;
}

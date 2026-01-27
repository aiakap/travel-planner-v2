import { NextRequest, NextResponse } from 'next/server';
import {
  searchFlightInspiration,
  searchFlightCheapestDates,
  analyzeFlightPrice,
  predictFlightDelay,
  getAirportRoutes,
  getNearbyAirports,
  getAirportOnTimePerformance,
  lookupAirlineCode,
  getAirlineRoutes,
  getFlightCheckinLinks,
  getFlightStatus,
  searchHotelsByCity,
  searchHotelsByGeocode,
  searchHotelsByIds,
  autocompleteHotelName,
  getHotelRatings,
  searchToursActivities,
  searchToursActivitiesBySquare,
  getActivityDetails,
} from '@/lib/flights/amadeus-client';
import { isAmadeusError, getErrorMessage } from '@/lib/amadeus/errors';

const AMADEUS_SDK_VERSION = '11.0.0';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { apiType, params } = body;

    console.log(`\n🧪 Amadeus Advanced API Test - ${apiType}`);
    console.log('Request params:', JSON.stringify(params, null, 2));

    const apiStartTime = Date.now();
    let results: any;

    try {
      switch (apiType) {
        // Flight Discovery
        case 'flight-inspiration':
          results = await searchFlightInspiration(params);
          break;
        case 'flight-cheapest-dates':
          results = await searchFlightCheapestDates(params);
          break;

        // Flight Intelligence
        case 'flight-price-analysis':
          results = await analyzeFlightPrice(params);
          break;
        case 'flight-delay-prediction':
          results = await predictFlightDelay(params);
          break;

        // Airport Intelligence
        case 'airport-routes':
          results = await getAirportRoutes(params.airportCode, params.max);
          break;
        case 'airport-nearby':
          results = await getNearbyAirports(params);
          break;
        case 'airport-ontime':
          results = await getAirportOnTimePerformance(params.airportCode, params.date);
          break;

        // Airline Information
        case 'airline-lookup':
          results = await lookupAirlineCode(params.airlineCodes);
          break;
        case 'airline-routes':
          results = await getAirlineRoutes(params.airlineCode, params.max);
          break;
        case 'flight-checkin-links':
          results = await getFlightCheckinLinks(params.airlineCode, params.language);
          break;
        case 'flight-status':
          results = await getFlightStatus(params);
          break;

        // Hotel Discovery
        case 'hotel-list-city':
          results = await searchHotelsByCity(params);
          break;
        case 'hotel-list-geocode':
          results = await searchHotelsByGeocode(params);
          break;
        case 'hotel-list-ids':
          results = await searchHotelsByIds(params.hotelIds);
          break;
        case 'hotel-autocomplete':
          results = await autocompleteHotelName(params);
          break;
        case 'hotel-ratings':
          results = await getHotelRatings(params.hotelIds);
          break;

        // Destination Content
        case 'tours-activities':
          results = await searchToursActivities(params);
          break;
        case 'tours-activities-square':
          results = await searchToursActivitiesBySquare(params);
          break;
        case 'activity-details':
          results = await getActivityDetails(params.activityId);
          break;

        default:
          return NextResponse.json(
            {
              success: false,
              error: {
                message: `Invalid API type: ${apiType}`,
                code: 'INVALID_API_TYPE',
                statusCode: 400,
              },
            },
            { status: 400 }
          );
      }

      const apiDuration = Date.now() - apiStartTime;
      const totalDuration = Date.now() - startTime;

      console.log(`✅ Success: ${apiType} completed in ${apiDuration}ms`);

      return NextResponse.json({
        success: true,
        apiType,
        params,
        results: Array.isArray(results) ? results : [results],
        count: Array.isArray(results) ? results.length : 1,
        meta: {
          sdkVersion: AMADEUS_SDK_VERSION,
          timing: {
            total: totalDuration,
            api: apiDuration,
          },
          environment: 'test',
        },
      });
    } catch (error: any) {
      const apiDuration = Date.now() - apiStartTime;
      const totalDuration = Date.now() - startTime;

      console.error(`❌ ${apiType} failed:`, error);

      const errorResponse = {
        success: false,
        apiType,
        params,
        error: {
          message: getErrorMessage(error),
          code: error.code || 'UNKNOWN_ERROR',
          statusCode: error.statusCode || 500,
          details: error.details || error.message,
          userMessage: isAmadeusError(error) ? error.getUserMessage() : error.message,
          debugInfo: isAmadeusError(error)
            ? error.getDebugInfo()
            : {
                name: error.name,
                message: error.message,
                stack: error.stack,
              },
        },
        meta: {
          sdkVersion: AMADEUS_SDK_VERSION,
          timing: {
            total: totalDuration,
            api: apiDuration,
          },
          environment: 'test',
        },
      };

      const statusCode = error.statusCode || 400;
      return NextResponse.json(errorResponse, { status: statusCode });
    }
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;

    console.error('❌ API route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to process request',
          code: 'ROUTE_ERROR',
          statusCode: 500,
        },
        meta: {
          sdkVersion: AMADEUS_SDK_VERSION,
          timing: {
            total: totalDuration,
          },
          environment: 'test',
        },
      },
      { status: 500 }
    );
  }
}

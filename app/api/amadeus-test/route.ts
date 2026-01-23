import { NextRequest, NextResponse } from 'next/server';
import { searchFlights, searchHotels, FlightSearchParams, HotelSearchParams } from '@/lib/flights/amadeus-client';
import { isAmadeusError, getErrorMessage } from '@/lib/amadeus/errors';

// Get Amadeus SDK version
const AMADEUS_SDK_VERSION = '11.0.0';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { type, params } = body;

    console.log(`\n🧪 Amadeus API Test - ${type.toUpperCase()}`);
    console.log('Request params:', JSON.stringify(params, null, 2));

    if (type === 'flight') {
      const flightParams = params as FlightSearchParams;
      const apiStartTime = Date.now();
      
      try {
        const flights = await searchFlights(flightParams);
        const apiDuration = Date.now() - apiStartTime;
        const totalDuration = Date.now() - startTime;
        
        console.log(`✅ Success: Found ${flights.length} flight offers in ${apiDuration}ms`);
        
        return NextResponse.json({
          success: true,
          type: 'flight',
          params: flightParams,
          results: flights,
          count: flights.length,
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
        
        console.error('❌ Flight search failed:', error);
        
        // Use our structured error handling
        const errorResponse = {
          success: false,
          type: 'flight',
          params: flightParams,
          error: {
            message: getErrorMessage(error),
            code: error.code || 'UNKNOWN_ERROR',
            statusCode: error.statusCode || 500,
            details: error.details || error.message,
            userMessage: isAmadeusError(error) ? error.getUserMessage() : error.message,
            debugInfo: isAmadeusError(error) ? error.getDebugInfo() : {
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
    } else if (type === 'hotel') {
      const hotelParams = params as HotelSearchParams;
      const apiStartTime = Date.now();
      
      try {
        const hotels = await searchHotels(hotelParams);
        const apiDuration = Date.now() - apiStartTime;
        const totalDuration = Date.now() - startTime;
        
        console.log(`✅ Success: Found ${hotels.length} hotel offers in ${apiDuration}ms`);
        
        return NextResponse.json({
          success: true,
          type: 'hotel',
          params: hotelParams,
          results: hotels,
          count: hotels.length,
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
        
        console.error('❌ Hotel search failed:', error);
        
        // Use our structured error handling
        const errorResponse = {
          success: false,
          type: 'hotel',
          params: hotelParams,
          error: {
            message: getErrorMessage(error),
            code: error.code || 'UNKNOWN_ERROR',
            statusCode: error.statusCode || 500,
            details: error.details || error.message,
            userMessage: isAmadeusError(error) ? error.getUserMessage() : error.message,
            debugInfo: isAmadeusError(error) ? error.getDebugInfo() : {
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
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: {
            message: 'Invalid type. Must be "flight" or "hotel"',
            code: 'INVALID_TYPE',
            statusCode: 400,
          }
        },
        { status: 400 }
      );
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

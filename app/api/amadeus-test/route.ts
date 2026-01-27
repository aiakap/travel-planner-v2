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
      const flightParams = params as any;
      
      // Transform parameters to match client expectations
      const transformedParams: FlightSearchParams = {
        origin: flightParams.originLocationCode || flightParams.origin,
        destination: flightParams.destinationLocationCode || flightParams.destination,
        departureDate: flightParams.departureDate,
        adults: flightParams.adults,
        returnDate: flightParams.returnDate,
        max: flightParams.max
      };
      
      const apiStartTime = Date.now();
      
      try {
        const flights = await searchFlights(transformedParams);
        const apiDuration = Date.now() - apiStartTime;
        const totalDuration = Date.now() - startTime;
        
        console.log(`✅ Success: Found ${flights.length} flight offers in ${apiDuration}ms`);
        
        return NextResponse.json({
          success: true,
          type: 'flight',
          params: transformedParams,
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
          params: transformedParams,
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
      
      console.log('🔍 [API ROUTE] Hotel search request received');
      console.log('📋 [API ROUTE] Parameters:', JSON.stringify(hotelParams, null, 2));
      
      try {
        const hotels = await searchHotels(hotelParams);
        const apiDuration = Date.now() - apiStartTime;
        const totalDuration = Date.now() - startTime;
        
        console.log(`✅ [API ROUTE] Success: Found ${hotels.length} hotel offers in ${apiDuration}ms`);
        
        const response = {
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
          debug: {
            requestParams: hotelParams,
            resultCount: hotels.length,
            sampleResult: hotels[0] || null,
          }
        };
        
        console.log('📤 [API ROUTE] Sending response:', JSON.stringify(response, null, 2));
        return NextResponse.json(response);
      } catch (error: any) {
        const apiDuration = Date.now() - apiStartTime;
        const totalDuration = Date.now() - startTime;
        
        console.error('❌ [API ROUTE] Hotel search failed:', error);
        console.error('❌ [API ROUTE] Error name:', error.name);
        console.error('❌ [API ROUTE] Error message:', error.message);
        console.error('❌ [API ROUTE] Error stack:', error.stack);
        
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
          debug: {
            requestParams: hotelParams,
            errorType: error.constructor.name,
            errorString: String(error),
          }
        };
        
        console.log('📤 [API ROUTE] Sending error response:', JSON.stringify(errorResponse, null, 2));
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

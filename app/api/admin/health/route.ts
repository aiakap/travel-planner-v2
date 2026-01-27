import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables for each API
    const googleMaps = {
      configured: !!(process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
      hasKey: !!process.env.GOOGLE_MAPS_API_KEY,
      hasPublicKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    };

    const amadeus = {
      configured: !!(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET),
      hasClientId: !!process.env.AMADEUS_CLIENT_ID,
      hasClientSecret: !!process.env.AMADEUS_CLIENT_SECRET,
      environment: process.env.AMADEUS_HOSTNAME || 'test',
    };

    const openai = {
      configured: !!process.env.OPENAI_API_KEY,
      hasKey: !!process.env.OPENAI_API_KEY,
    };

    const imagen = {
      configured: !!(
        process.env.GOOGLE_CLOUD_PROJECT && 
        process.env.GOOGLE_APPLICATION_CREDENTIALS
      ),
      hasProject: !!process.env.GOOGLE_CLOUD_PROJECT,
      hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
      model: process.env.IMAGEN_MODEL || 'imagen-4.0-generate-001',
    };

    const uploadthing = {
      configured: !!(process.env.UPLOADTHING_SECRET && process.env.UPLOADTHING_APP_ID),
      hasSecret: !!process.env.UPLOADTHING_SECRET,
      hasAppId: !!process.env.UPLOADTHING_APP_ID,
    };

    const weather = {
      configured: !!process.env.OPENWEATHER_API_KEY,
      hasKey: !!process.env.OPENWEATHER_API_KEY,
    };

    const yelp = {
      configured: !!process.env.YELP_API_KEY,
      hasKey: !!process.env.YELP_API_KEY,
    };

    const viator = {
      configured: !!process.env.VIATOR_API_KEY,
      hasKey: !!process.env.VIATOR_API_KEY,
    };

    return NextResponse.json({
      googleMaps,
      amadeus,
      openai,
      imagen,
      uploadthing,
      weather,
      yelp,
      viator,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Failed to check API health' },
      { status: 500 }
    );
  }
}

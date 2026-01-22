import { NextRequest, NextResponse } from 'next/server';
import { searchFlights } from '@/lib/flights/amadeus-client';

export async function POST(request: NextRequest) {
  try {
    const params = await request.json();
    
    const flights = await searchFlights(params);
    
    return NextResponse.json({ flights });
  } catch (error: any) {
    console.error('Flight search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search flights' },
      { status: 500 }
    );
  }
}

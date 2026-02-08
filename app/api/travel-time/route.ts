import { NextRequest, NextResponse } from 'next/server';
import { calculateTravelTime } from '@/lib/google-maps/calculate-travel-time';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');

  if (!origin || !destination) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin and destination' },
      { status: 400 }
    );
  }

  try {
    const result = await calculateTravelTime(origin, destination);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating travel time:', error);
    return NextResponse.json(
      { error: 'Failed to calculate travel time' },
      { status: 500 }
    );
  }
}

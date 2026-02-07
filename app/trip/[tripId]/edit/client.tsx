"use client";

import { useRouter } from 'next/navigation';
import { JourneyManager } from '../../new/components/journey-manager';
import { HomeLocationData } from '@/lib/types/home-location';

interface TripEditPageClientProps {
  segmentTypeMap: Record<string, string>;
  homeLocation?: HomeLocationData | null;
  initialTrip: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    description?: string | null;
  };
  initialSegments: Array<{
    id: string;
    name: string;
    days: number;
    startTitle: string;
    imageUrl: string | null;
    startLat?: number | null;
    startLng?: number | null;
    segmentType?: { name: string } | null;
  }>;
}

export default function TripEditPageClient({ 
  segmentTypeMap, 
  homeLocation,
  initialTrip,
  initialSegments 
}: TripEditPageClientProps) {
  const router = useRouter();

  return (
    <JourneyManager 
      segmentTypeMap={segmentTypeMap}
      homeLocation={homeLocation}
      initialTrip={initialTrip}
      initialSegments={initialSegments}
      onComplete={(tripId) => router.push(`/exp?tripId=${tripId}`)}
    />
  );
}

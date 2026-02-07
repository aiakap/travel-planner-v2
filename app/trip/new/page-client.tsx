"use client";

import { useRouter } from 'next/navigation';
import { JourneyManager } from './components/journey-manager';
import { HomeLocationData } from '@/lib/types/home-location';

interface TripBuilderPageClientProps {
  segmentTypeMap: Record<string, string>;
  homeLocation?: HomeLocationData | null;
}

export default function TripBuilderPageClient({ segmentTypeMap, homeLocation }: TripBuilderPageClientProps) {
  const router = useRouter();

  return (
    <JourneyManager 
      segmentTypeMap={segmentTypeMap}
      homeLocation={homeLocation}
      onComplete={(tripId) => router.push(`/exp?tripId=${tripId}`)}
    />
  );
}

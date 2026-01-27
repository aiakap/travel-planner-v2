"use client";

import { useRouter } from 'next/navigation';
import { TripBuilderModal } from '@/components/trip-builder-modal';

interface TripBuilderPageClientProps {
  segmentTypeMap: Record<string, string>;
}

export default function TripBuilderPageClient({ segmentTypeMap }: TripBuilderPageClientProps) {
  const router = useRouter();

  return (
    <TripBuilderModal 
      isOpen={true}
      onClose={() => router.push('/manage')}
      onComplete={(tripId) => router.push(`/exp?tripId=${tripId}`)}
      segmentTypeMap={segmentTypeMap}
    />
  );
}

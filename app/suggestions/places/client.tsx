"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JourneyManager } from '@/app/trip/new/components/journey-manager';
import { HomeLocationData } from '@/lib/types/home-location';

interface PlacesClientProps {
  segmentTypeMap: Record<string, string>;
  homeLocation?: HomeLocationData | null;
}

export default function PlacesClient({ segmentTypeMap, homeLocation }: PlacesClientProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back Navigation */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Link href="/suggestions">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Back to options
            </Button>
          </Link>
        </div>
      </div>

      {/* Journey Manager */}
      <JourneyManager 
        segmentTypeMap={segmentTypeMap}
        homeLocation={homeLocation}
        onComplete={(tripId) => router.push(`/view1/${tripId}`)}
      />
    </div>
  );
}

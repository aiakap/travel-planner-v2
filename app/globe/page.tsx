"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TravelStatsCard } from "@/components/travel-stats-card";
import { TripListCard } from "@/components/trip-list-card";
import { SingleTripView } from "@/components/single-trip-view";
import type {
  GlobeTripData,
  TravelStats,
  ArcData,
} from "@/lib/globe-types";
import { calculateTimesAroundWorld } from "@/lib/utils";

// React-globe.gl / three* need the browser; disable SSR for this import.
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export default function GlobePage() {
  const globeRef = useRef<any>(undefined);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripIdFromUrl = searchParams.get("trip");

  const [trips, setTrips] = useState<GlobeTripData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [stats, setStats] = useState<TravelStats>({
    totalTrips: 0,
    countriesVisited: new Set(),
    totalDistanceKm: 0,
    timesAroundWorld: 0,
  });

  // Fetch trips data
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await fetch("/api/trips");
        const data: GlobeTripData[] = await response.json();
        setTrips(data);

        // Calculate stats
        const allCountries = new Set<string>();
        let totalDistance = 0;

        data.forEach((trip) => {
          trip.countries?.forEach((country) => {
            if (country && country.trim()) {
              allCountries.add(country);
            }
          });
          totalDistance += trip.totalDistance || 0;
        });

        setStats({
          totalTrips: data.length,
          countriesVisited: allCountries,
          totalDistanceKm: totalDistance,
          timesAroundWorld: calculateTimesAroundWorld(totalDistance),
        });
      } catch (err) {
        console.error("error", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrips();
  }, []);

  // Handle navigation to trip view
  const handleTripClick = (tripId: string) => {
    router.push(`/globe?trip=${tripId}`);
  };

  // Handle navigation back to all trips view
  const handleBackToAllTrips = () => {
    router.push("/globe");
  };

  // Handle globe arc click
  const handleArcClick = (arc: any) => {
    router.push(`/globe?trip=${arc.tripId}`);
  };

  // Setup globe auto-rotation
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  // Generate arc data for the globe
  const arcsData: ArcData[] = selectedTripId
    ? // Show only selected trip
      trips
        .filter((trip) => trip.id === selectedTripId)
        .flatMap((trip) =>
          (trip.segments || []).map((segment) => ({
            startLat: segment.startLat,
            startLng: segment.startLng,
            endLat: segment.endLat,
            endLng: segment.endLng,
            color: trip.color || "#3b82f6",
            tripId: trip.id,
            tripTitle: trip.title,
            segmentName: segment.name,
          }))
        )
    : // Show all trips
      trips.flatMap((trip) =>
        (trip.segments || []).map((segment) => ({
          startLat: segment.startLat,
          startLng: segment.startLng,
          endLat: segment.endLat,
          endLng: segment.endLng,
          color: trip.color || "#3b82f6",
          tripId: trip.id,
          tripTitle: trip.title,
          segmentName: segment.name,
        }))
      );

  // Generate point data (start and end points of arcs)
  const pointsData = arcsData.flatMap((arc) => [
    {
      lat: arc.startLat,
      lng: arc.startLng,
      color: arc.color,
      label: `${arc.tripTitle} - Start`,
    },
    {
      lat: arc.endLat,
      lng: arc.endLng,
      color: arc.color,
      label: `${arc.tripTitle} - End`,
    },
  ]);

  // Check if we're viewing a single trip
  const viewingTrip = tripIdFromUrl
    ? trips.find((t) => t.id === tripIdFromUrl)
    : null;

  // Show single trip view if trip ID in URL
  if (tripIdFromUrl && viewingTrip) {
    return (
      <SingleTripView trip={viewingTrip} onBack={handleBackToAllTrips} />
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show all trips view (globe view)
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Your Travel Journey</h1>
            <p className="text-muted-foreground">
              Explore everywhere you've been and everywhere you're going
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Globe Section - 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Globe Card */}
              <div className="bg-card rounded-xl shadow-lg overflow-hidden border">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold">
                      Interactive Globe
                    </h2>
                    {selectedTripId && (
                      <button
                        onClick={() => setSelectedTripId(null)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Show all trips
                      </button>
                    )}
                  </div>

                  <div className="h-[700px] w-full relative bg-black/5 rounded-lg overflow-hidden">
                    <Globe
                      ref={globeRef}
                      globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                      backgroundColor="rgba(0,0,0,0)"
                      // Arcs
                      arcsData={arcsData}
                      arcColor="color"
                      arcDashLength={0.4}
                      arcDashGap={0.2}
                      arcDashAnimateTime={3000}
                      arcStroke={0.5}
                      arcAltitude={0.3}
                      arcLabel={(d: any) =>
                        `${d.tripTitle} - ${d.segmentName}`
                      }
                      onArcClick={handleArcClick}
                      // Points
                      pointsData={pointsData}
                      pointColor="color"
                      pointLabel="label"
                      pointRadius={0.4}
                      pointAltitude={0.01}
                      pointsMerge={false}
                      width={900}
                      height={700}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar - 1 column */}
            <div className="lg:col-span-1 space-y-6 sticky top-4">
              {/* Travel Stats */}
              <TravelStatsCard stats={stats} />

              {/* Trip List */}
              <TripListCard
                trips={trips}
                selectedTripId={selectedTripId}
                onTripClick={handleTripClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

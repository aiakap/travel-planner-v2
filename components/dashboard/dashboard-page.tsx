"use client";

import {
  Trip,
  Segment,
  SegmentType,
  Reservation,
  ReservationType,
  ReservationCategory,
  ReservationStatus,
} from "@/app/generated/prisma";
import { DashboardHero } from "./dashboard-hero";
import { TravelStatsGrid } from "./travel-stats-grid";
import { UpcomingTripsSection } from "./upcoming-trips-section";
import { QuickLinksGrid } from "./quick-links-grid";

type ReservationWithRelations = Reservation & {
  reservationType: ReservationType & { category: ReservationCategory };
  reservationStatus: ReservationStatus;
};

type SegmentWithRelations = Segment & {
  segmentType: SegmentType;
  reservations: ReservationWithRelations[];
};

type TripWithRelations = Trip & {
  segments: SegmentWithRelations[];
};

interface DashboardPageProps {
  trips: TripWithRelations[];
  stats: {
    totalTrips: number;
    countriesVisited: Set<string>;
    totalDistanceKm: number;
    upcomingTrips: number;
  };
  userName: string;
  segmentTimeZones: Record<
    string,
    {
      startTimeZoneId?: string;
      startTimeZoneName?: string;
      endTimeZoneId?: string;
      endTimeZoneName?: string;
    }
  >;
}

export function DashboardPage({
  trips,
  stats,
  userName,
  segmentTimeZones,
}: DashboardPageProps) {
  // Find all upcoming trips sorted by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingTrips = trips
    .filter((trip) => new Date(trip.startDate) >= today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Carousel through upcoming trips */}
      <DashboardHero upcomingTrips={upcomingTrips} userName={userName} />

      {/* Travel Stats */}
      <TravelStatsGrid stats={stats} />

      {/* Upcoming Trips Section */}
      <UpcomingTripsSection trips={trips} segmentTimeZones={segmentTimeZones} />

      {/* Quick Links */}
      <QuickLinksGrid />
    </div>
  );
}

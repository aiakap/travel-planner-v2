"use client";

import {
  Segment,
  SegmentType,
  Trip,
  Reservation,
  ReservationType,
  ReservationCategory,
  ReservationStatus,
} from "@/app/generated/prisma";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Plus,
  Pencil,
  Plane,
  Hotel,
  UtensilsCrossed,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useState } from "react";
import Map from "@/components/map";
import SortableItinerary from "./sortable-itinerary";
import { formatDateTimeInTimeZone } from "@/lib/utils";

type ReservationWithRelations = Reservation & {
  reservationType: ReservationType & { category: ReservationCategory };
  reservationStatus: ReservationStatus;
};

export type TripWithSegments = Trip & {
  segments: (Segment & {
    segmentType: SegmentType;
    reservations: ReservationWithRelations[];
  })[];
};

interface TripDetailClientProps {
  trip: TripWithSegments;
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

function getCategoryIcon(categoryName: string) {
  switch (categoryName.toLowerCase()) {
    case "travel":
      return <Plane className="h-4 w-4" />;
    case "stay":
      return <Hotel className="h-4 w-4" />;
    case "activity":
      return <Ticket className="h-4 w-4" />;
    case "dining":
      return <UtensilsCrossed className="h-4 w-4" />;
    default:
      return <MapPin className="h-4 w-4" />;
  }
}

function getStatusBadgeColor(statusName: string) {
  switch (statusName.toLowerCase()) {
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "waitlisted":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function TripDetailClient({
  trip,
  segmentTimeZones,
}: TripDetailClientProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {trip.imageUrl && (
        <div className="w-full h-72 md:h-96 overflow-hidden rounded-xl shadow-lg relative">
          <Image
            src={trip.imageUrl}
            alt={trip.title}
            className="object-cover"
            fill
            priority
          />
        </div>
      )}
      <div className="bg-white p-6 shadow rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">{trip.title}</h1>

          <div className="flex items-center text-gray-500 mt-2">
            <Calendar className="h-5 w-5 mr-2" />
            <span className="text-lg">
              {trip.startDate.toLocaleDateString()} -{" "}
              {trip.endDate.toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <Link href={`/trips/${trip.id}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-5 w-5" /> Edit Trip
            </Button>
          </Link>
          <Link href={`/trips/${trip.id}/itinerary/new`}>
            <Button>
              <Plus className="mr-2 h-5 w-5" /> Add Segment
            </Button>
          </Link>
        </div>
      </div>
      <div className="bg-white p-6 shadow rounded-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="text-lg">
              Overview
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="text-lg">
              Segments
            </TabsTrigger>
            <TabsTrigger value="map" className="text-lg">
              Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Trip Summary</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Calendar className="h-6 w-6 mr-3 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-700">Dates</p>
                      <p className="text-sm text-gray-500">
                        {trip.startDate.toLocaleDateString()} -{" "}
                        {trip.endDate.toLocaleDateString()}
                        <br />
                        {`${Math.round(
                          (trip.endDate.getTime() - trip.startDate.getTime()) /
                            (1000 * 60 * 60 * 24)
                        )} days(s)`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-6 w-6 mr-3 text-gray-500" />
                    <div>
                      <p>Segments</p>
                      <p>
                        {trip.segments.length}{" "}
                        {trip.segments.length === 1 ? "segment" : "segments"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-72 rounded-lg overflow-hidden shadow">
                <Map segments={trip.segments} segmentTimeZones={segmentTimeZones} />
              </div>
              {trip.segments.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Segments</h3>
                  <div className="space-y-3">
                    {trip.segments.map((segment) => (
                      <div
                        key={segment.id}
                        className="p-4 border rounded-md bg-white"
                      >
                        {(() => {
                          const tz = segmentTimeZones[segment.id];
                          return (
                            <>
                              <div className="font-medium text-gray-800">
                                {segment.name ||
                                  `${segment.startTitle} → ${segment.endTitle}`}
                              </div>
                              <div className="text-sm font-medium text-gray-600">
                                {segment.segmentType.name}
                              </div>
                              <p className="text-sm text-gray-500">
                                Start: {segment.startTitle}
                                {segment.startTime
                                  ? ` • ${formatDateTimeInTimeZone(
                                      new Date(segment.startTime),
                                      tz?.startTimeZoneId
                                    )}`
                                  : " • No start time"}
                                {tz?.startTimeZoneName
                                  ? ` • ${tz.startTimeZoneName}`
                                  : ""}
                              </p>
                              <p className="text-sm text-gray-500">
                                End: {segment.endTitle}
                                {segment.endTime
                                  ? ` • ${formatDateTimeInTimeZone(
                                      new Date(segment.endTime),
                                      tz?.endTimeZoneId
                                    )}`
                                  : " • No end time"}
                                {tz?.endTimeZoneName
                                  ? ` • ${tz.endTimeZoneName}`
                                  : ""}
                              </p>
                              {segment.notes && (
                                <p className="text-sm text-gray-500 mt-2">
                                  {segment.notes}
                                </p>
                              )}
                              
                              {segment.reservations.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  <h4 className="text-sm font-semibold text-gray-700">
                                    Reservations ({segment.reservations.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {segment.reservations.map((reservation) => (
                                      <div
                                        key={reservation.id}
                                        className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-200"
                                      >
                                        <div className="flex-shrink-0 mt-1">
                                          {getCategoryIcon(
                                            reservation.reservationType.category.name
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                              <div className="font-medium text-sm text-gray-900">
                                                {reservation.name}
                                              </div>
                                              <div className="text-xs text-gray-600">
                                                {reservation.reservationType.name}
                                              </div>
                                              {reservation.confirmationNumber && (
                                                <div className="text-xs text-gray-500">
                                                  Conf: {reservation.confirmationNumber}
                                                </div>
                                              )}
                                            </div>
                                            <span
                                              className={`text-xs px-2 py-1 rounded ${getStatusBadgeColor(
                                                reservation.reservationStatus.name
                                              )}`}
                                            >
                                              {reservation.reservationStatus.name}
                                            </span>
                                          </div>
                                          <Link
                                            href={`/trips/${trip.id}/segments/${segment.id}/reservations/${reservation.id}/edit`}
                                            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                          >
                                            Edit
                                          </Link>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="mt-3 flex gap-2">
                                <Link
                                  href={`/trips/${trip.id}/segments/${segment.id}/edit`}
                                >
                                  <Button variant="outline">Edit Segment</Button>
                                </Link>
                                <Link
                                  href={`/trips/${trip.id}/segments/${segment.id}/reservations/new`}
                                >
                                  <Button variant="outline">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Reservation
                                  </Button>
                                </Link>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {trip.segments.length === 0 && (
                <div className="text-center p-4">
                  <p>Add segments to see them on the map.</p>
                  <Link href={`/trips/${trip.id}/itinerary/new`}>
                    <Button>
                      <Plus className="mr-2 h-5 w-5" /> Add Segment
                    </Button>
                  </Link>
                </div>
              )}

              <div>
                <p className="text-gray-600 leading-relaxed">
                  {trip.description}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="itinerary" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Segments</h2>
            </div>

            {trip.segments.length === 0 ? (
              <div className="text-center p-4">
                <p>Add segments to see them on the itinerary.</p>
                <Link href={`/trips/${trip.id}/itinerary/new`}>
                  <Button>
                    <Plus className="mr-2 h-5 w-5" /> Add Segment
                  </Button>
                </Link>
              </div>
            ) : (
              <SortableItinerary
                segments={trip.segments}
                tripId={trip.id}
                segmentTimeZones={segmentTimeZones}
              />
            )}
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <div className="h-72 rounded-lg overflow-hidden shadow">
              <Map segments={trip.segments} segmentTimeZones={segmentTimeZones} />
            </div>
            {trip.segments.length === 0 && (
              <div className="text-center p-4">
                <p>Add segments to see them on the map.</p>
                <Link href={`/trips/${trip.id}/itinerary/new`}>
                  <Button>
                    <Plus className="mr-2 h-5 w-5" /> Add Segment
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <div className="text-center">
        <Link href={`/trips`}>
          <Button> Back to Trips</Button>
        </Link>
      </div>
    </div>
  );
}

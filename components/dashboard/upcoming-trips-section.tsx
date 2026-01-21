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
import { useState, useTransition, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plane,
  Hotel,
  UtensilsCrossed,
  Ticket,
  MapPin,
  ExternalLink,
  X,
  Check,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";
import { formatDateTimeInTimeZone } from "@/lib/utils";
import { deleteTrip } from "@/lib/actions/delete-trip";
import { deleteSegment } from "@/lib/actions/delete-segment";
import { deleteReservation } from "@/lib/actions/delete-reservation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

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

interface UpcomingTripsSectionProps {
  trips: TripWithRelations[];
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
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "pending":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "cancelled":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "completed":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "waitlisted":
      return "bg-slate-100 text-slate-800 border-slate-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
}

export function UpcomingTripsSection({
  trips,
  segmentTimeZones,
}: UpcomingTripsSectionProps) {
  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(new Set());
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(
    new Set()
  );
  const [showPastTrips, setShowPastTrips] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    type: "trip" | "segment" | "reservation";
    id: string;
    name: string;
    tripId?: string;
    segmentId?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    if (!isPending && deleteSuccess) {
      setDeleteDialog(null);
      setDeleteSuccess(false);
    }
  }, [isPending, deleteSuccess]);

  const toggleTrip = (tripId: string) => {
    setExpandedTrips((prev) => {
      const next = new Set(prev);
      if (next.has(tripId)) {
        next.delete(tripId);
      } else {
        next.add(tripId);
      }
      return next;
    });
  };

  const toggleSegment = (segmentId: string) => {
    setExpandedSegments((prev) => {
      const next = new Set(prev);
      if (next.has(segmentId)) {
        next.delete(segmentId);
      } else {
        next.add(segmentId);
      }
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;

    startTransition(async () => {
      try {
        if (deleteDialog.type === "trip") {
          await deleteTrip(deleteDialog.id);
        } else if (deleteDialog.type === "segment") {
          await deleteSegment(deleteDialog.id);
        } else if (deleteDialog.type === "reservation") {
          await deleteReservation(deleteDialog.id);
        }
        setDeleteSuccess(true);
      } catch (error) {
        console.error("Delete failed:", error);
        setDeleteDialog(null);
      }
    });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTrips = trips.filter(
    (trip) => new Date(trip.startDate) >= today
  );
  const pastTrips = trips.filter((trip) => new Date(trip.startDate) < today);

  const renderTripCard = (trip: TripWithRelations) => (
    <div
      key={trip.id}
      className="border border-slate-200 rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Trip Header */}
      <div className="p-5 cursor-pointer hover:bg-slate-50 transition-colors">
        <div
          className="flex items-center gap-3 sm:gap-4"
          onClick={() => toggleTrip(trip.id)}
        >
          <div className="flex-shrink-0">
            {expandedTrips.has(trip.id) ? (
              <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
            ) : (
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
            )}
          </div>

          {trip.imageUrl && (
            <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-sm">
              <Image
                src={trip.imageUrl}
                alt={trip.title}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 truncate mb-1">
              {trip.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-1">
              {new Date(trip.startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              –{" "}
              {new Date(trip.endDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500">
              <span>
                {trip.segments.length}{" "}
                {trip.segments.length === 1 ? "segment" : "segments"}
              </span>
              <span className="text-slate-300">•</span>
              <span>
                {trip.segments.reduce((acc, seg) => acc + seg.reservations.length, 0)}{" "}
                res
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons below on mobile, inline on larger screens */}
        <div className="flex items-center gap-1 sm:gap-2 mt-3 sm:mt-0 sm:float-right sm:-mt-16" onClick={(e) => e.stopPropagation()}>
          <Link href={`/trips/${trip.id}`}>
            <Button variant="ghost" size="sm" title="View Trip" className="h-8 w-8 sm:h-9 sm:w-9 p-0">
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </Link>
          <Link href={`/trips/${trip.id}/edit`}>
            <Button variant="ghost" size="sm" title="Edit Trip" className="h-8 w-8 sm:h-9 sm:w-9 p-0">
              <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </Link>
          <Link href={`/trips/${trip.id}/itinerary/new`}>
            <Button variant="ghost" size="sm" title="Add Segment" className="h-8 w-8 sm:h-9 sm:w-9 p-0">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            title="Delete Trip"
            className="h-8 w-8 sm:h-9 sm:w-9 p-0"
            onClick={() =>
              setDeleteDialog({
                type: "trip",
                id: trip.id,
                name: trip.title,
              })
            }
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-rose-500" />
          </Button>
        </div>
      </div>

      {/* Expanded Trip Content */}
      {expandedTrips.has(trip.id) && (
        <div className="border-t border-slate-100 bg-gradient-to-br from-slate-50/50 to-white">
          {trip.segments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500 mb-4">
                No segments yet. Add your first segment!
              </p>
              <Link href={`/trips/${trip.id}/itinerary/new`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Segment
                </Button>
              </Link>
            </div>
          ) : (
            <div className="p-5 space-y-3">
              {trip.segments.map((segment) => {
                const tz = segmentTimeZones[segment.id];
                return (
                  <div
                    key={segment.id}
                    className="border border-slate-200 rounded-xl bg-white overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Segment Header */}
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => toggleSegment(segment.id)}
                    >
                      <div className="flex-shrink-0">
                        {expandedSegments.has(segment.id) ? (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        )}
                      </div>

                      {segment.imageUrl && (
                        <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden">
                          <Image
                            src={segment.imageUrl}
                            alt={segment.name}
                            width={56}
                            height={56}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-900 text-white rounded-md">
                            {segment.segmentType.name}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            Day {segment.order + 1}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-800 truncate">
                          {segment.name ||
                            `${segment.startTitle} → ${segment.endTitle}`}
                        </h4>
                        <p className="text-sm text-slate-500 truncate">
                          {segment.startTitle}
                          {segment.startTime &&
                            ` • ${formatDateTimeInTimeZone(
                              new Date(segment.startTime),
                              tz?.startTimeZoneId
                            )}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="font-medium">
                          {segment.reservations.length} res
                        </span>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/trips/${trip.id}/segments/${segment.id}/edit`}>
                          <Button variant="ghost" size="sm" title="Edit Segment">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/trips/${trip.id}/segments/${segment.id}/reservations/new`}>
                          <Button variant="ghost" size="sm" title="Add Reservation">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete Segment"
                          onClick={() =>
                            setDeleteDialog({
                              type: "segment",
                              id: segment.id,
                              name:
                                segment.name ||
                                `${segment.startTitle} → ${segment.endTitle}`,
                              tripId: trip.id,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Segment Content */}
                    {expandedSegments.has(segment.id) && (
                      <div className="border-t border-slate-100 bg-slate-50/30">
                        {segment.reservations.length === 0 ? (
                          <div className="p-5 text-center">
                            <p className="text-slate-500 text-sm mb-3">
                              No reservations yet.
                            </p>
                            <Link href={`/trips/${trip.id}/segments/${segment.id}/reservations/new`}>
                              <Button size="sm" variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Reservation
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <div className="p-4 space-y-2">
                            {segment.reservations.map((reservation) => (
                              <div
                                key={reservation.id}
                                className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow"
                              >
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600">
                                  {getCategoryIcon(
                                    reservation.reservationType.category.name
                                  )}
                                </div>

                                {reservation.imageUrl && (
                                  <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden">
                                    <Image
                                      src={reservation.imageUrl}
                                      alt={reservation.name}
                                      width={48}
                                      height={48}
                                      className="object-cover w-full h-full"
                                    />
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-semibold text-sm text-slate-800 truncate">
                                      {reservation.name}
                                    </h5>
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded border ${getStatusBadgeColor(
                                        reservation.reservationStatus.name
                                      )}`}
                                    >
                                      {reservation.reservationStatus.name}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    {reservation.reservationType.name}
                                    {reservation.confirmationNumber &&
                                      ` • Conf: ${reservation.confirmationNumber}`}
                                  </p>
                                  {reservation.startTime && (
                                    <p className="text-xs text-slate-400">
                                      {new Date(reservation.startTime).toLocaleString()}
                                    </p>
                                  )}
                                </div>

                                {reservation.cost && (
                                  <div className="text-sm font-semibold text-slate-700">
                                    {reservation.currency || "$"}
                                    {reservation.cost.toFixed(2)}
                                  </div>
                                )}

                                <div className="flex items-center gap-1">
                                  {reservation.url && (
                                    <a
                                      href={reservation.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Button variant="ghost" size="sm" title="Open URL">
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                    </a>
                                  )}
                                  <Link
                                    href={`/trips/${trip.id}/segments/${segment.id}/reservations/${reservation.id}/edit`}
                                  >
                                    <Button variant="ghost" size="sm" title="Edit Reservation">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Delete Reservation"
                                    onClick={() =>
                                      setDeleteDialog({
                                        type: "reservation",
                                        id: reservation.id,
                                        name: reservation.name,
                                        tripId: trip.id,
                                        segmentId: segment.id,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4 text-rose-500" />
                                  </Button>
                                </div>
                              </div>
                            ))}

                            <Link
                              href={`/trips/${trip.id}/segments/${segment.id}/reservations/new`}
                              className="block"
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full border border-dashed border-slate-300 hover:border-slate-400"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Reservation
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <Link href={`/trips/${trip.id}/itinerary/new`} className="block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full border border-dashed border-slate-300 hover:border-slate-400"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Segment
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-2">
                Your Trips
              </h2>
              <p className="text-slate-600">
                {upcomingTrips.length > 0
                  ? `${upcomingTrips.length} upcoming ${upcomingTrips.length === 1 ? "trip" : "trips"}`
                  : "No upcoming trips"}
              </p>
            </div>
            <Link href="/trips/new">
              <Button size="lg" className="shadow-lg hover:shadow-xl">
                <Plus className="h-5 w-5 mr-2" />
                New Trip
              </Button>
            </Link>
          </div>

          {/* Upcoming Trips */}
          {upcomingTrips.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-dashed border-slate-200">
              <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                No upcoming trips
              </h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Start planning your next adventure by creating a new trip.
              </p>
              <Link href="/trips/new">
                <Button size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your Next Trip
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">{upcomingTrips.map(renderTripCard)}</div>
          )}

          {/* Past Trips Toggle */}
          {pastTrips.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowPastTrips(!showPastTrips)}
                className="w-full p-4 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 text-slate-700 font-medium"
              >
                {showPastTrips ? (
                  <>
                    Hide Past Adventures
                    <ChevronDown className="h-5 w-5" />
                  </>
                ) : (
                  <>
                    View Past Adventures ({pastTrips.length})
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </button>

              {showPastTrips && (
                <div className="mt-4 space-y-4 opacity-75">
                  {pastTrips.map(renderTripCard)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="h-5 w-5" />
              Delete {deleteDialog?.type}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>&quot;{deleteDialog?.name}&quot;</strong>?
              {deleteDialog?.type === "trip" && (
                <span className="block mt-2 text-rose-500">
                  This will also delete all segments and reservations in this trip.
                </span>
              )}
              {deleteDialog?.type === "segment" && (
                <span className="block mt-2 text-rose-500">
                  This will also delete all reservations in this segment.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(null)}
              disabled={isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? (
                "Deleting..."
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

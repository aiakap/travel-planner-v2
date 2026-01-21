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
  Calendar,
  X,
  Check,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
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
} from "./ui/dialog";

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

interface ManageClientProps {
  trips: TripWithRelations[];
  segmentTypes: SegmentType[];
  reservationCategories: (ReservationCategory & { types: ReservationType[] })[];
  reservationStatuses: ReservationStatus[];
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

export default function ManageClient({
  trips,
  segmentTimeZones,
}: ManageClientProps) {
  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(new Set());
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(
    new Set()
  );
  const [deleteDialog, setDeleteDialog] = useState<{
    type: "trip" | "segment" | "reservation";
    id: string;
    name: string;
    tripId?: string;
    segmentId?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Close dialog after transition completes and UI updates
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
        // Mark as successful - dialog will close after transition completes
        setDeleteSuccess(true);
      } catch (error) {
        console.error("Delete failed:", error);
        // Close dialog immediately on error
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

  const renderTripSection = (
    sectionTrips: TripWithRelations[],
    title: string
  ) => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-slate-500" />
        {title}
        <span className="text-sm font-normal text-slate-500">
          ({sectionTrips.length})
        </span>
      </h2>

      {sectionTrips.length === 0 ? (
        <div className="text-slate-500 text-sm py-4">No trips in this section.</div>
      ) : (
        <div className="space-y-3">
          {sectionTrips.map((trip) => (
            <div
              key={trip.id}
              className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden"
            >
              {/* Trip Header */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleTrip(trip.id)}
              >
                <div className="flex-shrink-0">
                  {expandedTrips.has(trip.id) ? (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  )}
                </div>

                {trip.imageUrl && (
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                    <Image
                      src={trip.imageUrl}
                      alt={trip.title}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-slate-900 truncate">
                    {trip.title}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {new Date(trip.startDate).toLocaleDateString()} –{" "}
                    {new Date(trip.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-slate-500">
                    {trip.segments.length}{" "}
                    {trip.segments.length === 1 ? "segment" : "segments"}
                    {" • "}
                    {trip.segments.reduce(
                      (acc, seg) => acc + seg.reservations.length,
                      0
                    )}{" "}
                    reservations
                  </p>
                </div>

                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={`/trips/${trip.id}`}>
                    <Button variant="ghost" size="sm" title="View Trip">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/trips/${trip.id}/edit`}>
                    <Button variant="ghost" size="sm" title="Edit Trip">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/trips/${trip.id}/itinerary/new`}>
                    <Button variant="ghost" size="sm" title="Add Segment">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Delete Trip"
                    onClick={() =>
                      setDeleteDialog({
                        type: "trip",
                        id: trip.id,
                        name: trip.title,
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </div>
              </div>

              {/* Expanded Trip Content - Segments */}
              {expandedTrips.has(trip.id) && (
                <div className="border-t border-slate-100 bg-slate-50/50">
                  {trip.segments.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-slate-500 mb-3">
                        No segments yet. Add your first segment!
                      </p>
                      <Link href={`/trips/${trip.id}/itinerary/new`}>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Segment
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {trip.segments.map((segment) => {
                        const tz = segmentTimeZones[segment.id];
                        return (
                          <div
                            key={segment.id}
                            className="border border-slate-200 rounded-lg bg-white overflow-hidden"
                          >
                            {/* Segment Header */}
                            <div
                              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                              onClick={() => toggleSegment(segment.id)}
                            >
                              <div className="flex-shrink-0">
                                {expandedSegments.has(segment.id) ? (
                                  <ChevronDown className="h-4 w-4 text-slate-400" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-slate-400" />
                                )}
                              </div>

                              {segment.imageUrl && (
                                <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden">
                                  <Image
                                    src={segment.imageUrl}
                                    alt={segment.name}
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                    {segment.segmentType.name}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    Day {segment.order + 1}
                                  </span>
                                </div>
                                <h4 className="font-medium text-slate-800 truncate">
                                  {segment.name ||
                                    `${segment.startTitle} → ${segment.endTitle}`}
                                </h4>
                                <p className="text-xs text-slate-500 truncate">
                                  {segment.startTitle}
                                  {segment.startTime &&
                                    ` • ${formatDateTimeInTimeZone(
                                      new Date(segment.startTime),
                                      tz?.startTimeZoneId
                                    )}`}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span>
                                  {segment.reservations.length}{" "}
                                  {segment.reservations.length === 1
                                    ? "res"
                                    : "res"}
                                </span>
                              </div>

                              <div
                                className="flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link
                                  href={`/trips/${trip.id}/segments/${segment.id}/edit`}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Edit Segment"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                </Link>
                                <Link
                                  href={`/trips/${trip.id}/segments/${segment.id}/reservations/new`}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Add Reservation"
                                  >
                                    <Plus className="h-3 w-3" />
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
                                  <Trash2 className="h-3 w-3 text-rose-500" />
                                </Button>
                              </div>
                            </div>

                            {/* Expanded Segment Content - Reservations */}
                            {expandedSegments.has(segment.id) && (
                              <div className="border-t border-slate-100 bg-slate-50/30">
                                {segment.reservations.length === 0 ? (
                                  <div className="p-4 text-center">
                                    <p className="text-slate-500 text-sm mb-2">
                                      No reservations yet.
                                    </p>
                                    <Link
                                      href={`/trips/${trip.id}/segments/${segment.id}/reservations/new`}
                                    >
                                      <Button size="sm" variant="outline">
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Reservation
                                      </Button>
                                    </Link>
                                  </div>
                                ) : (
                                  <div className="p-3 space-y-2">
                                    {segment.reservations.map((reservation) => (
                                      <div
                                        key={reservation.id}
                                        className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-md hover:shadow-sm transition-shadow"
                                      >
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                          {getCategoryIcon(
                                            reservation.reservationType.category
                                              .name
                                          )}
                                        </div>

                                        {reservation.imageUrl && (
                                          <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden">
                                            <Image
                                              src={reservation.imageUrl}
                                              alt={reservation.name}
                                              width={40}
                                              height={40}
                                              className="object-cover w-full h-full"
                                            />
                                          </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <h5 className="font-medium text-sm text-slate-800 truncate">
                                              {reservation.name}
                                            </h5>
                                            <span
                                              className={`text-xs px-2 py-0.5 rounded border ${getStatusBadgeColor(
                                                reservation.reservationStatus
                                                  .name
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
                                              {new Date(
                                                reservation.startTime
                                              ).toLocaleString()}
                                            </p>
                                          )}
                                        </div>

                                        {reservation.cost && (
                                          <div className="text-sm font-medium text-slate-700">
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
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                title="Open URL"
                                              >
                                                <ExternalLink className="h-3 w-3" />
                                              </Button>
                                            </a>
                                          )}
                                          <Link
                                            href={`/trips/${trip.id}/segments/${segment.id}/reservations/${reservation.id}/edit`}
                                          >
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              title="Edit Reservation"
                                            >
                                              <Pencil className="h-3 w-3" />
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
                                            <Trash2 className="h-3 w-3 text-rose-500" />
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
                                        <Plus className="h-3 w-3 mr-1" />
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

                      <Link
                        href={`/trips/${trip.id}/itinerary/new`}
                        className="block"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full border border-dashed border-slate-300 hover:border-slate-400"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Segment
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Manage Trips
            </h1>
            <p className="text-slate-500 mt-1">
              View and manage all your travel experiences
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/trips">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/trips/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Trip
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500">Total Trips</p>
            <p className="text-2xl font-bold text-slate-900">{trips.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500">Upcoming</p>
            <p className="text-2xl font-bold text-emerald-600">
              {upcomingTrips.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500">Total Segments</p>
            <p className="text-2xl font-bold text-slate-900">
              {trips.reduce((acc, t) => acc + t.segments.length, 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500">Reservations</p>
            <p className="text-2xl font-bold text-slate-900">
              {trips.reduce(
                (acc, t) =>
                  acc +
                  t.segments.reduce((a, s) => a + s.reservations.length, 0),
                0
              )}
            </p>
          </div>
        </div>

        {/* Trip Sections */}
        <div className="space-y-8">
          {renderTripSection(upcomingTrips, "Upcoming Trips")}
          {renderTripSection(pastTrips, "Past Trips")}
        </div>

        {trips.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <MapPin className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No trips yet
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Start planning your next adventure by creating your first trip.
            </p>
            <Link href="/trips/new">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Trip
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
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
                  This will also delete all segments and reservations in this
                  trip.
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
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                "Deleting..."
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


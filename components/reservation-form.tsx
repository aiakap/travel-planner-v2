"use client";

import {
  Reservation,
  ReservationCategory,
  ReservationType,
  ReservationStatus,
} from "@/app/generated/prisma";
import { createReservation } from "@/lib/actions/create-reservation";
import { updateReservation } from "@/lib/actions/update-reservation";
import { UploadButton } from "@/lib/upload-thing";
import { formatForDateTimeLocal } from "@/lib/utils";
import Image from "next/image";
import { useState, useTransition, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import TimezoneSelect from "./timezone-select";
import FlightMap from "./flight-map";

type ReservationWithRelations = Reservation & {
  reservationType: ReservationType & { category: ReservationCategory };
  reservationStatus: ReservationStatus;
};

interface ReservationFormProps {
  segmentId: string;
  reservation?: ReservationWithRelations;
  categories: (ReservationCategory & { types: ReservationType[] })[];
  statuses: ReservationStatus[];
}

// Location with coordinates
interface LocationWithCoords {
  name: string;
  lat: number;
  lng: number;
}

// Calculate flight duration from start and end times
function calculateFlightDuration(startTime: string, endTime: string): string | null {
  if (!startTime || !endTime) return null;
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  
  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return null;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) {
    return `${minutes}m`;
  }
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

// Custom hook for debounced timezone lookup
function useTimezoneLookup() {
  const [isLoading, setIsLoading] = useState<{ departure: boolean; arrival: boolean }>({
    departure: false,
    arrival: false,
  });
  const abortControllerRef = useRef<{ departure?: AbortController; arrival?: AbortController }>({});

  const lookupTimezone = useCallback(
    async (
      location: string,
      type: "departure" | "arrival",
      onSuccess: (data: { timezone: string; formatted: string; lat: number; lng: number }) => void
    ) => {
      // Cancel any pending request for this type
      if (abortControllerRef.current[type]) {
        abortControllerRef.current[type]?.abort();
      }

      if (!location || location.trim().length < 3) {
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current[type] = controller;

      setIsLoading((prev) => ({ ...prev, [type]: true }));

      try {
        const response = await fetch("/api/geocode-timezone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to lookup timezone");
        }

        const data = await response.json();
        if (data.timezone && data.lat && data.lng) {
          onSuccess({
            timezone: data.timezone,
            formatted: data.formatted,
            lat: data.lat,
            lng: data.lng,
          });
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Timezone lookup error:", error);
        }
      } finally {
        setIsLoading((prev) => ({ ...prev, [type]: false }));
      }
    },
    []
  );

  return { lookupTimezone, isLoading };
}

export default function ReservationForm({
  segmentId,
  reservation,
  categories,
  statuses,
}: ReservationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(
    reservation?.imageUrl ?? null
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    reservation?.reservationType.categoryId ?? categories[0]?.id ?? ""
  );
  const [selectedTypeId, setSelectedTypeId] = useState<string>(
    reservation?.reservationTypeId ?? ""
  );
  const [selectedStatusId, setSelectedStatusId] = useState<string>(
    reservation?.reservationStatusId ?? statuses[0]?.id ?? ""
  );

  // Flight-specific state
  const [departureLocation, setDepartureLocation] = useState<string>(
    reservation?.departureLocation ?? ""
  );
  const [departureTimezone, setDepartureTimezone] = useState<string>(
    reservation?.departureTimezone ?? ""
  );
  const [arrivalLocation, setArrivalLocation] = useState<string>(
    reservation?.arrivalLocation ?? ""
  );
  const [arrivalTimezone, setArrivalTimezone] = useState<string>(
    reservation?.arrivalTimezone ?? ""
  );
  const [departureTime, setDepartureTime] = useState<string>(
    reservation?.startTime ? formatForDateTimeLocal(new Date(reservation.startTime)) : ""
  );
  const [arrivalTime, setArrivalTime] = useState<string>(
    reservation?.endTime ? formatForDateTimeLocal(new Date(reservation.endTime)) : ""
  );

  // Location coordinates for map
  const [departureCoords, setDepartureCoords] = useState<LocationWithCoords | null>(null);
  const [arrivalCoords, setArrivalCoords] = useState<LocationWithCoords | null>(null);

  // Timezone lookup hook
  const { lookupTimezone, isLoading: isLookingUp } = useTimezoneLookup();

  // Debounce timers for location inputs
  const departureDebounceRef = useRef<NodeJS.Timeout>();
  const arrivalDebounceRef = useRef<NodeJS.Timeout>();

  // Handle departure location change with debounced timezone lookup
  const handleDepartureLocationChange = useCallback(
    (value: string) => {
      setDepartureLocation(value);

      // Clear existing debounce timer
      if (departureDebounceRef.current) {
        clearTimeout(departureDebounceRef.current);
      }

      // Debounce the timezone lookup
      departureDebounceRef.current = setTimeout(() => {
        lookupTimezone(value, "departure", (data) => {
          setDepartureTimezone(data.timezone);
          setDepartureCoords({
            name: value,
            lat: data.lat,
            lng: data.lng,
          });
        });
      }, 800); // 800ms debounce
    },
    [lookupTimezone]
  );

  // Handle arrival location change with debounced timezone lookup
  const handleArrivalLocationChange = useCallback(
    (value: string) => {
      setArrivalLocation(value);

      // Clear existing debounce timer
      if (arrivalDebounceRef.current) {
        clearTimeout(arrivalDebounceRef.current);
      }

      // Debounce the timezone lookup
      arrivalDebounceRef.current = setTimeout(() => {
        lookupTimezone(value, "arrival", (data) => {
          setArrivalTimezone(data.timezone);
          setArrivalCoords({
            name: value,
            lat: data.lat,
            lng: data.lng,
          });
        });
      }, 800); // 800ms debounce
    },
    [lookupTimezone]
  );

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      if (departureDebounceRef.current) clearTimeout(departureDebounceRef.current);
      if (arrivalDebounceRef.current) clearTimeout(arrivalDebounceRef.current);
    };
  }, []);

  // Filter types based on selected category
  const availableTypes =
    categories.find((cat) => cat.id === selectedCategoryId)?.types ?? [];

  // Auto-select first type when category changes
  useEffect(() => {
    if (availableTypes.length > 0 && !reservation) {
      setSelectedTypeId(availableTypes[0].id);
    }
  }, [selectedCategoryId, availableTypes, reservation]);

  // Check if current type is "Flight"
  const selectedType = availableTypes.find((t) => t.id === selectedTypeId);
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const isFlightType = selectedCategory?.name === "Travel" && selectedType?.name === "Flight";

  const startTimeValue = reservation?.startTime
    ? formatForDateTimeLocal(new Date(reservation.startTime))
    : "";
  const endTimeValue = reservation?.endTime
    ? formatForDateTimeLocal(new Date(reservation.endTime))
    : "";

  // Calculate flight duration
  const flightDuration = useMemo(() => {
    if (!isFlightType) return null;
    return calculateFlightDuration(departureTime, arrivalTime);
  }, [isFlightType, departureTime, arrivalTime]);

  const isEditMode = !!reservation;

  return (
    <form
      className="space-y-6"
      action={(formData: FormData) => {
        startTransition(() => {
          if (imageUrl) {
            formData.set("imageUrl", imageUrl);
          }
          // Add flight-specific fields if it's a flight
          if (isFlightType) {
            formData.set("departureLocation", departureLocation);
            formData.set("departureTimezone", departureTimezone);
            formData.set("arrivalLocation", arrivalLocation);
            formData.set("arrivalTimezone", arrivalTimezone);
            formData.set("startTime", departureTime);
            formData.set("endTime", arrivalTime);
          }
          if (isEditMode) {
            formData.set("reservationId", reservation.id);
            updateReservation(formData);
          } else {
            formData.set("segmentId", segmentId);
            createReservation(formData);
          }
        });
      }}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reservation Name
        </label>
        <input
          name="name"
          type="text"
          required
          defaultValue={reservation?.name}
          placeholder="e.g., United Airlines Flight, Marriott Hotel"
          className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <select
            name="reservationTypeId"
            required
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          name="reservationStatusId"
          required
          value={selectedStatusId}
          onChange={(e) => setSelectedStatusId(e.target.value)}
          className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirmation Number (optional)
        </label>
        <input
          name="confirmationNumber"
          type="text"
          defaultValue={reservation?.confirmationNumber ?? ""}
          placeholder="e.g., ABC123XYZ"
          className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Flight-specific departure/arrival sections */}
      {isFlightType ? (
        <>
          {/* Flight Map */}
          <div className="h-64 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <FlightMap
              departureLocation={departureCoords || undefined}
              arrivalLocation={arrivalCoords || undefined}
            />
          </div>

          {/* Departure Section */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <h3 className="font-semibold text-gray-900">Departure</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Airport / Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={departureLocation}
                    onChange={(e) => handleDepartureLocationChange(e.target.value)}
                    placeholder="e.g., John F. Kennedy International Airport, New York, USA"
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {isLookingUp.departure && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Time
                  </label>
                  <input
                    type="datetime-local"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                    {departureTimezone && !isLookingUp.departure && (
                      <span className="ml-2 text-xs text-green-600 font-normal">✓ Auto-detected</span>
                    )}
                  </label>
                  <TimezoneSelect
                    value={departureTimezone}
                    onChange={setDepartureTimezone}
                    placeholder="Select departure timezone..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Flight Duration Indicator */}
          {flightDuration && (
            <div className="flex items-center justify-center py-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="h-px w-8 bg-gray-300" />
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span className="font-medium">Flight Duration: ~{flightDuration}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <div className="h-px w-8 bg-gray-300" />
              </div>
            </div>
          )}

          {/* Arrival Section */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <h3 className="font-semibold text-gray-900">Arrival</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Airport / Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={arrivalLocation}
                    onChange={(e) => handleArrivalLocationChange(e.target.value)}
                    placeholder="e.g., Amsterdam Schiphol Airport, Netherlands"
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {isLookingUp.arrival && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Time
                  </label>
                  <input
                    type="datetime-local"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                    {arrivalTimezone && !isLookingUp.arrival && (
                      <span className="ml-2 text-xs text-green-600 font-normal">✓ Auto-detected</span>
                    )}
                  </label>
                  <TimezoneSelect
                    value={arrivalTimezone}
                    onChange={setArrivalTimezone}
                    placeholder="Select arrival timezone..."
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Standard time and location fields for non-flight reservations */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time (optional)
              </label>
              <input
                name="startTime"
                type="datetime-local"
                defaultValue={startTimeValue}
                className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time (optional)
              </label>
              <input
                name="endTime"
                type="datetime-local"
                defaultValue={endTimeValue}
                className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location (optional)
            </label>
            <input
              name="location"
              type="text"
              defaultValue={reservation?.location ?? ""}
              placeholder="e.g., 123 Main St, City, Country"
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cost (optional)
          </label>
          <input
            name="cost"
            type="number"
            step="0.01"
            defaultValue={reservation?.cost ?? ""}
            placeholder="0.00"
            className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency (optional)
          </label>
          <input
            name="currency"
            type="text"
            defaultValue={reservation?.currency ?? "USD"}
            placeholder="USD"
            maxLength={3}
            className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Booking URL (optional)
        </label>
        <input
          name="url"
          type="url"
          defaultValue={reservation?.url ?? ""}
          placeholder="https://..."
          className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (optional)
        </label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={reservation?.notes ?? ""}
          className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image (optional)
        </label>
        {imageUrl && (
          <div className="mb-3">
            <Image
              src={imageUrl}
              alt="Reservation"
              className="w-full rounded-md max-h-48 object-cover"
              width={400}
              height={200}
            />
          </div>
        )}
        <UploadButton
          endpoint="imageUploader"
          onClientUploadComplete={(res) => {
            if (res && res[0].ufsUrl) {
              setImageUrl(res[0].ufsUrl);
            }
          }}
          onUploadError={(error: Error) => {
            console.error("Upload error: ", error);
          }}
        />
        <input type="hidden" name="imageUrl" value={imageUrl || ""} />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending
          ? "Saving..."
          : isEditMode
          ? "Save Changes"
          : "Create Reservation"}
      </Button>
    </form>
  );
}

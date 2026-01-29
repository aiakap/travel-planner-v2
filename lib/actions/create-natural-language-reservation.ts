"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GooglePlaceData } from "@/lib/types/place-suggestion";
import { getReservationType, getReservationStatus } from "@/lib/db/reservation-lookups";
import { ReservationMetadata } from "@/lib/reservation-metadata-types";
import { queueImageGeneration } from "./queue-image-generation";

export interface CreateNaturalLanguageReservationInput {
  segmentId: string;
  placeName: string;
  placeData?: GooglePlaceData;
  date: Date;
  time?: { hours: number; minutes: number };
  endDate?: Date;
  endTime?: { hours: number; minutes: number };
  reservationType?: string;
  additionalInfo?: {
    partySize?: number;
    duration?: string;
    notes?: string;
  };
  originalInput: string; // Store the original natural language input
}

/**
 * Create a draft reservation from natural language input
 * Returns reservation ID for navigation to edit page
 */
export async function createNaturalLanguageReservation(
  input: CreateNaturalLanguageReservationInput
): Promise<{ success: boolean; reservationId?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Verify segment belongs to user
    const segment = await prisma.segment.findFirst({
      where: {
        id: input.segmentId,
        trip: {
          userId: session.user.id,
        },
      },
      include: {
        trip: true,
      },
    });

    if (!segment) {
      return { success: false, error: "Segment not found or unauthorized" };
    }

    // Determine reservation type and category
    let category = "Activity";
    let typeName = "General Activity";
    
    if (input.reservationType === "restaurant" || input.placeName.toLowerCase().includes("restaurant")) {
      category = "Dining";
      typeName = "Restaurant";
    } else if (input.reservationType === "hotel" || input.placeName.toLowerCase().includes("hotel")) {
      category = "Stay";
      typeName = "Hotel";
    } else if (input.reservationType === "flight") {
      category = "Travel";
      typeName = "Flight";
    } else if (input.reservationType === "train") {
      category = "Travel";
      typeName = "Train";
    } else if (input.reservationType === "car_rental") {
      category = "Travel";
      typeName = "Car Rental";
    } else if (input.placeData?.types) {
      // Infer from Google Places types
      if (input.placeData.types.includes("restaurant") || input.placeData.types.includes("food")) {
        category = "Dining";
        typeName = "Restaurant";
      } else if (input.placeData.types.includes("lodging") || input.placeData.types.includes("hotel")) {
        category = "Stay";
        typeName = "Hotel";
      } else if (input.placeData.types.includes("tourist_attraction") || input.placeData.types.includes("museum")) {
        category = "Activity";
        typeName = "Sightseeing";
      }
    }

    const reservationType = await getReservationType(category, typeName);
    const draftStatus = await getReservationStatus("Draft");

    // Build start time
    const startTime = new Date(input.date);
    if (input.time) {
      startTime.setHours(input.time.hours, input.time.minutes, 0, 0);
    }

    // Build end time
    let endTime: Date | null = null;
    if (input.endDate) {
      endTime = new Date(input.endDate);
      if (input.endTime) {
        endTime.setHours(input.endTime.hours, input.endTime.minutes, 0, 0);
      }
    } else if (category === "Dining") {
      // Default 2-hour duration for restaurants
      endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 2);
    } else if (category === "Stay") {
      // Default check-out next day at 11 AM
      endTime = new Date(startTime);
      endTime.setDate(endTime.getDate() + 1);
      endTime.setHours(11, 0, 0, 0);
    } else if (category === "Activity") {
      // Default 1-hour duration
      endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);
    }

    // Build metadata
    const metadata: ReservationMetadata = {};
    
    if (category === "Dining" && input.additionalInfo?.partySize) {
      metadata.restaurant = {
        partySize: input.additionalInfo.partySize,
      };
    } else if (category === "Stay") {
      metadata.hotel = {
        guestCount: input.additionalInfo?.partySize,
        checkInTime: input.time ? `${input.time.hours}:${String(input.time.minutes).padStart(2, '0')}` : "15:00",
        checkOutTime: input.endTime ? `${input.endTime.hours}:${String(input.endTime.minutes).padStart(2, '0')}` : "11:00",
      };
    }

    // Add original input to metadata for reference
    (metadata as any).naturalLanguageInput = input.originalInput;

    // Prepare reservation name
    const reservationName = input.placeData?.name || input.placeName;

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        name: reservationName,
        startTime,
        endTime,
        location: input.placeData?.formattedAddress || input.placeName,
        latitude: input.placeData?.geometry?.location.lat,
        longitude: input.placeData?.geometry?.location.lng,
        contactPhone: input.placeData?.phoneNumber,
        url: input.placeData?.website,
        notes: input.additionalInfo?.notes,
        segmentId: input.segmentId,
        reservationTypeId: reservationType.id,
        reservationStatusId: draftStatus.id,
        metadata: metadata as any,
      },
    });

    // Queue image generation if we have a photo
    if (input.placeData?.photos && input.placeData.photos.length > 0) {
      const photoUrl = input.placeData.photos[0].url;
      // We'll use the photo URL as a reference, but for now just queue default generation
      queueImageGeneration(reservation.id, "reservation").catch(err => {
        console.error(`[NL Reservation] Failed to queue image generation:`, err);
      });
    } else {
      // Queue default image generation
      queueImageGeneration(reservation.id, "reservation").catch(err => {
        console.error(`[NL Reservation] Failed to queue image generation:`, err);
      });
    }

    console.log(`[NL Reservation] Created draft reservation ${reservation.id} for "${reservationName}"`);

    return {
      success: true,
      reservationId: reservation.id,
    };
  } catch (error) {
    console.error("[Create NL Reservation] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create reservation",
    };
  }
}

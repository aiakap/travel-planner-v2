"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface HotelReservationData {
  hotelName: string;
  confirmationNumber?: string;
  checkInDate: string;
  checkInTime?: string;
  checkOutDate: string;
  checkOutTime?: string;
  nights?: number;
  guests?: number;
  rooms?: number;
  roomType?: string;
  address?: string;
  totalCost?: number;
  currency?: string;
  contactPhone?: string;
  contactEmail?: string;
  cancellationPolicy?: string;
  imageUrl?: string;
  url?: string;
}

/**
 * Create a new hotel reservation in the database
 */
export async function createHotelReservation(
  data: HotelReservationData,
  tripId?: string,
  segmentId?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    // Get or create "Hotel" reservation type
    const hotelType = await prisma.reservationType.findFirst({
      where: { name: "Hotel" },
    });

    if (!hotelType) {
      throw new Error("Hotel reservation type not found in database");
    }

    // Get "Confirmed" status
    const confirmedStatus = await prisma.reservationStatus.findFirst({
      where: { name: "Confirmed" },
    });

    if (!confirmedStatus) {
      throw new Error("Confirmed status not found in database");
    }

    // If no segment provided, try to find or create a Stay segment
    let targetSegmentId = segmentId;
    
    if (!targetSegmentId && tripId) {
      // Look for existing Stay segment in the trip
      const staySegmentType = await prisma.segmentType.findFirst({
        where: { name: "Stay" },
      });

      if (staySegmentType) {
        const existingStaySegment = await prisma.segment.findFirst({
          where: {
            tripId,
            segmentTypeId: staySegmentType.id,
          },
          orderBy: { order: 'desc' },
        });

        if (existingStaySegment) {
          targetSegmentId = existingStaySegment.id;
        } else {
          // Create a new Stay segment
          const trip = await prisma.trip.findUnique({
            where: { id: tripId },
          });

          if (trip) {
            const newSegment = await prisma.segment.create({
              data: {
                name: `Stay in ${data.address?.split(',')[0] || 'destination'}`,
                tripId,
                segmentTypeId: staySegmentType.id,
                startTitle: data.address || data.hotelName,
                startLat: 0, // TODO: Geocode address
                startLng: 0,
                endTitle: data.address || data.hotelName,
                endLat: 0,
                endLng: 0,
                startTime: data.checkInDate ? new Date(data.checkInDate) : trip.startDate,
                endTime: data.checkOutDate ? new Date(data.checkOutDate) : trip.endDate,
                order: 0,
              },
            });
            targetSegmentId = newSegment.id;
          }
        }
      }
    }

    if (!targetSegmentId) {
      throw new Error("No segment ID provided and unable to create Stay segment");
    }

    // Combine date and time for startTime and endTime
    const startTime = data.checkInDate && data.checkInTime
      ? new Date(`${data.checkInDate}T${convertTo24Hour(data.checkInTime)}`)
      : data.checkInDate
      ? new Date(data.checkInDate)
      : null;

    const endTime = data.checkOutDate && data.checkOutTime
      ? new Date(`${data.checkOutDate}T${convertTo24Hour(data.checkOutTime)}`)
      : data.checkOutDate
      ? new Date(data.checkOutDate)
      : null;

    // Create notes with room details
    const notes = [
      data.roomType ? `Room: ${data.roomType}` : null,
      data.guests ? `${data.guests} guest${data.guests > 1 ? 's' : ''}` : null,
      data.rooms ? `${data.rooms} room${data.rooms > 1 ? 's' : ''}` : null,
      data.nights ? `${data.nights} night${data.nights > 1 ? 's' : ''}` : null,
    ]
      .filter(Boolean)
      .join(' • ');

    // Create the reservation
    const reservation = await prisma.reservation.create({
      data: {
        name: data.hotelName,
        vendor: data.hotelName,
        confirmationNumber: data.confirmationNumber,
        notes: notes || null,
        reservationTypeId: hotelType.id,
        reservationStatusId: confirmedStatus.id,
        segmentId: targetSegmentId,
        startTime,
        endTime,
        cost: data.totalCost,
        currency: data.currency || 'USD',
        location: data.address,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        cancellationPolicy: data.cancellationPolicy,
        url: data.url,
        imageUrl: data.imageUrl,
      },
      include: {
        reservationType: {
          include: {
            category: true,
          },
        },
        reservationStatus: true,
      },
    });

    revalidatePath('/exp');
    revalidatePath(`/trips/${tripId}`);

    return {
      success: true,
      reservationId: reservation.id,
      reservation,
    };
  } catch (error) {
    console.error("Error creating hotel reservation:", error);
    throw error;
  }
}

/**
 * Update an existing hotel reservation
 */
export async function updateHotelReservation(
  reservationId: string,
  data: Partial<HotelReservationData>
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify the reservation belongs to the user's trip
    const reservation = await prisma.reservation.findFirst({
      where: {
        id: reservationId,
        segment: {
          trip: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!reservation) {
      throw new Error("Reservation not found or unauthorized");
    }

    // Build update data
    const updateData: any = {};

    if (data.hotelName !== undefined) {
      updateData.name = data.hotelName;
      updateData.vendor = data.hotelName;
    }
    if (data.confirmationNumber !== undefined) updateData.confirmationNumber = data.confirmationNumber;
    if (data.totalCost !== undefined) updateData.cost = data.totalCost;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.address !== undefined) updateData.location = data.address;
    if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone;
    if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
    if (data.cancellationPolicy !== undefined) updateData.cancellationPolicy = data.cancellationPolicy;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

    // Handle date/time updates
    if (data.checkInDate || data.checkInTime) {
      const currentStart = reservation.startTime ? new Date(reservation.startTime) : new Date();
      const newDate = data.checkInDate || currentStart.toISOString().split('T')[0];
      const newTime = data.checkInTime || currentStart.toTimeString().slice(0, 5);
      updateData.startTime = new Date(`${newDate}T${convertTo24Hour(newTime)}`);
    }

    if (data.checkOutDate || data.checkOutTime) {
      const currentEnd = reservation.endTime ? new Date(reservation.endTime) : new Date();
      const newDate = data.checkOutDate || currentEnd.toISOString().split('T')[0];
      const newTime = data.checkOutTime || currentEnd.toTimeString().slice(0, 5);
      updateData.endTime = new Date(`${newDate}T${convertTo24Hour(newTime)}`);
    }

    // Update notes if room details changed
    if (data.roomType !== undefined || data.guests !== undefined || data.rooms !== undefined || data.nights !== undefined) {
      const notes = [
        data.roomType || null,
        data.guests ? `${data.guests} guest${data.guests > 1 ? 's' : ''}` : null,
        data.rooms ? `${data.rooms} room${data.rooms > 1 ? 's' : ''}` : null,
        data.nights ? `${data.nights} night${data.nights > 1 ? 's' : ''}` : null,
      ]
        .filter(Boolean)
        .join(' • ');
      updateData.notes = notes || null;
    }

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: updateData,
      include: {
        reservationType: {
          include: {
            category: true,
          },
        },
        reservationStatus: true,
      },
    });

    revalidatePath('/exp');

    return {
      success: true,
      reservation: updated,
    };
  } catch (error) {
    console.error("Error updating hotel reservation:", error);
    throw error;
  }
}

/**
 * Delete a hotel reservation
 */
export async function deleteHotelReservation(reservationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify the reservation belongs to the user's trip
    const reservation = await prisma.reservation.findFirst({
      where: {
        id: reservationId,
        segment: {
          trip: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!reservation) {
      throw new Error("Reservation not found or unauthorized");
    }

    await prisma.reservation.delete({
      where: { id: reservationId },
    });

    revalidatePath('/exp');

    return { success: true };
  } catch (error) {
    console.error("Error deleting hotel reservation:", error);
    throw error;
  }
}

/**
 * Helper function to convert 12-hour time to 24-hour format
 */
function convertTo24Hour(time: string): string {
  if (!time) return '00:00:00';
  
  // If already in 24-hour format, return as is
  if (!time.toLowerCase().includes('am') && !time.toLowerCase().includes('pm')) {
    return time.includes(':') ? `${time}:00` : time;
  }

  const [timePart, period] = time.split(/\s+/);
  let [hours, minutes] = timePart.split(':').map(Number);

  if (period?.toLowerCase() === 'pm' && hours !== 12) {
    hours += 12;
  } else if (period?.toLowerCase() === 'am' && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${(minutes || 0).toString().padStart(2, '0')}:00`;
}

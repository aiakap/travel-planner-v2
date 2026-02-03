"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getReservationType, getReservationStatus } from "@/lib/db/reservation-lookups";
import { getTimeZoneForLocation } from "./timezone";
import { localToUTC, stringToPgDate, stringToPgTime } from "@/lib/utils/local-time";

// Geocoding helper for hotel addresses
async function geocodeAddress(address: string): Promise<{
  lat: number;
  lng: number;
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === "OK" && data.results[0]) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      };
    }
  } catch (error) {
    console.error("Hotel address geocoding error:", error);
  }

  return null;
}

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
    // Get cached reservation type and status
    const hotelType = await getReservationType("Stay", "Hotel");
    const confirmedStatus = await getReservationStatus("Confirmed");

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

    // Get timezone for hotel location
    let hotelTimezone: string | null = null;
    let hotelLat: number | null = null;
    let hotelLng: number | null = null;

    if (data.address) {
      const geo = await geocodeAddress(data.address);
      if (geo) {
        hotelLat = geo.lat;
        hotelLng = geo.lng;
        const tzInfo = await getTimeZoneForLocation(geo.lat, geo.lng);
        if (tzInfo) {
          hotelTimezone = tzInfo.timeZoneId;
          console.log(`[HotelReservation] Timezone for ${data.hotelName}: ${hotelTimezone}`);
        }
      }
    }

    // Convert times to 24-hour format
    const checkInTime24 = data.checkInTime ? convertTo24Hour(data.checkInTime) : "15:00:00";
    const checkOutTime24 = data.checkOutTime ? convertTo24Hour(data.checkOutTime) : "11:00:00";

    // Calculate UTC times
    let utcStartTime: Date | null = null;
    let utcEndTime: Date | null = null;

    if (data.checkInDate) {
      if (hotelTimezone) {
        utcStartTime = localToUTC(data.checkInDate, checkInTime24, hotelTimezone, false);
      } else {
        utcStartTime = new Date(`${data.checkInDate}T${checkInTime24}`);
      }
    }

    if (data.checkOutDate) {
      if (hotelTimezone) {
        utcEndTime = localToUTC(data.checkOutDate, checkOutTime24, hotelTimezone, false);
      } else {
        utcEndTime = new Date(`${data.checkOutDate}T${checkOutTime24}`);
      }
    }

    // Create notes with room details
    const notes = [
      data.roomType ? `Room: ${data.roomType}` : null,
      data.guests ? `${data.guests} guest${data.guests > 1 ? 's' : ''}` : null,
      data.rooms ? `${data.rooms} room${data.rooms > 1 ? 's' : ''}` : null,
      data.nights ? `${data.nights} night${data.nights > 1 ? 's' : ''}` : null,
    ]
      .filter(Boolean)
      .join(' • ');

    // Create the reservation with proper timezone handling
    const reservation = await prisma.reservation.create({
      data: {
        name: data.hotelName,
        vendor: data.hotelName,
        confirmationNumber: data.confirmationNumber,
        notes: notes || null,
        reservationTypeId: hotelType.id,
        reservationStatusId: confirmedStatus.id,
        segmentId: targetSegmentId,
        // Wall clock fields (what the user sees)
        wall_start_date: data.checkInDate ? stringToPgDate(data.checkInDate) : null,
        wall_start_time: stringToPgTime(checkInTime24),
        wall_end_date: data.checkOutDate ? stringToPgDate(data.checkOutDate) : null,
        wall_end_time: stringToPgTime(checkOutTime24),
        // UTC fields (for sorting/filtering)
        startTime: utcStartTime,
        endTime: utcEndTime,
        // Location and timezone info
        location: data.address,
        latitude: hotelLat,
        longitude: hotelLng,
        timeZoneId: hotelTimezone,
        // Other fields
        cost: data.totalCost,
        currency: data.currency || 'USD',
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

    // Handle date/time updates with timezone awareness
    if (data.checkInDate || data.checkInTime || data.checkOutDate || data.checkOutTime) {
      // Get timezone - use existing or geocode if address is provided/updated
      let hotelTimezone = (reservation as any).timeZoneId || null;
      
      if (data.address && !hotelTimezone) {
        const geo = await geocodeAddress(data.address);
        if (geo) {
          const tzInfo = await getTimeZoneForLocation(geo.lat, geo.lng);
          if (tzInfo) {
            hotelTimezone = tzInfo.timeZoneId;
            updateData.timeZoneId = hotelTimezone;
            updateData.latitude = geo.lat;
            updateData.longitude = geo.lng;
          }
        }
      }

      if (data.checkInDate || data.checkInTime) {
        // Get current date/time from wall clock fields if available
        const currentWallDate = (reservation as any).wall_start_date;
        const currentWallTime = (reservation as any).wall_start_time;
        
        let newDate = data.checkInDate;
        if (!newDate && currentWallDate) {
          newDate = currentWallDate.toISOString().split('T')[0];
        } else if (!newDate && reservation.startTime) {
          newDate = reservation.startTime.toISOString().split('T')[0];
        }
        
        let newTime24 = data.checkInTime ? convertTo24Hour(data.checkInTime) : "15:00:00";
        if (!data.checkInTime && currentWallTime) {
          // Use local time methods - Prisma uses local time for TIME fields
          const h = currentWallTime.getHours().toString().padStart(2, '0');
          const m = currentWallTime.getMinutes().toString().padStart(2, '0');
          newTime24 = `${h}:${m}:00`;
        }
        
        if (newDate) {
          updateData.wall_start_date = stringToPgDate(newDate);
          updateData.wall_start_time = stringToPgTime(newTime24);
          
          if (hotelTimezone) {
            updateData.startTime = localToUTC(newDate, newTime24, hotelTimezone, false);
          } else {
            updateData.startTime = new Date(`${newDate}T${newTime24}`);
          }
        }
      }

      if (data.checkOutDate || data.checkOutTime) {
        // Get current date/time from wall clock fields if available
        const currentWallDate = (reservation as any).wall_end_date;
        const currentWallTime = (reservation as any).wall_end_time;
        
        let newDate = data.checkOutDate;
        if (!newDate && currentWallDate) {
          newDate = currentWallDate.toISOString().split('T')[0];
        } else if (!newDate && reservation.endTime) {
          newDate = reservation.endTime.toISOString().split('T')[0];
        }
        
        let newTime24 = data.checkOutTime ? convertTo24Hour(data.checkOutTime) : "11:00:00";
        if (!data.checkOutTime && currentWallTime) {
          // Use local time methods - Prisma uses local time for TIME fields
          const h = currentWallTime.getHours().toString().padStart(2, '0');
          const m = currentWallTime.getMinutes().toString().padStart(2, '0');
          newTime24 = `${h}:${m}:00`;
        }
        
        if (newDate) {
          updateData.wall_end_date = stringToPgDate(newDate);
          updateData.wall_end_time = stringToPgTime(newTime24);
          
          if (hotelTimezone) {
            updateData.endTime = localToUTC(newDate, newTime24, hotelTimezone, false);
          } else {
            updateData.endTime = new Date(`${newDate}T${newTime24}`);
          }
        }
      }
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

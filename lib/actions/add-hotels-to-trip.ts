"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { HotelExtraction } from "@/lib/schemas/hotel-extraction-schema";
import { getReservationType, getReservationStatus } from "@/lib/db/reservation-lookups";

export async function addHotelsToTrip(
  tripId: string,
  segmentId: string,
  hotelData: HotelExtraction
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify trip ownership and segment belongs to trip
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: session.user.id },
    include: { segments: true },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  // Verify segment belongs to this trip
  const segment = trip.segments.find(s => s.id === segmentId);
  if (!segment) {
    throw new Error("Segment not found or does not belong to this trip");
  }

  // Get cached reservation type and status
  const hotelType = await getReservationType("Stay", "Hotel");
  const confirmedStatus = await getReservationStatus("Confirmed");

  // Helper to convert "3:00 PM" to "15:00:00"
  function convertTo24Hour(time: string): string {
    if (!time || time === "") return "15:00:00"; // Default check-in time
    
    const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return "15:00:00";
    
    let [_, hours, minutes, period] = match;
    let h = parseInt(hours);
    
    if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    
    return `${h.toString().padStart(2, '0')}:${minutes}:00`;
  }

  // Calculate number of nights
  const checkIn = new Date(hotelData.checkInDate);
  const checkOut = new Date(hotelData.checkOutDate);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  // Build notes from hotel details
  const notes = [
    hotelData.roomType && hotelData.roomType !== "" ? `Room Type: ${hotelData.roomType}` : null,
    hotelData.numberOfRooms > 0 ? `Rooms: ${hotelData.numberOfRooms}` : null,
    hotelData.numberOfGuests > 0 ? `Guests: ${hotelData.numberOfGuests}` : null,
    nights > 0 ? `Nights: ${nights}` : null,
    hotelData.bookingDate && hotelData.bookingDate !== "" ? `Booked: ${hotelData.bookingDate}` : null,
  ].filter(Boolean).join('\n');

  // Create the hotel reservation
  const reservation = await prisma.reservation.create({
    data: {
      name: hotelData.hotelName,
      confirmationNumber: hotelData.confirmationNumber,
      reservationTypeId: hotelType.id,
      reservationStatusId: confirmedStatus.id,
      segmentId,
      startTime: new Date(`${hotelData.checkInDate}T${convertTo24Hour(hotelData.checkInTime)}`),
      endTime: new Date(`${hotelData.checkOutDate}T${convertTo24Hour(hotelData.checkOutTime || "11:00 AM")}`),
      cost: hotelData.totalCost && hotelData.totalCost !== 0 ? hotelData.totalCost : undefined,
      currency: hotelData.currency && hotelData.currency !== "" ? hotelData.currency : undefined,
      location: hotelData.address && hotelData.address !== "" ? hotelData.address : undefined,
      notes: notes || undefined,
    },
  });

  return {
    success: true,
    count: 1,
    reservation,
  };
}

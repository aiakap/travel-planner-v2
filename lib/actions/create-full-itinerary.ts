"use server";

import { auth } from "@/auth";
import { createQuickTrip } from "./create-quick-trip";
import { createSegment } from "./create-segment";
import { createReservationSimple } from "./create-reservation-simple";
import { linkConversationToTrip } from "./link-conversation-to-trip";

export interface CreateFullItineraryParams {
  destination: string;
  startDate: Date;
  endDate: Date;
  title?: string;
  description?: string;
  hotelNames?: string[];
  restaurantNames?: string[];
  activityNames?: string[];
  conversationId?: string;
  defaultStatus?: string;
}

/**
 * Create a full itinerary with trip, segment, and reservations
 * This is the main orchestration function for AI-driven trip creation
 */
export async function createFullItinerary({
  destination,
  startDate,
  endDate,
  title,
  description,
  hotelNames = [],
  restaurantNames = [],
  activityNames = [],
  conversationId,
  defaultStatus = "Pending", // Default to "Pending" (UI shows as "Suggested")
}: CreateFullItineraryParams) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // 1. Create trip
  const tripTitle = title || `Trip to ${destination}`;
  const tripDescription = description || `Exploring ${destination}`;
  
  const tripId = await createQuickTrip({
    title: tripTitle,
    startDate,
    endDate,
    description: tripDescription,
  });

  console.log(`✓ Created trip: ${tripId} (${tripTitle})`);

  // 2. Link conversation to trip
  if (conversationId) {
    try {
      await linkConversationToTrip(conversationId, tripId, tripTitle);
      console.log(`✓ Linked conversation ${conversationId} to trip ${tripId}`);
    } catch (error) {
      console.error("❌ Failed to link conversation to trip:", error);
      // Don't fail the whole operation if linking fails
    }
  }

  // 3. Create main segment
  const segmentId = await createSegment({
    tripId,
    name: `Stay in ${destination}`,
    startLocation: destination,
    endLocation: destination,
    startTime: startDate,
    endTime: endDate,
    segmentType: "Other",
  });

  console.log(`✓ Created segment: ${segmentId}`);

  // 4. Create reservations (with specified status)
  const createdReservations: string[] = [];

  // Hotels
  for (const hotelName of hotelNames) {
    try {
      const reservationId = await createReservationSimple({
        segmentId,
        name: hotelName,
        category: "Stay",
        type: "Hotel",
        status: defaultStatus,
        startTime: startDate,
        endTime: endDate,
      });
      createdReservations.push(reservationId);
      console.log(`✓ Created hotel reservation: ${hotelName}`);
    } catch (error) {
      console.error(`❌ Failed to create hotel reservation (${hotelName}):`, error);
    }
  }

  // Restaurants
  for (const restaurantName of restaurantNames) {
    try {
      const reservationId = await createReservationSimple({
        segmentId,
        name: restaurantName,
        category: "Dining",
        type: "Restaurant",
        status: defaultStatus,
      });
      createdReservations.push(reservationId);
      console.log(`✓ Created restaurant reservation: ${restaurantName}`);
    } catch (error) {
      console.error(`❌ Failed to create restaurant reservation (${restaurantName}):`, error);
    }
  }

  // Activities
  for (const activityName of activityNames) {
    try {
      const reservationId = await createReservationSimple({
        segmentId,
        name: activityName,
        category: "Activity",
        type: "Tour",
        status: defaultStatus,
      });
      createdReservations.push(reservationId);
      console.log(`✓ Created activity reservation: ${activityName}`);
    } catch (error) {
      console.error(`❌ Failed to create activity reservation (${activityName}):`, error);
    }
  }

  console.log(`✅ Full itinerary created: ${tripId} with ${createdReservations.length} reservations`);

  return { 
    tripId, 
    segmentId,
    reservationIds: createdReservations,
  };
}

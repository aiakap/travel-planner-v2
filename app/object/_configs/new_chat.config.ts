/**
 * New Chat Configuration
 * For managing trips with AI assistance
 */

import { ObjectConfig } from "./types";
import { TripView } from "../_views/trip-view";
import { HotelCard } from "../_cards/hotel-card";
import { fetchTripData } from "@/lib/object/data-fetchers/trip";

export const newChatConfig: ObjectConfig = {
  id: "new_chat",
  name: "Trip Chat",
  description: "Manage your trip with AI assistance",

  systemPrompt: `You are a helpful travel assistant. Help users manage their trip by:
- Suggesting hotels, restaurants, and activities
- Answering questions about their itinerary
- Helping them book reservations
- Providing travel tips and recommendations

When suggesting hotels, return them in this format:
[HOTEL_CARD: {
  "name": "Hotel Name",
  "rating": 4.5,
  "price": "$200/night",
  "location": "City, Country",
  "description": "Brief description",
  "amenities": ["WiFi", "Pool", "Gym"]
}]

Be conversational and helpful. Focus on making their trip amazing!`,

  dataSource: {
    fetch: async (userId: string, params?: any) => {
      const tripId = params?.tripId;
      return await fetchTripData(userId, tripId);
    },
  },

  leftPanel: {
    welcomeMessage: "How can I help with your trip today?",
    placeholder: "Ask about hotels, restaurants, activities...",
    cardRenderers: {
      hotel: HotelCard,
    },
  },

  rightPanel: {
    component: TripView,
  },
};

/**
 * Profile Topics Configuration
 * Defines all the topics that can be explored in the Profile Builder
 */

export interface ProfileTopic {
  id: string;
  name: string;
  question: string;
  category: string;
  options: string[];
  allowMultiple?: boolean;
  relatedTopics?: string[]; // IDs of related topics to suggest next
  priority?: number; // Lower number = higher priority
}

export const PROFILE_TOPICS: ProfileTopic[] = [
  // Transportation Topics
  {
    id: "airlines",
    name: "Airlines",
    question: "What about airlines? Do you have a preference?",
    category: "Transportation",
    options: ["United", "Delta", "American", "Southwest", "JetBlue", "Alaska", "No preference"],
    allowMultiple: true,
    priority: 5,
    relatedTopics: ["seating", "class_preference"]
  },
  {
    id: "seating",
    name: "Seating Preference",
    question: "Where do you prefer to sit on a plane?",
    category: "Transportation",
    options: ["Window", "Aisle", "Middle (if with someone)", "Extra legroom", "No preference"],
    allowMultiple: false,
    priority: 6,
    relatedTopics: ["class_preference"]
  },
  {
    id: "class_preference",
    name: "Flight Class",
    question: "What class do you typically fly?",
    category: "Transportation",
    options: ["Economy", "Premium Economy", "Business", "First Class", "Whatever's available"],
    allowMultiple: false,
    priority: 7,
    relatedTopics: ["ground_transport"]
  },
  {
    id: "ground_transport",
    name: "Ground Transportation",
    question: "How do you prefer to get around when traveling?",
    category: "Transportation",
    options: ["Rental car", "Public transit", "Taxi/Uber", "Walking", "Bicycle", "Mix of everything"],
    allowMultiple: true,
    priority: 8
  },

  // Travel Style Topics
  {
    id: "budget_level",
    name: "Budget Level",
    question: "What's your typical travel budget style?",
    category: "Travel Style",
    options: ["Luxury", "Mid-range", "Budget-conscious", "Backpacker", "It varies"],
    allowMultiple: false,
    priority: 2,
    relatedTopics: ["splurge_categories"]
  },
  {
    id: "travel_pace",
    name: "Travel Pace",
    question: "What pace do you prefer when traveling?",
    category: "Travel Style",
    options: ["Fast-paced (see everything)", "Moderate", "Relaxed (take it easy)", "Spontaneous"],
    allowMultiple: false,
    priority: 3,
    relatedTopics: ["planning_style"]
  },
  {
    id: "planning_style",
    name: "Planning Style",
    question: "How do you approach trip planning?",
    category: "Travel Style",
    options: ["Detailed itinerary", "General plan", "Completely spontaneous", "Mix of both"],
    allowMultiple: false,
    priority: 4
  },
  {
    id: "travel_companions",
    name: "Travel Companions",
    question: "Who do you typically travel with?",
    category: "Travel Style",
    options: ["Solo", "Partner/Spouse", "Family", "Friends", "Group tours", "It varies"],
    allowMultiple: true,
    priority: 1,
    relatedTopics: ["budget_level"]
  },

  // Accommodations Topics
  {
    id: "hotel_type",
    name: "Accommodation Type",
    question: "What type of accommodations do you prefer?",
    category: "Accommodations",
    options: ["Boutique hotels", "Chain hotels", "Resorts", "Hostels", "Vacation rentals", "B&Bs", "Camping"],
    allowMultiple: true,
    priority: 10,
    relatedTopics: ["hotel_amenities"]
  },
  {
    id: "hotel_amenities",
    name: "Hotel Amenities",
    question: "What amenities are important to you?",
    category: "Accommodations",
    options: ["Pool", "Gym", "Spa", "Breakfast included", "Kitchen", "Free WiFi", "Parking"],
    allowMultiple: true,
    priority: 11,
    relatedTopics: ["location_preference"]
  },
  {
    id: "location_preference",
    name: "Location Preference",
    question: "Where do you prefer to stay?",
    category: "Accommodations",
    options: ["City center", "Near beach", "Mountains", "Countryside", "Near attractions", "Quiet area"],
    allowMultiple: true,
    priority: 12
  },

  // Destination Topics
  {
    id: "climate_preference",
    name: "Climate Preference",
    question: "What climates do you enjoy?",
    category: "Destinations",
    options: ["Tropical", "Temperate", "Cold/Snowy", "Desert", "Mediterranean", "All climates"],
    allowMultiple: true,
    priority: 13,
    relatedTopics: ["destination_type"]
  },
  {
    id: "destination_type",
    name: "Destination Type",
    question: "What types of destinations appeal to you?",
    category: "Destinations",
    options: ["Beach", "City", "Mountains", "Countryside", "Islands", "Historical sites", "Adventure locations"],
    allowMultiple: true,
    priority: 14,
    relatedTopics: ["regions"]
  },
  {
    id: "regions",
    name: "Regions of Interest",
    question: "Which regions interest you most?",
    category: "Destinations",
    options: ["Europe", "Asia", "North America", "South America", "Africa", "Oceania", "Middle East"],
    allowMultiple: true,
    priority: 15
  },

  // Dining & Food Topics
  {
    id: "dietary_restrictions",
    name: "Dietary Restrictions",
    question: "Do you have any dietary restrictions?",
    category: "Dining",
    options: ["None", "Vegetarian", "Vegan", "Gluten-free", "Kosher", "Halal", "Dairy-free", "Nut allergies"],
    allowMultiple: true,
    priority: 16,
    relatedTopics: ["cuisine_preferences"]
  },
  {
    id: "cuisine_preferences",
    name: "Cuisine Preferences",
    question: "What cuisines do you enjoy?",
    category: "Dining",
    options: ["Italian", "Asian", "Mexican", "French", "Mediterranean", "Indian", "American", "Local/Traditional"],
    allowMultiple: true,
    priority: 17,
    relatedTopics: ["dining_style"]
  },
  {
    id: "dining_style",
    name: "Dining Style",
    question: "How do you prefer to dine when traveling?",
    category: "Dining",
    options: ["Fine dining", "Casual restaurants", "Street food", "Local markets", "Hotel dining", "Mix of everything"],
    allowMultiple: true,
    priority: 18
  },

  // Budget & Spending Topics
  {
    id: "splurge_categories",
    name: "Splurge Categories",
    question: "What are you willing to splurge on?",
    category: "Budget",
    options: ["Hotels", "Dining", "Activities", "Shopping", "Transportation", "Nothing - budget all around"],
    allowMultiple: true,
    priority: 19,
    relatedTopics: ["saving_priorities"]
  },
  {
    id: "saving_priorities",
    name: "Money-Saving Priorities",
    question: "Where do you prefer to save money?",
    category: "Budget",
    options: ["Accommodations", "Food", "Transportation", "Activities", "Shopping", "I don't focus on saving"],
    allowMultiple: true,
    priority: 20
  },

  // Dislikes & Concerns Topics
  {
    id: "travel_dislikes",
    name: "Travel Dislikes",
    question: "What do you prefer to avoid when traveling?",
    category: "Dislikes",
    options: ["Crowds", "Long flights", "Cold weather", "Hot weather", "Tourist traps", "Language barriers", "Early mornings"],
    allowMultiple: true,
    priority: 21,
    relatedTopics: ["travel_concerns"]
  },
  {
    id: "travel_concerns",
    name: "Travel Concerns",
    question: "What concerns do you have when traveling?",
    category: "Concerns",
    options: ["Safety", "Health", "Language barriers", "Getting lost", "Food safety", "Accessibility", "None really"],
    allowMultiple: true,
    priority: 22
  },

  // Special Considerations Topics
  {
    id: "accessibility",
    name: "Accessibility Needs",
    question: "Do you have any accessibility requirements?",
    category: "Special Considerations",
    options: ["Wheelchair accessible", "Mobility assistance", "Visual impairment", "Hearing impairment", "None"],
    allowMultiple: true,
    priority: 23
  },
  {
    id: "special_requirements",
    name: "Special Requirements",
    question: "Any other special considerations?",
    category: "Special Considerations",
    options: ["Travel with pets", "Remote work setup needed", "Medical considerations", "Traveling with children", "None"],
    allowMultiple: true,
    priority: 24
  },
];

/**
 * Get topics by category
 */
export function getTopicsByCategory(category: string): ProfileTopic[] {
  return PROFILE_TOPICS.filter(topic => topic.category === category);
}

/**
 * Get topic by ID
 */
export function getTopicById(id: string): ProfileTopic | undefined {
  return PROFILE_TOPICS.find(topic => topic.id === id);
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(PROFILE_TOPICS.map(topic => topic.category)));
}

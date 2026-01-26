/**
 * Profile Category Rules
 * Keyword-based rules for categorizing profile items
 * Now uses database category slugs
 */

import { CategoryRule, ProcessorConfig } from "../category-processor";

export const PROFILE_CATEGORY_RULES: CategoryRule[] = [
  // Airlines & Transportation
  {
    keywords: ["united", "delta", "american airlines", "southwest", "jetblue", "alaska airlines"],
    categorySlug: "airlines",
    priority: 10
  },
  {
    keywords: ["1k", "platinum", "gold", "silver", "diamond", "premier"],
    categorySlug: "loyalty-programs",
    priority: 9
  },
  {
    keywords: ["first class", "business class", "economy", "premium economy"],
    categorySlug: "travel-class",
    priority: 10
  },
  
  // Hotels & Accommodations
  {
    keywords: ["marriott", "hilton", "hyatt", "ihg", "accor", "four seasons", "ritz-carlton"],
    categorySlug: "brands",
    priority: 10
  },
  {
    keywords: ["hotel", "resort", "airbnb", "vrbo", "hostel", "boutique"],
    categorySlug: "types",
    priority: 8
  },
  {
    keywords: ["amex fine hotels", "virtuoso", "preferred hotels"],
    categorySlug: "brands",
    priority: 10
  },
  
  // Activities - Outdoor
  {
    keywords: ["hiking", "camping", "backpacking", "rock climbing", "mountaineering"],
    categorySlug: "outdoor",
    priority: 10
  },
  {
    keywords: ["surfing", "swimming", "diving", "snorkeling", "kayaking", "paddleboarding"],
    categorySlug: "outdoor",
    priority: 10
  },
  {
    keywords: ["skiing", "snowboarding", "ice skating"],
    categorySlug: "outdoor",
    priority: 10
  },
  
  // Activities - Sports
  {
    keywords: ["running", "marathon", "triathlon", "cycling", "biking", "tennis", "golf"],
    categorySlug: "sports",
    priority: 10
  },
  
  // Activities - Cultural
  {
    keywords: ["museum", "art gallery", "theater", "opera", "concert", "architecture"],
    categorySlug: "cultural",
    priority: 10
  },
  
  // Activities - Culinary
  {
    keywords: ["cooking class", "wine tasting", "food tour", "brewery tour"],
    categorySlug: "culinary-activities",
    priority: 10
  },
  
  // Dining & Cuisine
  {
    keywords: ["italian", "french", "japanese", "chinese", "mexican", "thai", "indian", "mediterranean"],
    categorySlug: "cuisines",
    priority: 10
  },
  {
    keywords: ["street food", "fine dining", "casual dining", "food truck"],
    categorySlug: "dining-style",
    priority: 10
  },
  {
    keywords: ["vegetarian", "vegan", "gluten-free", "kosher", "halal"],
    categorySlug: "dietary",
    priority: 10
  },
  
  // Destinations
  {
    keywords: ["europe", "asia", "africa", "south america", "north america", "oceania", "middle east"],
    categorySlug: "regions",
    priority: 9
  },
  {
    keywords: ["paris", "london", "tokyo", "new york", "rome", "barcelona", "dubai"],
    categorySlug: "cities",
    priority: 10
  },
  {
    keywords: ["hawaii", "kauai", "maui", "oahu", "big island"],
    categorySlug: "regions",
    priority: 10
  },
  {
    keywords: ["france", "italy", "spain", "germany", "portugal", "greece"],
    categorySlug: "countries",
    priority: 10
  },
  
  // Travel Companions
  {
    keywords: ["wife", "husband", "spouse", "partner"],
    categorySlug: "partner",
    priority: 10
  },
  {
    keywords: ["kids", "children", "family"],
    categorySlug: "family-companion",
    priority: 10
  },
  {
    keywords: ["solo", "alone"],
    categorySlug: "solo-companion",
    priority: 10
  },
];

export const PROFILE_PROCESSOR_CONFIG: ProcessorConfig = {
  rules: PROFILE_CATEGORY_RULES,
  defaultCategorySlug: "general"
};
